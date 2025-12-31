export const UploadStatus = ({ uploads, progress, isProcessing, processingMessage }) => {
    if (!uploads || uploads.length === 0) return null;

    return (
        <div className="glass-panel" style={{
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid var(--accent-primary)',
            background: 'rgba(255, 64, 64, 0.05)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="spinner"></div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.2rem' }}>
                        <span>{isProcessing ? (processingMessage || 'Processing metadata...') : `Uploading ${uploads.length} items...`}</span>
                        {!isProcessing && <span>{progress}%</span>}
                    </div>
                    <div style={{
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'var(--accent-primary)',
                            transition: 'width 0.3s ease',
                            boxShadow: '0 0 10px var(--accent-primary)'
                        }} />
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                scrollbarWidth: 'none',
                opacity: isProcessing ? 0.5 : 1,
                transition: 'opacity 0.3s'
            }}>
                {uploads.map((u, i) => (
                    <div key={i} style={{
                        minWidth: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        {u.type?.startsWith('video/') ? (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: '#1a1a1a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>🎥</div>
                        ) : (
                            <img
                                src={u.preview}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        {!isProcessing && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: 'var(--accent-primary)',
                                boxShadow: '0 0 10px var(--accent-primary)',
                                transform: `scaleX(${progress / 100})`,
                                transformOrigin: 'left',
                                transition: 'transform 0.3s ease'
                            }} />
                        )}
                    </div>
                ))}
            </div>

            <style>{`
        .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 64, 64, 0.2);
            border-top: 2px solid var(--accent-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
