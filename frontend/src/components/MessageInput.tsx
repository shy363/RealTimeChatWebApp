import { useState, useRef, FormEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onTyping?: () => void;
}

const MessageInput = ({ onSendMessage, onTyping }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };



  return (
    <div className="chat-input-area">
      <form onSubmit={handleSubmit} className="input-container">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            onTyping?.();
          }}
          placeholder="Type a message..."
          className="custom-input"
          maxLength={500}
        />

        <button
          type="submit"
          disabled={!message.trim() || message.length > 500}
          className="custom-btn"
          style={{ height: '48px', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
