const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer in-memory storage for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Vercel serverless environment compatibility check
const IS_VERCEL = process.env.VERCEL === '1';
const UPLOADS_DIR = IS_VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const GENERATED_DIR = IS_VERCEL ? '/tmp/generated' : path.join(__dirname, 'generated');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        const { name, mobile, config: configString } = req.body;
        const config = JSON.parse(configString);
        
        const templatePath = path.join(__dirname, 'public', 'poster-template.png');
        
        // 1. Process uploaded photo (Resize to frame specs)
        let photoBuffer = null;
        if (req.file) {
            photoBuffer = await sharp(req.file.buffer)
                .resize(config.photoWidth, config.photoHeight, { fit: 'cover' })
                .png()
                .toBuffer();
        }

        // 2. Escape special characters for SVG text
        const safeName = (name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeMobile = (mobile || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 3. Create SVG overlay for dynamic text positioning
        const svgText = `
            <svg width="${config.templateWidth}" height="${config.templateHeight}">
                <style>
                    .nameText {
                        font-family: 'Arial', sans-serif;
                        font-size: ${config.fontSizeName}px;
                        font-weight: bold;
                        fill: ${config.fontColorName};
                    }
                    .mobileText {
                        font-family: 'Arial', sans-serif;
                        font-size: ${config.fontSizeMobile}px;
                        font-weight: bold;
                        fill: ${config.fontColorMobile};
                    }
                </style>
                <text x="${config.nameX}" y="${config.nameY}" text-anchor="start" class="nameText">${safeName}</text>
                <text x="${config.mobileX}" y="${config.mobileY}" text-anchor="start" class="mobileText">${safeMobile}</text>
            </svg>
        `;

        // 4. Build composite layers
        const compositeLayers = [];
        
        // Place photo inside frame
        if (photoBuffer) {
            compositeLayers.push({
                input: photoBuffer,
                top: config.photoY,
                left: config.photoX
            });
        }

        // Place SVG Text layer
        compositeLayers.push({
            input: Buffer.from(svgText),
            top: 0,
            left: 0
        });

        // 5. Render final high-definition image with Sharp
        const outputBuffer = await sharp(templatePath)
            .composite(compositeLayers)
            .png({ quality: 100 })
            .toBuffer();

        // 6. Save data logs in uploads/data.json
        const dataFile = path.join(UPLOADS_DIR, 'data.json');
        const record = { name, mobile, time: new Date().toISOString() };
        let records = [];
        if (fs.existsSync(dataFile)) {
            try { records = JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch (e) { records = []; }
        }
        records.push(record);
        fs.writeFileSync(dataFile, JSON.stringify(records, null, 2));

        // 7. Save generated poster to generated folder
        const fileName = `poster_${Date.now()}.png`;
        fs.writeFileSync(path.join(GENERATED_DIR, fileName), outputBuffer);

        // 8. Send image file back for auto-download
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${name ? name.replace(/\s+/g, '_') : 'Poster'}_Generated.png"`);
        res.send(outputBuffer);

    } catch (error) {
        console.error('Error generating poster:', error);
        res.status(500).json({ error: 'Failed to generate poster.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
