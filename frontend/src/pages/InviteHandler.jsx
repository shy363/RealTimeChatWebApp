import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contactService } from '../services/contacts.js';
import { useAuth } from '../hooks/useAuth.jsx';

const InviteHandler = () => {
  const { inviteCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('🔐 Scanning quantum invitation...');

  useEffect(() => {
    const processInvite = async () => {
      if (!user) {
        // If not logged in, redirect to login with the invite code in state
        navigate(`/login`, { state: { returnInvite: inviteCode } });
        return;
      }

      if (user.inviteCode === inviteCode) {
        setStatus('error');
        setMessage("⚠️ Neural signature conflict - You can't connect to your own quantum signature.");
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      try {
        setMessage('🧬 Establishing quantum link...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMessage('⚡ Synchronizing neural pathways...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await contactService.acceptInvite(inviteCode);
        setStatus('success');
        setMessage(`🎉 Quantum link established! Chat request sent to ${result.user.username}`);
        setTimeout(() => navigate('/chat'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(`⚠️ Quantum disruption: ${err.response?.data?.message || 'Failed to establish neural link.'}`);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    if (inviteCode) {
      processInvite();
    }
  }, [inviteCode, user, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="flex items-center gap-3">
            <div className="icon-badge quantum-badge">
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 className="title-text">QuantumChat</h1>
              <span className="subtitle-text">QUANTUM INVITATION</span>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
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
            Exit
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 'var(--spacing-lg)',
          padding: 'var(--spacing-xl)'
        }}>
          <div className={`icon-badge ${status === 'loading' ? 'quantum-badge' : status === 'success' ? '' : ''}`} style={{ 
            background: status === 'success' ? 'var(--gradient-success)' : 
                      status === 'error' ? 'var(--gradient-secondary)' : 
                      'var(--gradient-primary)',
            width: '100px',
            height: '100px'
          }}>
            {status === 'loading' ? (
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '50px', height: '50px', animation: 'spin 2s linear infinite' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : status === 'success' ? (
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '50px', height: '50px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '50px', height: '50px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              marginBottom: 'var(--spacing-md)', 
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {status === 'loading' ? 'QUANTUM PROCESSING' :
               status === 'success' ? 'QUANTUM LINK ESTABLISHED' :
               'QUANTUM DISRUPTION'}
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-lg)',
              lineHeight: '1.6'
            }}>
              {message}
            </p>
            
            {status === 'loading' && (
              <div style={{ 
                width: '100px', 
                height: '6px', 
                background: 'var(--border-light)', 
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                margin: '0 auto'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'var(--gradient-primary)',
                  animation: 'shimmer 1.5s ease-in-out infinite'
                }}></div>
              </div>
            )}

            {status === 'success' && (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  🌟 Neural pathways synchronized. You can now communicate through the quantum network.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div style={{ 
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)'
              }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  🔧 The quantum link could not be established. Please check your invitation code or try again.
                </p>
              </div>
            )}
          </div>

          {status !== 'loading' && (
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase',
              letterSpacing: '1px',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              Redirecting to quantum network...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteHandler;
