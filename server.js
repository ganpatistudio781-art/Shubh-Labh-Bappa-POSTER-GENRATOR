import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, WEBP, and HEIC images are allowed.'));
    }
  }
});

// SVG Helper for high-quality text rendering
function createTextSVG(name, mobile, config) {
  const { nameX, nameY, mobileX, mobileY, nameFontSize, mobileFontSize, nameColor, mobileColor } = config;

  const safeName = (name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeMobile = (mobile || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return Buffer.from(`
    <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
      <style>
        .name {
          font-family: 'Poppins', sans-serif;
          font-size: ${nameFontSize}px;
          font-weight: 700;
          fill: ${nameColor};
          text-anchor: middle;
          dominant-baseline: middle;
        }
        .mobile {
          font-family: 'Poppins', sans-serif;
          font-size: ${mobileFontSize}px;
          font-weight: 600;
          fill: ${mobileColor};
          text-anchor: middle;
          dominant-baseline: middle;
        }
      </style>
      <text x="${nameX}" y="${nameY}" class="name">${safeName}</text>
      <text x="${mobileX}" y="${mobileY}" class="mobile">${safeMobile}</text>
    </svg>
  `);
}

// Generate Poster Route
app.post('/api/generate-poster', upload.single('photo'), async (req, res) => {
  try {
    const { name, mobile, photoX, photoY, photoWidth, photoHeight } = req.body;

    const pX = parseInt(photoX, 10) || 140;
    const pY = parseInt(photoY, 10) || 300;
    const pWidth = parseInt(photoWidth, 10) || 800;
    const pHeight = parseInt(photoHeight, 10) || 800;

    const config = {
      nameX: parseInt(req.body.nameX, 10) || 540,
      nameY: parseInt(req.body.nameY, 10) || 1160,
      mobileX: parseInt(req.body.mobileX, 10) || 540,
      mobileY: parseInt(req.body.mobileY, 10) || 1220,
      nameFontSize: parseInt(req.body.nameFontSize, 10) || 48,
      mobileFontSize: parseInt(req.body.mobileFontSize, 10) || 36,
      nameColor: req.body.nameColor || '#FFFFFF',
      mobileColor: req.body.mobileColor || '#FFD700'
    };

    const templatePath = path.join(__dirname, 'public', 'poster-template.png');
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ success: false, message: 'Template image poster-template.png missing.' });
    }

    const composites = [];

    // 1. User photo processing
    if (req.file) {
      const resizedPhotoBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize(pWidth, pHeight, { fit: 'cover', position: 'center' })
        .toFormat('png')
        .toBuffer();

      composites.push({
        input: resizedPhotoBuffer,
        left: pX,
        top: pY
      });
    }

    // 2. Text SVG composite
    const svgTextBuffer = createTextSVG(name, mobile, config);
    composites.push({
      input: svgTextBuffer,
      left: 0,
      top: 0
    });

    // 3. Composite purely IN-MEMORY to a buffer (No disk writing for Vercel)
    const finalPosterBuffer = await sharp(templatePath)
      .resize(1080, 1350)
      .composite(composites)
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    const base64Image = `data:image/png;base64,${finalPosterBuffer.toString('base64')}`;

    // Optional safe ephemeral logging in Vercel's /tmp folder
    try {
      const tmpPath = '/tmp/data.json';
      let recordList = [];
      if (fs.existsSync(tmpPath)) {
        recordList = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
      }
      recordList.push({
        id: Date.now(),
        name: name || '',
        mobile: mobile || '',
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(tmpPath, JSON.stringify(recordList, null, 2));
    } catch (e) {
      // Ignored if ephemeral write fails
    }

    return res.json({
      success: true,
      imageData: base64Image
    });

  } catch (error) {
    console.error('Generation Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
  }
});

// Export default app for Vercel Serverless
export default app;

// Listen locally if running outside Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
