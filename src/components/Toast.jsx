import { useEffect } from 'react';

export const Toast = ({ message, onClose }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '1rem 2rem',
                background: 'rgba(255, 64, 64, 0.9)',
                color: 'white',
                borderRadius: '50px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                zIndex: 3000,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                animation: 'toastUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <span>✨</span>
            {message}
            <style>{`
        @keyframes toastUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
        </div>
    );
};
