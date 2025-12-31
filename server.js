import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug: Check if BLOB_READ_WRITE_TOKEN is loaded
console.log('[DEBUG] BLOB_READ_WRITE_TOKEN exists:', !!process.env.BLOB_READ_WRITE_TOKEN);
console.log('[DEBUG] BLOB_READ_WRITE_TOKEN length:', process.env.BLOB_READ_WRITE_TOKEN?.length);

// Global error handlers for debugging crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.static('public', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.includes('photos') || path.includes('thumbnails')) {
            res.setHeader('Cache-Control', 'public, maxAge=31536000, immutable');
        }
    }
})); // Serve photos statically with aggressive caching

app.use('/trash', express.static('public/trash', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'public, maxAge=31536000, immutable');
    }
})); // Serve trash statically

// Configure storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit per file
});

import ExifReader from 'exifreader';
import sharp from 'sharp';
import { put, del, list, head } from '@vercel/blob';

// In-memory lists
let photosList = [];
let trashList = [];
const PHOTOS_FILE = path.join(__dirname, 'photos.json');
const TRASH_FILE = path.join(__dirname, 'trash.json');

// Load lists
if (fs.existsSync(PHOTOS_FILE)) {
    try {
        photosList = JSON.parse(fs.readFileSync(PHOTOS_FILE, 'utf8'));
    } catch (e) {
        console.error('[PHOTOS] Corrupt photos file, resetting.');
    }
}
if (fs.existsSync(TRASH_FILE)) {
    try {
        trashList = JSON.parse(fs.readFileSync(TRASH_FILE, 'utf8'));
    } catch (e) {
        console.error('[TRASH] Corrupt trash file, resetting.');
    }
}

const saveLists = () => {
    fs.writeFileSync(PHOTOS_FILE, JSON.stringify(photosList));
    fs.writeFileSync(TRASH_FILE, JSON.stringify(trashList));
};

// Metadata cache
let metadataCache = {};
const cacheFile = path.join(__dirname, 'metadata_cache.json');
try {
    metadataCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
} catch (e) {
    fs.writeFileSync(cacheFile, JSON.stringify(metadataCache));
}
const saveCache = () => {
    fs.writeFileSync(cacheFile, JSON.stringify(metadataCache));
};

// Populate lists if empty
async function populateLists() {
    console.log('[POPULATE] Starting populateLists');
    console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);

    // Populate photos from blob
    const photosBlobs = await list({ prefix: 'photos/' });
    photosList = [];
    for (const blob of photosBlobs.blobs) {
        const name = blob.pathname.replace('photos/', '');
        const thumbFilename = `thumb_${name.replace(/\.[^/.]+$/, '')}.jpg`;
        let thumbUrl = '';
        try {
            const thumbBlob = await head(`thumbnails/${thumbFilename}`);
            thumbUrl = thumbBlob.url;
        } catch {
            thumbUrl = blob.url; // fallback
        }
        const mtime = blob.uploadedAt.getTime();
        const fileKey = `${name}-${blob.size}-${mtime}`;
        metadataCache[fileKey] = { mtime };
        saveCache();
        photosList.push({
            name,
            url: blob.url,
            thumbUrl,
            mtime,
            file: { name, type: name.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg' }
        });
    }

    // Populate trash from blob
    const trashBlobs = await list({ prefix: 'trash/' });
    trashList = [];
    for (const blob of trashBlobs.blobs) {
        if (blob.pathname.includes('/thumb_')) continue; // skip thumbs
        const name = blob.pathname.replace('trash/', '');
        const thumbFilename = `thumb_${name.replace(/\.[^/.]+$/, '')}.jpg`;
        let thumbUrl = '';
        try {
            const thumbBlob = await head(`trash/${thumbFilename}`);
            thumbUrl = thumbBlob.url;
        } catch {
            thumbUrl = blob.url;
        }
        const mtime = blob.uploadedAt.getTime();
        trashList.push({
            name,
            url: blob.url,
            thumbUrl,
            mtime
        });
    }

    saveLists();
    console.log('[POPULATE] populateLists completed successfully');
    console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
}

