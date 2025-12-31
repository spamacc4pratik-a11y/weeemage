import { useEffect } from 'react';

export const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0,0,0,0.6)',
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={onClose}
        >
            <div
                className="glass-panel"
                style={{
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    transform: 'translateY(0)',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Delete Photo?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    This action cannot be undone. The photo will be permanently removed from your disk.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = 'var(--bg-card)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--accent-primary)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(255, 64, 64, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.target.style.background = 'var(--accent-hover)';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'var(--accent-primary)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
            <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
};
