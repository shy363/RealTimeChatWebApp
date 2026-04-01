import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Message, User } from '../types';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { messageService } from '../services/messages';
import { contactService } from '../services/contacts';
import { io, Socket } from 'socket.io-client';
import AddContactModal from '../components/AddContactModal';
import { customEncrypt, customDecrypt } from '../utils/security';

const Chat = () => {
  const getSharedKey = (id1: string, id2: string) => {
    return [id1, id2].sort().join('');
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedContactRef = useRef<User | null>(null);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Initial setup: Fetch contacts and initialize socket
  const fetchContacts = async () => {
    try {
      const users = await contactService.getContacts();
      setContacts(users);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchContacts();

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = isLocal ? 'http://localhost:5001' : 'https://chatapp-backend-shyna.loca.lt';
    const newSocket = io(backendUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('onlineUsers', (ids: string[]) => {
      setOnlineUserIds(new Set(ids));
    });

    newSocket.on('userStatusChanged', ({ userId: statusId, status }) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(statusId);
        else next.delete(statusId);
        return next;
      });
    });

    newSocket.on('newMessage', (message: Message) => {
      // Functional update to get latest current contact
      setSelectedContact(current => {
        if (current && (message.userId === current.id || message.recipientId === current.id)) {
          // UNIQUE SEC: Decrypt incoming live message using SHARED KEY
          const sharedKey = getSharedKey(user?.id || '', current.id);
          const decryptedMsg = { 
            ...message, 
            content: customDecrypt(message.content, sharedKey) 
          };

          setMessages((prev) => {
            if (prev.find(m => m.id === message.id)) return prev;
            return [...prev, decryptedMsg];
          });
        } else if (message.userId !== user?.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [message.userId]: (prev[message.userId] || 0) + 1
          }));
        }
        return current;
      });
    });

    newSocket.on('newUser', (newUser: User) => {
      if (newUser.id !== user?.id) {
        setContacts(prev => {
          if (prev.find(u => u.id === newUser.id)) return prev;
          return [...prev, newUser];
        });
      }
    });

    newSocket.on('userTyping', ({ userId: typingId }) => {
      if (typingId === selectedContactRef.current?.id) {
        setTypingUser(typingId);
      }
    });

    newSocket.on('userStoppedTyping', ({ userId: typingId }) => {
      if (typingId === selectedContactRef.current?.id) {
        setTypingUser(null);
      }
    });

    newSocket.on('friendRequestAccepted', ({ contactId }) => {
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, status: 'accepted' } : c
      ));
      if (selectedContactRef.current?.id === contactId) {
        setSelectedContact(prev => prev ? { ...prev, status: 'accepted' } : null);
      }
    });

    newSocket.on('newFriendRequest', () => {
      fetchContacts();
    });

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user?.id]);

  // Handle switching contacts
  useEffect(() => {
    if (!socket || !user) return;

    const changeRoom = async () => {
      const contactId = selectedContact?.id;
      if (contactId) {
        const msgs = await messageService.getMessages(contactId);
        // UNIQUE SEC: Decrypt history using SHARED KEY
        const sharedKey = getSharedKey(user?.id || '', contactId);
        const decryptedMsgs = msgs.map(m => ({
          ...m,
          content: customDecrypt(m.content, sharedKey)
        }));
        setMessages(decryptedMsgs);
      } else {
        setMessages([]);
      }
    };

    changeRoom();
  }, [selectedContact, socket, user]);

  const sendMessage = (content: string) => {
    if (socket && content.trim() && selectedContact) {
      // UNIQUE SEC: Encrypt outgoing message using SHARED KEY
      const sharedKey = getSharedKey(user?.id || '', selectedContact.id);
      const encryptedContent = customEncrypt(content.trim(), sharedKey);
      
      socket.emit('sendMessage', { 
        content: encryptedContent, 
        recipientId: selectedContact.id 
      });
      // Stop typing immediately when sent
      socket.emit('stopTyping', { recipientId: selectedContact.id });
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedContact) return;

    socket.emit('typing', { recipientId: selectedContact.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { recipientId: selectedContact.id });
    }, 3000);
  };

  const handleContactSelect = (contact: User) => {
    setSelectedContact(contact);
    // Clear unread count when selected
    setUnreadCounts(prev => ({
      ...prev,
      [contact.id]: 0
    }));
  };

  const handleAcceptRequest = async (contactId: string) => {
    try {
      await contactService.acceptRequest(contactId);
      await fetchContacts();
      if (selectedContact?.id === contactId) {
        setSelectedContact(prev => prev ? { ...prev, status: 'accepted' } : null);
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleLogout = () => {
    logout();
    socket?.close();
    navigate('/login');
  };

  const filteredContacts = contacts.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-app-container">
      <header className="chat-header">
        <div className="chat-logo">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="custom-btn"
            style={{ padding: '8px', marginRight: '8px', display: window.innerWidth < 768 ? 'block' : 'none' }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="logo-badge">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h1 className="logo-text">ChatFlow</h1>
            <div className="status-indicator">
              <div className={`dot ${isConnected ? 'online' : 'offline'}`}></div>
              {isConnected ? 'Portal Live' : 'Connecting...'}
            </div>
          </div>
        </div>

        <div className="user-profile">
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '800' }}>{user?.username}</p>
            <p style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700' }}>ONLINE</p>
          </div>
          <div className="avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="chat-app-main">
        <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '18px', fontWeight: '800' }}>Messages</h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="custom-btn"
                style={{ padding: '8px 12px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                ADD
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="custom-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sidebar-content">
            <div className="invite-box">
              <p style={{ fontSize: '10px', fontWeight: '800', opacity: 0.8 }}>YOUR INVITE CODE</p>
              <div className="invite-code-row">
                <span className="invite-code-text">{user?.inviteCode}</span>
                <button 
                  onClick={() => {
                    const link = `${window.location.origin}/invite/${user?.inviteCode}`;
                    navigator.clipboard.writeText(link);
                    alert('Copied!');
                  }}
                  className="custom-btn"
                  style={{ padding: '8px', background: 'white', color: 'var(--primary)' }}
                >
                  Copy
                </button>
              </div>
            </div>

            <p style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', marginBottom: '12px' }}>CONTACTS</p>
            
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id} 
                onClick={() => handleContactSelect(contact)}
                className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
              >
                <div className="avatar" style={{ background: selectedContact?.id === contact.id ? 'var(--primary)' : '#e2e8f0', color: selectedContact?.id === contact.id ? 'white' : '#64748b' }}>
                  {contact.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center justify-between">
                    <p style={{ fontWeight: '700', fontSize: '14px' }}>{contact.username}</p>
                    {unreadCounts[contact.id] > 0 && <span className="unread-badge">{unreadCounts[contact.id]}</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {contact.status === 'pending' ? 'Wants to chat' : contact.status === 'sent' ? 'Request sent' : 'Active'}
                  </p>
                </div>
                {contact.status === 'pending' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAcceptRequest(contact.id); }}
                    className="custom-btn"
                    style={{ padding: '6px 12px', fontSize: '10px' }}
                  >
                    Accept
                  </button>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="chat-view">
          {!selectedContact ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800' }}>Welcome to ChatFlow</h3>
              <p>Select a contact to start messaging privately.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="flex items-center gap-3">
                  <div className="avatar">{selectedContact.username.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={{ fontWeight: '800' }}>{selectedContact.username}</p>
                    <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>
                      {onlineUserIds.has(selectedContact.id) ? 'ONLINE' : 'OFFLINE'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <p>No messages yet. Send a greeting!</p>
                  </div>
                ) : (
                  <MessageList messages={messages} currentUserId={user?.id} />
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedContact.status === 'accepted' ? (
                <div className="chat-input-area">
                  {typingUser && (
                    <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', marginBottom: '8px' }}>
                      {selectedContact.username} is typing...
                    </p>
                  )}
                  <MessageInput onSendMessage={sendMessage} onTyping={handleTyping} />
                </div>
              ) : (
                <div className="chat-input-area" style={{ textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {selectedContact.status === 'sent' 
                      ? 'Waiting for request to be accepted...' 
                      : 'Accept the request to start chatting.'}
                  </p>
                  {selectedContact.status === 'pending' && (
                    <button 
                      onClick={() => handleAcceptRequest(selectedContact.id)}
                      className="custom-btn"
                      style={{ marginTop: '12px' }}
                    >
                      Accept Chat Request
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <AddContactModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onContactAdded={fetchContacts}
        currentUser={user}
      />
    </div>
  );
};

export default Chat;