app.get('/api/photos', (req, res) => {
    console.log(`[API] Served ${photosList.length} photos`);
    res.json(photosList);
});

// API to get list of trashed photos
app.get('/api/trash', (req, res) => {
    res.json(trashList);
});

// API to upload photos
app.post('/api/upload', upload.fields([{ name: 'photos', maxCount: 100 }, { name: 'dates' }]), async (req, res) => {
    try {
        console.log('[UPLOAD] Starting upload process');
        let dateArray = [];
        try {
            if (req.body.dates) {
                dateArray = JSON.parse(req.body.dates);
            }
        } catch (e) {
            console.error('[UPLOAD] Failed to parse dates JSON:', e.message);
        }

        console.log(`[UPLOAD] Received ${req.files.photos?.length || 0} files and ${dateArray.length} dates`);

        if (req.files.photos) {
            for (let index = 0; index < req.files.photos.length; index++) {
            const file = req.files.photos[index];
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-');
            const filename = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}-${sanitizedName}`;

            let uploadBuffer = file.buffer;
            let date = Date.now();
            if (dateArray[index]) {
                const mtime = new Date(parseInt(dateArray[index]));
                if (!isNaN(mtime)) {
                    date = mtime.getTime();
                }
            }
            try {
                if (!filename.match(/\.(mp4|mov|webm)$/i)) {
                    const tags = ExifReader.load(file.buffer);
                    const priorityTags = ['DateTimeOriginal', 'CreationDate', 'CreateDate', 'MediaCreateDate', 'ModifyDate', 'DateTime'];
                    for (const tag of priorityTags) {
                        if (tags[tag]?.description) {
                            const parsed = new Date(tags[tag].description.replace(/:(\d{2}):(\d{2}) /, '-$1-$2 ').replace(/:/g, '-').replace(' ', 'T').split(/[\+\-Z]/)[0]);
                            if (!isNaN(parsed)) {
                                date = parsed.getTime();
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
            }
            if (file.mimetype.startsWith('image/') && !file.mimetype.includes('gif')) {
                try {
                    const quality = file.size > 5 * 1024 * 1024 ? 60 : 80; // Lower quality for large files
                    uploadBuffer = await sharp(file.buffer).jpeg({ quality }).toBuffer();
                } catch (e) {
                    // use original buffer
                }
            }

            try {
                // Upload file to Vercel Blob
                const photoBlob = await put(`photos/${filename}`, uploadBuffer, { access: 'public' });

                // Generate and upload thumbnail
                const quality = file.size > 5 * 1024 * 1024 ? 60 : 80;
                const thumbBuffer = await sharp(uploadBuffer).resize(200, 200, { fit: 'inside' }).jpeg({ quality }).toBuffer();
                const thumbFilename = `thumb_${filename.replace(/\.[^/.]+$/, '')}.jpg`;
                const thumbBlob = await put(`thumbnails/${thumbFilename}`, thumbBuffer, { access: 'public' });

                const url = photoBlob.url;
                const thumbUrl = thumbBlob.url;
                const fileKey = `${filename}-${photoBlob.size}-${date}`;
                metadataCache[fileKey] = { mtime: date };
                saveCache();
                photosList.push({
                    name: filename,
                    url: url,
                    thumbUrl: thumbUrl,
                    mtime: date,
                    file: { name: filename, type: file.mimetype.match(/video/) ? 'video/mp4' : 'image/jpeg' }
                });
            } catch (error) {
                console.error('Blob upload error:', error);
                return res.status(500).json({ error: 'Upload failed' });
            }
        }
        saveLists();
    }

    console.log('[UPLOAD] Upload process completed successfully');
    res.json({ message: 'Uploaded successfully', count: req.files.photos?.length || 0 });
    } catch (error) {
        console.error('[UPLOAD] Unhandled error in upload process:', error);
        res.status(500).json({ error: 'Upload failed due to server error' });
    }
});

// Move to Trash instead of deleting
app.delete('/api/photos/:name', async (req, res) => {
    const filename = req.params.name;
    const item = photosList.find(p => p.name === filename);
    if (!item) {
        return res.status(404).json({ error: 'File not found' });
    }
    try {
        // Move file to trash blob
        const trashBlob = await put(`trash/${filename}`, await fetch(item.url).then(r => r.arrayBuffer()), { access: 'public' });

        // Move thumbnail to trash blob
        const thumbFilename = `thumb_${filename.replace(/\.[^/.]+$/, '')}.jpg`;
        const trashThumbBlob = await put(`trash/${thumbFilename}`, await fetch(item.thumbUrl).then(r => r.arrayBuffer()), { access: 'public' });

        // Delete original
        await del(item.url);
        await del(item.thumbUrl);

        item.url = trashBlob.url;
        item.thumbUrl = trashThumbBlob.url;
        photosList = photosList.filter(p => p.name !== filename);
        trashList.push(item);
        saveLists();
        console.log(`[DELETE] Moved ${filename} to trash`);
        res.json({ message: 'Moved to trash' });
    } catch (error) {
        console.error('Blob move error:', error);
        res.status(500).json({ error: 'Failed to trash' });
    }
});

// Restore from Trash
app.post('/api/trash/restore/:name', async (req, res) => {
    const filename = req.params.name;
    const item = trashList.find(p => p.name === filename);
    if (!item) {
        return res.status(404).json({ error: 'File not found in trash' });
    }
    try {
        // Move file back to photos blob
        const photoBlob = await put(`photos/${filename}`, await fetch(item.url).then(r => r.arrayBuffer()), { access: 'public' });

        // Move thumbnail back to thumbnails blob
        const thumbFilename = `thumb_${filename.replace(/\.[^/.]+$/, '')}.jpg`;
        const thumbBlob = await put(`thumbnails/${thumbFilename}`, await fetch(item.thumbUrl).then(r => r.arrayBuffer()), { access: 'public' });

        // Delete from trash
        await del(item.url);
        await del(item.thumbUrl);

        item.url = photoBlob.url;
        item.thumbUrl = thumbBlob.url;
        trashList = trashList.filter(p => p.name !== filename);
        photosList.push(item);
        saveLists();
        console.log(`[RESTORE] Restored ${filename} from trash`);
        res.json({ message: 'Restored' });
    } catch (error) {
        console.error('Blob restore error:', error);
        res.status(500).json({ error: 'Failed to restore' });
    }
});

// Empty Trash permanently
app.delete('/api/trash/empty', async (req, res) => {
    try {
        const trashBlobs = await list({ prefix: 'trash/' });
        for (const blob of trashBlobs.blobs) {
            await del(blob.url);
        }
        trashList = [];
        saveLists();
        res.json({ message: 'Trash emptied' });
    } catch (error) {
        console.error('Blob delete error:', error);
        res.status(500).json({ error: 'Failed to empty trash' });
    }
});



const generationLock = new Set();

// One-stop Shop for Thumbnails
app.get('/api/thumbnail/:name', (req, res) => {
    const name = req.params.name;
    const photo = photosList.find(p => p.name === name);
    if (photo) {
        return res.redirect(photo.thumbUrl);
    }
    const trash = trashList.find(p => p.name === name);
    if (trash) {
        return res.redirect(trash.thumbUrl);
    }
    res.status(404).send('Not found');
});

// Backward compatibility for the legacy /api/thumbnail/trash/ or /api/thumbnail/photos/ URLs
app.get('/api/thumbnail/:type/:name', (req, res) => {
    res.redirect(`/api/thumbnail/${req.params.name}`);
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler: send back index.html for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// For Vercel serverless, export the app instead of listening
export default app;

// For local development, listen if not in Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);

        if (photosList.length === 0) {
            populateLists().catch(console.error);
        }
    });
}
