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
app.use(express.static(path.join(process.cwd(), 'public')));

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        const { name, mobile, config: configString } = req.body;
        const config = JSON.parse(configString || '{}');
        
        const possiblePaths = [
            path.join(__dirname, 'public', 'poster-template.png'),
            path.join(process.cwd(), 'public', 'poster-template.png'),
            path.resolve('./public/poster-template.png')
        ];

        let templatePath = possiblePaths.find(p => fs.existsSync(p));

        if (!templatePath) {
            console.error('Template image not found in paths:', possiblePaths);
            return res.status(500).json({ error: 'poster-template.png is missing on server.' });
        }

        let photoBuffer = null;
        if (req.file && req.file.buffer) {
            photoBuffer = await sharp(req.file.buffer)
                .resize(config.photoWidth || 348, config.photoHeight || 382, { fit: 'cover' })
                .png()
                .toBuffer();
        }

        const safeName = (name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeMobile = (mobile || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const svgText = `
            <svg width="${config.templateWidth || 1080}" height="${config.templateHeight || 1350}">
                <style>
                    .nameText {
                        font-family: 'Arial', sans-serif;
                        font-size: ${config.fontSizeName || 32}px;
                        font-weight: bold;
                        fill: ${config.fontColorName || '#000000'};
                    }
                    .mobileText {
                        font-family: 'Arial', sans-serif;
                        font-size: ${config.fontSizeMobile || 28}px;
                        font-weight: bold;
                        fill: ${config.fontColorMobile || '#000000'};
                    }
                </style>
                <text x="${config.nameX || 145}" y="${config.nameY || 1192}" text-anchor="start" class="nameText">${safeName}</text>
                <text x="${config.mobileX || 180}" y="${config.mobileY || 1266}" text-anchor="start" class="mobileText">${safeMobile}</text>
            </svg>
        `;

        const compositeLayers = [];
        
        if (photoBuffer) {
            compositeLayers.push({
                input: photoBuffer,
                top: config.photoY || 746,
                left: config.photoX || 56
            });
        }

        compositeLayers.push({
            input: Buffer.from(svgText),
            top: 0,
            left: 0
        });

        const outputBuffer = await sharp(templatePath)
            .composite(compositeLayers)
            .png({ quality: 100 })
            .toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${name ? name.replace(/\s+/g, '_') : 'Poster'}_Generated.png"`);
        res.send(outputBuffer);

    } catch (error) {
        console.error('Error generating poster:', error);
        res.status(500).json({ error: 'Failed to generate poster.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
