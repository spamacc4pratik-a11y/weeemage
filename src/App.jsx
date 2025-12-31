import { useState, useMemo, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { Timeline } from './components/Timeline';
import { DeleteModal } from './components/DeleteModal';
import { ImageViewer } from './components/ImageViewer';
import { Toast } from './components/Toast';
import { UploadStatus } from './components/UploadStatus';

const API_URL = '';

function App() {
  const [photos, setPhotos] = useState([]);
  const [trashPhotos, setTrashPhotos] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'trash'

  const [displayCount, setDisplayCount] = useState(24);

  const fetchPhotos = () => {
    fetch(`${API_URL}/api/photos`)
      .then(res => res.json())
      .then((serverPhotos) => {
        setPhotos(serverPhotos.map(p => ({
          id: p.name,
          url: p.url,
          thumbUrl: p.thumbUrl,
          file: { name: p.name, type: p.name.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg' },
          date: p.mtime
        })));
      });

    fetch(`${API_URL}/api/trash`)
      .then(res => res.json())
      .then((serverTrash) => {
        setTrashPhotos(serverTrash.map(p => ({
          id: p.name,
          url: p.url,
          thumbUrl: p.thumbUrl || p.url,
          file: { name: p.name, type: p.name.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg' },
          date: p.mtime
        })));
      });
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Infinite scroll logic with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            setDisplayCount(prev => prev + 20);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFiles = async (files) => {
    setProcessing(true);
    setUploadProgress(0);
    setIsProcessing(false);
    setProcessingMessage('');
    const fileList = Array.from(files);
    const batchSize = 20; // Upload in batches of 20
    let uploadedCount = 0;
    let totalProcessed = 0;
    let allFileStates = [];

    // Process in batches
    for (let i = 0; i < fileList.length; i += batchSize) {
      const batch = fileList.slice(i, i + batchSize);

      // Create previews only for current batch
      const fileStates = batch.map(file => ({
        name: file.name,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));
      allFileStates.push(...fileStates);
      setUploadingFiles([...allFileStates]);

      const formData = new FormData();
      const dates = [];

      batch.forEach(file => {
        formData.append('photos', file);
        dates.push(file.lastModified);
      });

      formData.append('dates', JSON.stringify(dates));

      try {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_URL}/api/upload`);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const batchProgress = Math.round((e.loaded / e.total) * 100);
              const overallProgress = Math.round(((uploadedCount + batchProgress / 100 * batch.length) / fileList.length) * 100);
              setUploadProgress(overallProgress);
              if (batchProgress === 100) {
                setIsProcessing(true);
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              uploadedCount += batch.length;
              totalProcessed += batch.length;
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error('Upload failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        // Set processing message
        setProcessingMessage(`Processing metadata ${totalProcessed}/${fileList.length}`);

        // Cleanup previews for this batch
        fileStates.forEach(f => f.preview && URL.revokeObjectURL(f.preview));

      } catch (e) {
        console.error("Batch upload failed", e);
        setToastMessage(`Upload failed at batch ${Math.floor(i / batchSize) + 1}`);
        break; // Stop on error
      }
    }

    // Final cleanup and refresh
    setUploadingFiles([]);
    setProcessingMessage('');
    fetchPhotos();
    setToastMessage(`Success: ${uploadedCount} items added`);

    setProcessing(false);
    setIsProcessing(false);
    setUploadProgress(0);
  };

  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const deletePhoto = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/photos/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (response.ok) {
        setToastMessage("Moved to Trash");
        fetchPhotos();
      }
    } catch (e) {
      setToastMessage("Error moving to trash");
    }
  };

  const restorePhoto = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/trash/restore/${encodeURIComponent(id)}`, { method: 'POST' });
      if (response.ok) {
        setToastMessage("Photo restored");
        fetchPhotos();
      }
    } catch (e) {
      setToastMessage("Error restoring photo");
    }
  };

  const emptyTrash = async () => {
    try {
      const response = await fetch(`${API_URL}/api/trash/empty`, { method: 'DELETE' });
      if (response.ok) {
        setToastMessage("Trash emptied");
        fetchPhotos();
      }
    } catch (e) {
      setToastMessage("Error emptying trash");
    }
  };

  const currentPhotos = currentPage === 'home' ? photos : trashPhotos;

  const sortedPhotos = useMemo(() => {
    return [...currentPhotos].sort((a, b) => b.date - a.date);
  }, [currentPhotos]);

  const groupedPhotos = useMemo(() => {
    const limited = sortedPhotos.slice(0, displayCount);
    const groups = {};
    limited.forEach(photo => {
      const day = new Date(photo.date).setHours(0, 0, 0, 0);
      if (!groups[day]) groups[day] = [];
      groups[day].push(photo);
    });
    return Object.entries(groups)
      .map(([date, photos]) => ({ date: parseInt(date), photos }))
      .sort((a, b) => b.date - a.date);
  }, [sortedPhotos, displayCount]);

  return (
    <div className="app-layout">
      {/* Main Content Area */}
      <main className="main-content">
        <header className="page-header glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--accent-primary)' }} />
              <h1 className="title-gradient" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                Weeemage
              </h1>
            </div>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage('home')}
                className={`nav-pill ${currentPage === 'home' ? 'active' : ''}`}
              >
                🏠 Home <span className="pill-count">{photos.length}</span>
              </button>
              <button
                onClick={() => setCurrentPage('trash')}
                className={`nav-pill ${currentPage === 'trash' ? 'active' : ''}`}
              >
                🗑️ Trash <span className="pill-count">{trashPhotos.length}</span>
              </button>
            </nav>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {currentPage === 'trash' && trashPhotos.length > 0 && (
              <button onClick={emptyTrash} className="btn-danger">
                Empty Trash
              </button>
            )}
          </div>
        </header>

        <div className="content-container">
          {currentPage === 'home' && (
            <>
              <div className="desktop-upload">
                <UploadZone onFileProcess={handleFiles} />
              </div>
              <UploadStatus
                uploads={uploadingFiles}
                progress={uploadProgress}
                isProcessing={isProcessing}
                processingMessage={processingMessage}
              />
            </>
          )}

          <Timeline
            groups={groupedPhotos}
            onDelete={currentPage === 'trash' ? restorePhoto : deletePhoto}
            onPhotoClick={setViewingPhoto}
            isTrashView={currentPage === 'trash'}
          />

          {currentPhotos.length === 0 && !processing && (
            <div style={{ textAlign: 'center', padding: '8rem 0', opacity: 0.3 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{currentPage === 'home' ? '🖼️' : '✨'}</div>
              <p style={{ fontSize: '1.2rem' }}>{currentPage === 'home' ? 'Your gallery is empty.' : 'Trash is clean.'}</p>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav glass-panel">
        <button onClick={() => setCurrentPage('home')} className={`mobile-nav-item ${currentPage === 'home' ? 'active' : ''}`}>
          <img src="/logo.jpg" alt="Home" style={{ width: '24px', height: '24px', borderRadius: '4px', filter: currentPage === 'home' ? 'none' : 'grayscale(1)' }} />
          <span>Home</span>
        </button>
        <div className="mobile-fab-container">
          {currentPage === 'home' && (
            <button className="fab" onClick={() => document.getElementById('file-input')?.click()}>
              ＋
            </button>
          )}
        </div>
        <button onClick={() => setCurrentPage('trash')} className={`mobile-nav-item ${currentPage === 'trash' ? 'active' : ''}`}>
          🗑️<span>Trash</span>
        </button>
      </nav>

      <ImageViewer
        isOpen={!!viewingPhoto}
        photo={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <style>{`
        .app-layout { display: flex; flex-direction: column; min-height: 100vh; }
        .main-content { flex: 1; padding: 1rem 2rem; max-width: 1400px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        
        .page-header { 
            display: flex; justify-content: space-between; align-items: center; 
            padding: 1rem 2rem; margin: 1rem 0 2rem; 
            position: sticky; top: 1rem; z-index: 1000;
        }

        .nav-pill {
            display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1.2rem;
            border-radius: 50px; border: none; background: rgba(255,255,255,0.03);
            color: var(--text-secondary); cursor: pointer; transition: all 0.3s ease;
            font-size: 0.9rem; font-weight: 500;
        }
        .nav-pill:hover { background: rgba(255,255,255,0.08); }
        .nav-pill.active { background: var(--accent-primary); color: white; box-shadow: 0 4px 15px rgba(255, 64, 64, 0.4); }
        .nav-pill .pill-count { font-size: 0.7rem; opacity: 0.6; background: rgba(0,0,0,0.2); padding: 1px 6px; border-radius: 10px; }
        
        .btn-danger { background: rgba(255, 64, 64, 0.1); color: #ff4040; border: 1px solid #ff4040; padding: 0.6rem 1.5rem; border-radius: 100px; cursor: pointer; font-weight: 500; font-size: 0.9rem; }
        .btn-danger:hover { background: #ff4040; color: white; }

        .bottom-nav { display: none; }

        @media (max-width: 768px) {
            .main-content { padding: 0.5rem; padding-bottom: 5rem; }
            .page-header { padding: 0.8rem 1rem; margin-bottom: 1rem; flex-direction: column; align-items: stretch; gap: 1rem; }
            .page-header > div:first-child { justify-content: center; }
            .page-header > div:last-child { justify-content: center; }
            .nav-pill { padding: 0.5rem 0.8rem; font-size: 0.8rem; }
            .desktop-upload {
                position: absolute;
                opacity: 0;
                pointer-events: none;
                height: 0;
            }
            .bottom-nav {
                display: flex; position: fixed; bottom: 0; left: 0; right: 0;
                height: 70px; padding: 0 1rem; border-radius: 20px 20px 0 0;
                justify-content: space-around; align-items: center; z-index: 1000;
                background: rgba(15, 15, 15, 0.8) !important;
                backdrop-filter: blur(10px);
            }
            .mobile-nav-item {
                display: flex; flex-direction: column; align-items: center;
                background: none; border: none; color: var(--text-secondary);
                font-size: 1.2rem; gap: 4px;
            }
            .mobile-nav-item span { font-size: 0.7rem; }
            .mobile-nav-item.active { color: var(--accent-primary); }

            .mobile-fab-container { position: relative; width: 60px; height: 60px; margin-top: -30px; }
            .fab {
                width: 60px; height: 60px; border-radius: 50%; border: none;
                background: var(--accent-primary); color: white; font-size: 2rem;
                box-shadow: 0 8px 20px rgba(255, 64, 64, 0.5); cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .fab:active {
                transform: scale(0.9);
            }
        }
      `}</style>
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}

export default App;
