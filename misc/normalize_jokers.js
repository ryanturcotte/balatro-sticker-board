
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIR = path.join(__dirname, '../static/img/jokers');

if (!fs.existsSync(DIR)) {
    console.log("Directory not found:", DIR);
    process.exit(1);
}

const files = fs.readdirSync(DIR);

files.forEach(file => {
    let newName = file;

    // 1. Decode HTML entities
    newName = newName.replace(/&#039;/g, "'").replace(/&amp;/g, '&');

    // 2. Remove accents (Séance -> Seance)
    newName = newName.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    // 3. Replace dashes with underscores
    newName = newName.replace(/-/g, '_');

    // 4. Remove special characters (keep alphanumeric, underscores, dots)
    newName = newName.replace(/[^a-zA-Z0-9_.]/g, '');

    // 5. Fix potential double underscores
    newName = newName.replace(/__+/g, '_');

    if (file !== newName) {
        console.log(`Renaming: ${file} -> ${newName}`);
        fs.renameSync(path.join(DIR, file), path.join(DIR, newName));
    }
});

console.log('Normalization complete.');
