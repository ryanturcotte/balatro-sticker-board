
import { processFile } from './src/index.js';

const fileInput = document.getElementById('fileInput');
const jokerGrid = document.getElementById('joker-grid');
const loadingDiv = document.getElementById('loading');
const statsSection = document.getElementById('stats');
const errorDiv = document.getElementById('error');
const controlsDiv = document.getElementById('controls');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const viewBtns = document.querySelectorAll('.view-btn');
const hideNamesInput = document.getElementById('hideNamesInput');

let cachedData = null;
let currentStakeFilter = 'all';
let currentSearchQuery = '';
let currentViewMode = 'grid'; // 'grid' or 'tier'

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
    controlsDiv.classList.add('hidden');

    try {
        const buffer = await file.arrayBuffer();

        // The processFile function is synchronous in the original code, 
        // but we treat it carefully here.
        const json = processFile(buffer);

        console.log("Parsed JSON:", json);
        cachedData = json;

        renderJokers();
        controlsDiv.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        errorDiv.textContent = "Error parsing file. Please ensure it is a valid .jkr file.";
        errorDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
    }
}

function createJokerCard(joker) {
    const { id, bestStake, name } = joker;
    const card = document.createElement('div');
    card.className = 'joker-card';

    if (bestStake) {
        card.classList.add(STAKE_CLASS_MAP[bestStake]);

        // Add sticker badge
        const badge = document.createElement('div');
        badge.className = `sticker-badge sticker-${STAKE_CLASS_MAP[bestStake]}`;
        card.appendChild(badge);
    }

    const imageContainer = document.createElement('div');
    imageContainer.className = 'joker-image-container';

    const img = document.createElement('img');
    const filename = getJokerFilename(id, name);
    img.src = `static/img/jokers/${filename}`;
    img.alt = name;
    img.className = 'joker-image';

    // Handle image load error (fallback)
    img.onerror = () => {
        console.warn(`Failed to load image for ${id} at ${filename}`);
        img.style.display = 'none';
    };

    imageContainer.appendChild(img);
    card.appendChild(imageContainer);

    const nameEl = document.createElement('div');
    nameEl.className = 'joker-name';
    nameEl.textContent = name;

    card.appendChild(nameEl);
    return card;
}

function renderJokers() {
    if (!cachedData || !cachedData.joker_usage) {
        errorDiv.textContent = "No joker_usage data found in save file.";
        errorDiv.classList.remove('hidden');
        return;
    }

    jokerGrid.innerHTML = ''; // Clear grid before rendering
    const jokerUsage = cachedData.joker_usage;

    // Convert to array and handle filtering
    let processedJokers = Object.entries(jokerUsage).map(([jokerId, usage]) => {
        const winsByKey = usage.wins_by_key || {};
        let bestStake = null;

        // Find highest stake won
        for (const stake of STAKE_PRIORITY) {
            if (winsByKey[stake]) {
                bestStake = stake;
                break;
            }
        }

        return {
            id: jokerId,
            usage: usage,
            bestStake: bestStake,
            name: formatJokerName(jokerId)
        };
    });

    // Apply Filters
    if (currentStakeFilter !== 'all') {
        processedJokers = processedJokers.filter(joker => {
            if (currentStakeFilter === 'none') {
                return !joker.bestStake;
            }
            return joker.bestStake === currentStakeFilter;
        });
    }

    if (currentSearchQuery) {
        const query = currentSearchQuery.toLowerCase();
        processedJokers = processedJokers.filter(joker =>
            joker.name.toLowerCase().includes(query) ||
            joker.id.toLowerCase().includes(query)
        );
    }

    // Sort
    processedJokers.sort((a, b) => {
        const orderA = a.usage.order || 9999;
        const orderB = b.usage.order || 9999;
        return orderA - orderB;
    });

    // Update Stats
    const totalJokers = 150;
    const goldCount = processedJokers.filter(j => j.bestStake === 'stake_gold').length;
    document.getElementById('stat-discovered').textContent = `${processedJokers.length}/${totalJokers}`;
    document.getElementById('stat-gold').textContent = `${goldCount}/${totalJokers}`;

    if (currentViewMode === 'tier') {
        renderTierView(processedJokers);
    } else {
        renderGridView(processedJokers);
    }

    if (hideNamesInput.checked) {
        jokerGrid.classList.add('hide-names');
    } else {
        jokerGrid.classList.remove('hide-names');
    }

    statsSection.classList.remove('hidden');
    jokerGrid.classList.remove('hidden');
}

function renderGridView(processedJokers) {
    jokerGrid.style.display = 'grid';
    processedJokers.forEach((joker) => {
        const card = createJokerCard(joker);
        jokerGrid.appendChild(card);
    });
}

function renderTierView(processedJokers) {
    jokerGrid.style.display = 'block';

    // Stakes + 'none'
    const tierOrder = [...STAKE_PRIORITY, 'none'];

    tierOrder.forEach(stakeKey => {
        const jokersInTier = processedJokers.filter(j =>
            stakeKey === 'none' ? !j.bestStake : j.bestStake === stakeKey
        );

        if (jokersInTier.length === 0) return;

        // Create row if it has jokers
        const tierRow = document.createElement('div');
        tierRow.className = 'tier-row';

        const tierHeader = document.createElement('div');
        tierHeader.className = 'tier-header';

        const label = document.createElement('span');
        label.className = `tier-label sticker-${STAKE_CLASS_MAP[stakeKey] || 'none'}`;
        label.textContent = STAKE_CLASS_MAP[stakeKey] ?
            STAKE_CLASS_MAP[stakeKey].charAt(0).toUpperCase() + STAKE_CLASS_MAP[stakeKey].slice(1) :
            'No Sticker';

        // Custom background for labels if not already handled by sticker colors
        if (!STAKE_CLASS_MAP[stakeKey]) {
            label.style.background = '#444';
        } else {
            label.style.background = `var(--${STAKE_CLASS_MAP[stakeKey]})`;
            if (['gold', 'white', 'green'].includes(STAKE_CLASS_MAP[stakeKey])) {
                label.style.color = '#000';
            }
        }

        tierHeader.appendChild(label);
        tierRow.appendChild(tierHeader);

        const tierContent = document.createElement('div');
        tierContent.className = 'tier-content';
        if (hideNamesInput.checked) tierContent.classList.add('hide-names');

        jokersInTier.forEach(joker => {
            tierContent.appendChild(createJokerCard(joker));
        });

        tierRow.appendChild(tierContent);
        jokerGrid.appendChild(tierRow);
    });
}

