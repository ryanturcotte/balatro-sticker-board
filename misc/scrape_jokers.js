
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Convert __dirname to ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL of the Wiki Category page
const WIKI_URL = 'https://balatrogame.fandom.com/wiki/Category:Images_-_Jokers';
const OUTPUT_DIR = path.join(__dirname, '../static/img/jokers');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', (err) => reject(err));
        });
    });
}

async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(OUTPUT_DIR, filename);
        const file = fs.createWriteStream(filePath);
        https.get(url, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
}

function cleanName(name) {
    return decodeURIComponent(name).replace(/_/g, ' ');
}

async function main() {
    console.log('Fetching Wiki page...');
    try {
        const html = await fetchPage(WIKI_URL);

        // Regex to find image members in the category
        // The pattern seems to be: class="category-page__member-thumbnail" ... src="..." ... alt="..."
        const regex = /src="([^"]+)"\s+alt="([^"]+)"\s+class="category-page__member-thumbnail"/g;
        let match;
        let count = 0;

        while ((match = regex.exec(html)) !== null) {
            let src = match[1];
            let alt = match[2];

            // Clean URL: remove everything after '.png' if present
            const cleanSrcMatch = src.match(/(.+?\.png)/);
            if (cleanSrcMatch) {
                let downloadUrl = cleanSrcMatch[1];

                // Filename: "8 Ball.png" -> "8_Ball.png"
                const filename = alt.replace(/\s+/g, '_');

                console.log(`Downloading ${filename}...`);
                await downloadImage(downloadUrl, filename);
                count++;
            }
        }

        if (count === 0) {
            console.log("No images found with the regex. The HTML structure might be different.");
            // Dump a bit of HTML to debug if needed
            console.log("Snippet of HTML:", html.substring(0, 500));
        } else {
            console.log(`Downloaded ${count} images to ${OUTPUT_DIR}`);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
