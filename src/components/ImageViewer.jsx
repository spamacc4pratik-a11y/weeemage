import { useEffect, useRef, useState } from 'react';

export const ImageViewer = ({ photo, isOpen, onClose }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const controlsTimeoutRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsPlaying(true);
            setProgress(0);
            setIsLoaded(false);
            return;
        }
        setIsLoaded(false);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === ' ' && videoRef.current) {
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(p);
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
    };

    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Apply Volume & Speed
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.playbackRate = playbackRate;
        }
    }, [volume, playbackRate, isOpen]);

    const toggleSpeed = () => {
        // Cycle: 1 -> 1.5 -> 2 -> 0.5 -> 1
        setPlaybackRate(prev => {
            if (prev === 1) return 1.5;
            if (prev === 1.5) return 2;
            if (prev === 2) return 0.5;
            return 1;
        });
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const p = x / rect.width;
        if (videoRef.current) {
            videoRef.current.currentTime = p * videoRef.current.duration;
        }
    };

    if (!isOpen || !photo) return null;

    const isVideo = photo.file.name.match(/\.(mp4|mov|webm)$/i) || photo.file.type?.includes('video');

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2000,
                backgroundColor: 'rgba(0,0,0,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}
            onClick={onClose}
            onMouseMove={handleMouseMove}
        >
            <button
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '1rem',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2002,
                    transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255, 64, 64, 0.8)'}
                onMouseLeave={e => e.target.style.background = 'rgba(0,0,0,0.5)'}
            >
                ✕
            </button>

            {isVideo ? (
                <div
                    style={{ position: 'relative', width: '90vw', maxWidth: '1200px', height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.stopPropagation()}
                >
                    {!isLoaded && (
                        <div style={{
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            zIndex: 1
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTop: '3px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        src={photo.url}
                        autoPlay
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            display: isLoaded ? 'block' : 'none'
                        }}
                        onLoadedData={() => setIsLoaded(true)}
                        onClick={togglePlay}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                    />

                    {/* Custom Controls */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '2rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '80%',
                            background: 'rgba(20, 20, 25, 0.8)',
                            backdropFilter: 'blur(10px)',
                            padding: '1rem 2rem',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            opacity: showControls || !isPlaying ? 1 : 0,
                            transition: 'opacity 0.3s ease',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <button
                            onClick={togglePlay}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '1.25rem',
                                display: 'flex',
                                alignItems: 'center',
                                width: '24px'
                            }}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>

                        <div
                            style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
                            onClick={handleSeek}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${progress}%`,
                                    background: 'var(--accent-primary)',
                                    borderRadius: '2px',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${progress}%`,
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '12px',
                                    height: '12px',
                                    background: 'white',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                                }}
                            />
                        </div>

                        {/* Volume Control */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                                onClick={() => setVolume(v => v === 0 ? 1 : 0)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'white',
                                    fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    padding: 0
                                }}
                            >
                                {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="volume-slider"
                                style={{
                                    width: '80px',
                                    height: '4px',
                                    appearance: 'none',
                                    background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Speed Control */}
                        <div
                            style={{ position: 'relative' }}
                            onMouseEnter={() => setShowSpeedMenu(true)}
                            onMouseLeave={() => setShowSpeedMenu(false)}
                        >
                            <button
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    minWidth: '40px'
                                }}
                            >
                                {playbackRate}x
                            </button>

                            {/* Speed Menu */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '0.5rem',
                                    background: 'rgba(20, 20, 25, 0.95)',
                                    borderRadius: '8px',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    opacity: showSpeedMenu ? 1 : 0,
                                    pointerEvents: showSpeedMenu ? 'auto' : 'none',
                                    transition: 'all 0.2s ease',
                                    minWidth: '60px'
                                }}
                            >
                                {[0.25, 0.5, 0.75, 1, 1.5, 2].map(rate => (
                                    <button
                                        key={rate}
                                        onClick={() => {
                                            setPlaybackRate(rate);
                                            setShowSpeedMenu(false);
                                        }}
                                        style={{
                                            background: playbackRate === rate ? 'var(--accent-primary)' : 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0.25rem',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {!isLoaded && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '200px',
                            height: '200px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(255,255,255,0.3)',
                                borderTop: '3px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                        </div>
                    )}
                    <img
                        src={photo.url}
                        alt={photo.file.name}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                            animation: 'zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            display: isLoaded ? 'block' : 'none'
                        }}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setIsLoaded(true)} // Hide spinner even on error
                        onClick={e => e.stopPropagation()}
                    />
                </>
            )}
            <style>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            transition: transform 0.1s;
        }
        .volume-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }
      `}</style>
        </div>
    );
};
