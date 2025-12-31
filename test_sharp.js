import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const testDir = 'public/photos';
const thumbDir = 'public/thumbnails';

if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir);

const files = fs.readdirSync(testDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
if (files.length > 0) {
    const file = files[0];
    const start = Date.now();
    sharp(path.join(testDir, file))
        .resize(400, 400, { fit: 'cover' })
        .toFile(path.join(thumbDir, 'test_thumb.jpg'))
        .then(() => {
            console.log(`Thumbnail generated in ${Date.now() - start}ms`);
            process.exit(0);
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
} else {
    console.log('No photos found to test');
    process.exit(0);
}
