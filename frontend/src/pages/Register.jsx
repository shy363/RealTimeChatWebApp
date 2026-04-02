import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

// Simplified Security Elements - Just One Pattern Type
const PATTERN_EMOJIS = ['🌟', '🔮', '⚡', '🌙', '💫', '🎯', '🔥', '💎', '🌈', '⭐', '🚀', '✨', '🎨', '🌺', '🦋', '🌊'];

const Register = () => {
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      sender: 'bot', 
      text: "🛡️ Quantum Identity Synthesis: Level 1 Clearance Required.", 
      timestamp: Date.now(),
      type: 'text'
    },
    { 
      id: '2', 
      sender: 'bot', 
      text: "Establish your digital Alias (this will be your public identifier):", 
      timestamp: Date.now(),
      type: 'text'
    }
  ]);

  const [currentStep, setCurrentStep] = useState('username');
  const [regData, setRegData] = useState({
    username: '',
    pattern: []
  });

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
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

  const simulateBotTyping = async (duration = 1500) => {
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
    setRegData(prev => ({ ...prev, username }));

    await simulateBotTyping(1500);

    addMessage({
      sender: 'bot',
      text: `Identity verified, ${username}. Now, select 3 emojis to synthesize your Quantum Signature:`,
      type: 'text'
    });

    setCurrentStep('pattern');
  };

  // Removed handleEmailSubmit as it's no longer used

  const handlePatternClick = (emoji) => {
    if (regData.pattern.length >= 3) return;

    const newPattern = [...regData.pattern, emoji];
    setRegData(prev => ({ ...prev, pattern: newPattern }));

    addMessage({
      sender: 'user',
      text: emoji,
      type: 'pattern',
      data: { emoji }
    });

    if (newPattern.length === 3) {
      setTimeout(async () => {
        await simulateBotTyping(1200);

        addMessage({
          sender: 'bot',
          text: '⚡ Signature captured. Encrypting quantum identity...',
          type: 'text'
        });

        // Trigger auto-register after pattern is complete
        handleFinalRegistration(newPattern);
      }, 500);
    }
  };

  const handleFinalRegistration = async (pattern) => {
    setLoading(true);
    try {
      const emojiString = pattern.join(',');
      const response = await register(regData.username, emojiString);
      
      if (response && response.user) {
        addMessage({
          sender: 'bot',
          text: `🎉 Welcome to the future, ${response.user.username}! Identity synthesized.`,
          type: 'text'
        });

        setTimeout(() => {
          navigate('/chat');
        }, 1800);
      }
    } catch (error) {
      await simulateBotTyping(1500);
      const errorMessage = error.response?.data?.message || 'Synthesis Failed: Alias already claimed.';
      addMessage({ sender: 'bot', text: `⚠️ ${errorMessage}`, type: 'text' });
      
      setTimeout(() => {
        setRegData({ username: '', pattern: [] });
        setCurrentStep('username');
        addMessage({ sender: 'bot', text: '🔄 Restarting... Enter a new Alias:', type: 'text' });
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Removed handlePassphraseSubmit as it's no longer used

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="flex items-center gap-3">
            <div className="icon-badge quantum-badge">
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 className="title-text">QuantumChat</h1>
              <span className="subtitle-text">QUANTUM IDENTITY</span>
            </div>
          </div>
          <Link to="/login" className="auth-link">
            Login
          </Link>
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
              Pick 3 Emojis ({regData.pattern.length}/3)
            </div>
            <div className="auth-emoji-grid">
              {PATTERN_EMOJIS.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handlePatternClick(emoji)}
                  className={`emoji-btn ${regData.pattern.includes(emoji) ? 'selected' : ''}`}
                  disabled={regData.pattern.includes(emoji) || regData.pattern.length >= 3}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="auth-input-area">
          {currentStep === 'username' && (
            <form onSubmit={handleUsernameSubmit} className="chat-input-form">
              <div className="input-container">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Establish your Alias..."
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
              <div className={`step ${currentStep === 'username' || regData.username ? 'active' : ''}`}>
                <div className="step-icon">👤</div>
                <span>Identity</span>
              </div>
              <div className={`step ${currentStep === 'pattern' || regData.pattern.length > 0 ? 'active' : ''}`}>
                <div className="step-icon">🛡️</div>
                <span>Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