// Search and Filter Listeners
searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    renderJokers();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentStakeFilter = btn.dataset.stake;
        renderJokers();
    });
});

viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentViewMode = btn.dataset.view;
        renderJokers();
    });
});

hideNamesInput.addEventListener('change', () => {
    renderJokers();
});

function formatJokerName(rawName) {
    // Some special cases for formatting
    const specialNames = {
        'j_delayed_grat': 'Delayed Gratification',
        'j_sly': 'Sly Joker',
        'j_zany': 'Zany Joker',
        'j_mad': 'Mad Joker',
        'j_crazy': 'Crazy Joker',
        'j_devious': 'Devious Joker',
        'j_crafty': 'Crafty Joker',
        'j_clever': 'Clever Joker',
        'j_wily': 'Wily Joker',
        'j_greedy': 'Greedy Joker',
        'j_gluttonous': 'Gluttonous Joker',
        'j_gluttenous_joker': 'Gluttonous Joker', // Correcting common typo
        'j_jolly': 'Jolly Joker',
        'j_stencil': 'Joker Stencil',
        'j_burnt': 'Burnt Joker',
        'j_canio': 'Canio',
        'j_caino': 'Canio', // Correcting common typo
        'j_half': 'Half Joker',
        'j_space': 'Space Joker',
        'j_stone': 'Stone Joker',
        'j_stone_joker': 'Stone Joker',
        'j_steel_joker': 'Steel Joker',
        'j_glass': 'Glass Joker',
        'j_glass_joker': 'Glass Joker',
        'j_golden': 'Golden Joker',
        'j_golden_joker': 'Golden Joker',
        'j_blue_joker': 'Blue Joker',
        'j_red_joker': 'Red Joker',
        'j_green_joker': 'Green Joker',
        'j_fortune_teller': 'Fortune Teller',
        'j_droll': 'Droll Joker',
        'j_marble': 'Marble Joker',
        'j_business': 'Business Card',
        'j_flash': 'Flash Card',
        'j_mr_bones': 'Mr. Bones',
        'j_smeared': 'Smeared Joker',
        'j_ring_master': 'Showman',
        'j_wee': 'Wee Joker',
        'j_idol': 'The Idol',
        'j_invisible': 'Invisible Joker',
        'j_ceremonial': 'Ceremonial Dagger',
        'j_chaos': 'Chaos the Clown',
        'j_abstract': 'Abstract Joker',
        'j_faceless': 'Faceless Joker',
        'j_todo_list': 'To Do List',
        'j_square': 'Square Joker',
        'j_gift': 'Gift Card',
        'j_mail': 'Mail In Rebate',
        'j_baseball': 'Baseball Card',
        'j_trading': 'Trading Card',
        'j_trousers': 'Spare Trousers',
        'j_ancient': 'Ancient Joker',
        'j_selzer': 'Seltzer',
        'j_smiley': 'Smiley Face',
        'j_ticket': 'Golden Ticket',
        'j_oops': 'Oops! All 6s',
        'j_duo': 'The Duo',
        'j_trio': 'The Trio',
        'j_family': 'The Family',
        'j_order': 'The Order',
        'j_tribe': 'The Tribe'
    };

    if (specialNames[rawName]) return specialNames[rawName];

    // j_delayed_grat -> Delayed Grat
    return rawName.replace('j_', '').split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getJokerFilename(jokerId, nameDisplay) {
    // Standard mapping: "8 Ball" -> "8_Ball.png"
    let filename = nameDisplay.replace(/ /g, '_');

    // Character normalizations (match what normalize_jokers.js does)
    filename = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, ""); // Accents
    filename = filename.replace(/-/g, '_');
    filename = filename.replace(/[^a-zA-Z0-9_.]/g, ''); // Remove special chars
    filename = filename.replace(/__+/g, '_');

    return filename + '.png';
}

/* Google Analytics Consent Logic */
document.addEventListener('DOMContentLoaded', () => {
    const gaId = window.GA_ID;
    const banner = document.getElementById('consent-banner');
    const acceptBtn = document.getElementById('consent-accept');
    const declineBtn = document.getElementById('consent-decline');

    // If no ID or placeholder, don't run (Local dev)
    if (!gaId || gaId.includes('PLACEHOLDER')) {
        console.log('GA disabled (Local/No ID)');
        return;
    }

    const consent = localStorage.getItem('ga_consent');

    if (consent === 'granted') {
        loadGA(gaId);
    } else if (consent === null) {
        banner.classList.remove('hidden');
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('ga_consent', 'granted');
        banner.classList.add('hidden');
        loadGA(gaId);
    });

    declineBtn.addEventListener('click', () => {
        localStorage.setItem('ga_consent', 'denied');
        banner.classList.add('hidden');
    });
});

function loadGA(id) {
    console.log('Loading Google Analytics...');

    // Inject Script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    // Initialize
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', id);
}
