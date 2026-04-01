import { Message } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
}

const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) return null;

  return (
    <div className="messages-container">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          <div style={{ textAlign: 'center', margin: '24px 0', fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
            {formatDate(dateMessages[0].createdAt)}
          </div>
          
          {dateMessages.map((message) => {
            const isOwn = message.userId === currentUserId;
            return (
              <div key={message.id} className={`message-row ${isOwn ? 'me' : ''}`}>
                {!isOwn && (
                  <div className="avatar" style={{ marginRight: '10px', width: '32px', height: '32px', fontSize: '12px' }}>
                    {message.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  {!isOwn && <p style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px', marginLeft: '4px' }}>{message.username}</p>}
                  <div className={`bubble ${isOwn ? 'me' : 'them'}`}>
                    <p>{message.content}</p>
                    <span style={{ fontSize: '9px', opacity: 0.6, display: 'block', textAlign: 'right', marginTop: '4px' }}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
