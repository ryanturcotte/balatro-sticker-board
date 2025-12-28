
import { processFile } from './bundle.js';

const fileInput = document.getElementById('fileInput');
const jokerGrid = document.getElementById('joker-grid');
const loadingDiv = document.getElementById('loading');
const statsSection = document.getElementById('stats');
const errorDiv = document.getElementById('error');

// Stake hierarchy (Highest to Lowest)
const STAKES = [
    { key: 'stake_gold', class: 'gold', label: 'Gold' },
    { key: 'stake_orange', class: 'orange', label: 'Orange' },
    { key: 'stake_purple', class: 'purple', label: 'Purple' },
    { key: 'stake_blue', class: 'blue', label: 'Blue' },
    { key: 'stake_black', class: 'black', label: 'Black' },
    { key: 'stake_red', class: 'red', label: 'Red' },
    { key: 'stake_white', class: 'white', label: 'White' },
    { key: 'stake_green', class: 'green', label: 'Green' } // Green is lower than white/red usually? Or alternate. Balatro order: White, Red, Blue, Gold... wait.
    // Correct Order: White, Red, Blue, Black, Green, Purple, Orange, Gold
    // But for "Sticker" priority, we check purely if they have the win. 
    // Usually only the highest sticker is shown.
];

// Re-ordered for priority check (Gold is best, so check first)
const STAKE_PRIORITY = [
    'stake_gold',
    'stake_orange',
    'stake_purple',
    'stake_green',
    'stake_black',
    'stake_blue',
    'stake_red',
    'stake_white'
];

const STAKE_CLASS_MAP = {
    'stake_gold': 'gold',
    'stake_orange': 'orange',
    'stake_purple': 'purple',
    'stake_green': 'green',
    'stake_black': 'black',
    'stake_blue': 'blue',
    'stake_red': 'red',
    'stake_white': 'white'
};

fileInput.addEventListener('change', handleFileUpload);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    loadingDiv.classList.remove('hidden');
    errorDiv.classList.add('hidden');
    jokerGrid.innerHTML = '';
    statsSection.classList.add('hidden');

    try {
        const buffer = await file.arrayBuffer();

        // The processFile function is synchronous in the original code, 
        // but we treat it carefully here.
        const json = processFile(buffer);

        console.log("Parsed JSON:", json);

        renderJokers(json);

    } catch (err) {
        console.error(err);
        errorDiv.textContent = "Error parsing file. Please ensure it is a valid .jkr file.";
        errorDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

function renderJokers(data) {
    if (!data.joker_usage) {
        errorDiv.textContent = "No joker_usage data found in save file.";
        errorDiv.classList.remove('hidden');
        return;
    }

    const jokerUsage = data.joker_usage;
    const sortedJokers = Object.entries(jokerUsage).sort((a, b) => {
        // Sort by order if available, otherwise alpha
        const orderA = a[1].order || 9999;
        const orderB = b[1].order || 9999;
        return orderA - orderB;
    });

    let goldCount = 0;

    sortedJokers.forEach(([jokerId, usage]) => {
        const winsByKey = usage.wins_by_key || {};
        let bestStake = null;

        // Find highest stake won
        for (const stake of STAKE_PRIORITY) {
            if (winsByKey[stake]) {
                bestStake = stake;
                break; // Found highest because we iterate priority order
            }
        }

        if (bestStake === 'stake_gold') {
            goldCount++;
        }

        const card = document.createElement('div');
        card.className = 'joker-card';

        if (bestStake) {
            card.classList.add(STAKE_CLASS_MAP[bestStake]);

            // Add sticker badge
            const badge = document.createElement('div');
            badge.className = `sticker-badge sticker-${STAKE_CLASS_MAP[bestStake]}`;
            card.appendChild(badge);
        }

        const nameDisplay = formatJokerName(jokerId);

        const nameEl = document.createElement('div');
        nameEl.className = 'joker-name';
        nameEl.textContent = nameDisplay;

        const idEl = document.createElement('div');
        idEl.className = 'joker-id';
        idEl.textContent = jokerId;

        card.appendChild(nameEl);
        card.appendChild(idEl);

        jokerGrid.appendChild(card);
    });

    // Update Stats
    const totalJokers = 150; // Approximated, dynamic if needed
    document.getElementById('stat-discovered').textContent = `${sortedJokers.length}/${totalJokers}`;
    document.getElementById('stat-gold').textContent = `${goldCount}/${totalJokers}`;

    statsSection.classList.remove('hidden');
    jokerGrid.classList.remove('hidden');
}

function formatJokerName(rawName) {
    // j_delayed_grat -> Delayed Grat
    return rawName.replace('j_', '').split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}
