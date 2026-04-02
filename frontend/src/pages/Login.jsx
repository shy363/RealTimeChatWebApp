import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

// Simplified Security Elements - Just One Pattern Type
const PATTERN_EMOJIS = ['🌟', '🔮', '⚡', '🌙', '💫', '🎯', '🔥', '💎', '🌈', '⭐', '🚀', '✨', '🎨', '🌺', '🦋', '🌊'];

const Login = () => {
  const location = useLocation();
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      sender: 'bot', 
      text: "⚡ Identity Verification: Quantum Protocol Active.", 
      timestamp: Date.now(),
      type: 'text'
    },
    { 
      id: '2', 
      sender: 'bot', 
      text: "State your registered Alias to continue:", 
      timestamp: Date.now(),
      type: 'text'
    }
  ]);

  const [currentStep, setCurrentStep] = useState('username');
  const [authData, setAuthData] = useState({
    username: '',
    pattern: []
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStep]);

  const addMessage = (message) => {
    const newMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateBotTyping = async (duration = 1000) => {
    setIsTyping(true);
    addMessage({
      sender: 'bot',
      text: '...',
      type: 'typing'
    });
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    setMessages(prev => prev.slice(0, -1));
    setIsTyping(false);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const username = inputValue.trim();
    addMessage({
      sender: 'user',
      text: username,
      type: 'text'
    });

    setInputValue('');
    setAuthData(prev => ({ ...prev, username }));

    await simulateBotTyping(1000);

    addMessage({
      sender: 'bot',
      text: '🎨 Affirmative. Now, input your 3-emoji Quantum Signature:',
      type: 'text'
    });

    setCurrentStep('pattern');
  };

  const handlePatternClick = (emoji) => {
    if (authData.pattern.length >= 3) return;

    const newPattern = [...authData.pattern, emoji];
    setAuthData(prev => ({ ...prev, pattern: newPattern }));

    addMessage({
      sender: 'user',
      text: emoji,
      type: 'pattern',
      data: { emoji }
    });

    if (newPattern.length === 3) {
      setTimeout(async () => {
        await simulateBotTyping(800);

        addMessage({
          sender: 'bot',
          text: '🔐 Signature detected. Syncing with mainframe...',
          type: 'text'
        });

        // Trigger auto-login after pattern is complete
        handleFinalAuth(newPattern);
      }, 300);
    }
  };

  const handleFinalAuth = async (pattern) => {
    setLoading(true);
    try {
     const response = await login({
  username: authData.username,
  emojiPattern: pattern.join(',')
});
      
      if (response && response.user) {
        addMessage({
          sender: 'bot',
          text: `🛸 Welcome back, ${response.user.username}! Access granted.`,
          type: 'text'
        });

        setTimeout(() => {
          const inviteCode = location.state?.returnInvite;
          navigate(inviteCode ? `/invite/${inviteCode}` : '/chat');
        }, 1200);
      }
   } catch (error) {
  await simulateBotTyping(1000);
  const errorMessage = error.response?.data?.message || 'Access Denied: Signature Mismatch.';
  addMessage({ sender: 'bot', text: `⚠️ ${errorMessage}`, type: 'text' });
  
  setTimeout(() => {
    setAuthData({ username: '', pattern: [] });
    setCurrentStep('username');
    setInputValue('');   // ✅ ADD THIS LINE HERE

    addMessage({
      sender: 'bot',
      text: '🔄 Restarting... Enter your Alias:',
      type: 'text'
    });
  }, 1500);
}

  // Removed handlePassphraseSubmit as it's no longer used

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="flex items-center gap-3">
            <div className="icon-badge quantum-badge">
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 className="title-text">QuantumChat</h1>
              <span className="subtitle-text">QUICK SIGN IN</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button 
              onClick={() => {
                setAuthData({ username: '', pattern: [] });
                setCurrentStep('username');
                setMessages([
                  { 
                    id: '1', 
                    sender: 'bot', 
                    text: "🔄 Interface Rebooted. Enter your Alias:", 
                    timestamp: Date.now(),
                    type: 'text'
                  }
                ]);
              }}
              style={{
                background: 'none',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              Reset
            </button>
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="auth-chat">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender === 'bot' ? '' : 'me'}`}>
                <div className={`message-bubble ${msg.sender === 'bot' ? 'them' : 'me'} ${msg.type === 'typing' ? 'typing' : ''}`}>
                  {msg.type === 'pattern' && (
                    <span className="message-emoji">{msg.data?.emoji}</span>
                  )}
                  {msg.type === 'text' && msg.text}
                  {msg.type === 'typing' && (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Pattern Selection */}
        {currentStep === 'pattern' && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: 'var(--spacing-sm)', color: 'var(--text-primary)' }}>
              Pick 3 Emojis ({authData.pattern.length}/3)
            </div>
            <div className="auth-emoji-grid">
              {PATTERN_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handlePatternClick(emoji)}
                  className={`emoji-btn ${authData.pattern.includes(emoji) ? 'selected' : ''}`}
                  disabled={authData.pattern.includes(emoji) || authData.pattern.length >= 3}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="auth-input-area">
          {currentStep === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="chat-input-form">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter your Alias..."
                  className="chat-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading || isTyping}
                />
                <button 
                  type="submit" 
                  className="send-btn"
                  disabled={loading || isTyping || !inputValue.trim()}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          <div className="auth-progress">
            <div className="progress-steps">
              <div className={`step ${currentStep === 'username' || authData.username ? 'active' : ''}`}>
                <div className="step-icon">👤</div>
                <span>Identity</span>
              </div>
              <div className={`step ${currentStep === 'pattern' || authData.pattern.length > 0 ? 'active' : ''}`}>
                <div className="step-icon">🔒</div>
                <span>Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
