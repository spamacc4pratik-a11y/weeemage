import { useRef, useEffect, useState } from 'react';

export const PhotoCard = ({ photo, onDelete, onClick, isTrashView }) => {
    const [isVisible, setIsVisible] = useState(false);
    const imgRef = useRef();

    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.05, rootMargin: '400px' });
        if (imgRef.current) observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, []);

    const handleImageLoad = (e) => {
        const img = e.target;
        if (img.decode) {
            img.decode().then(() => setIsLoaded(true)).catch(() => setIsLoaded(true));
        } else {
            setIsLoaded(true);
        }
    };

    const isVideo = photo.file.type?.includes('video') || photo.file.name?.match(/\.(mp4|mov|webm)$/i);

    return (
        <div
            ref={imgRef}
            className="glass-panel"
            style={{
                overflow: 'hidden', position: 'relative',
                background: 'rgba(255, 64, 64, 0.1)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.6s var(--animation-cubic)',
                aspectRatio: '1', cursor: 'pointer'
            }}
            onClick={onClick}
        >
            {isVisible && (
                <>
                    {isVideo ? (
                        <video
                            src={photo.url}
                            style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                opacity: isLoaded ? 1 : 0, transition: 'opacity 0.4s ease'
                            }}
                            muted loop
                            onLoadedData={() => setIsLoaded(true)}
                            onMouseEnter={e => e.target.play()}
                            onMouseLeave={e => e.target.pause()}
                        />
                    ) : (
                        <img
                            src={photo.thumbUrl || photo.url}
                            alt={photo.file.name}
                            loading="lazy"
                            onLoad={handleImageLoad}
                            style={{
                                width: '100%', height: '100%', objectFit: 'cover',
                                transition: 'transform 0.4s var(--animation-cubic), opacity 0.4s ease',
                                opacity: isLoaded ? 1 : 0
                            }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                        />
                    )}
                    {!isLoaded && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(45deg, var(--bg-card), var(--border-subtle))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="shimmer" />
                        </div>
                    )}
                </>
            )}

            {/* Action Button - Top Right */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
                style={{
                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px', color: isTrashView ? '#4aff9b' : '#ff4040',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)', zIndex: 20
                }}
                title={isTrashView ? "Restore photo" : "Move to trash"}
            >
                {isTrashView ? '↺' : '✕'}
            </button>

            <div
                style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    opacity: 0, transition: 'opacity 0.3s ease', pointerEvents: 'none'
                }}
                className="info-overlay"
            >
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                    {new Date(photo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
            <style>{`
                .glass-panel:hover .info-overlay { opacity: 1; }
            `}</style>
        </div>
    );
};
