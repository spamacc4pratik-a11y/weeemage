export const UploadZone = ({ onFileProcess }) => {

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = 'var(--accent-primary)';
    e.currentTarget.style.background = 'rgba(255, 64, 64, 0.05)';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = 'var(--border-subtle)';
    e.currentTarget.style.background = 'transparent';
  };

  const processFiles = (files) => {
    if (!files || files.length === 0) return;

    // Convert FileList to Array and filter for valid media
    const validFiles = Array.from(files).filter(file => {
      const type = file.type?.toLowerCase() || '';
      const name = file.name?.toLowerCase() || '';
      return type.startsWith('image/') ||
        type.startsWith('video/') ||
        /\.(jpg|jpeg|png|webp|gif|avif|heic|mp4|mov|webm)$/i.test(name);
    });

    if (validFiles.length > 0) {
      onFileProcess(validFiles);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = 'var(--border-subtle)';
    e.currentTarget.style.background = 'transparent';
    processFiles(e.dataTransfer.files);
  };



  return (
    <div
      className="glass-panel"
      style={{
        padding: '3rem',
        textAlign: 'center',
        borderStyle: 'dashed',
        borderWidth: '2px',
        borderColor: 'var(--border-subtle)',
        transition: 'all 0.3s var(--animation-cubic)',
        cursor: 'pointer',
        marginBottom: '2rem'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ pointerEvents: 'none' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Drop your photos here</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>or click to browse multiple files</p>
      </div>
    </div>
  );
};
