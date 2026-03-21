/**
 * Happy Birthday Abhinandan Swain
 * script.js — Dynamic photo loading + all interactive features
 *
 * HOW GALLERY WORKS:
 * ─────────────────
 * The script probes the "pictures/" folder automatically.
 * It tries common naming patterns (IMG_XXXX.JPG, photo_N.jpg, etc.).
 * Any image that loads successfully is added to the gallery.
 * To add more photos: simply drop them in the "pictures/" folder — done!
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const PICTURES_DIR = 'Pictures/';

// Filenames to probe (add your own filenames here if needed)
const PROBE_NAMES = [];

// Auto-generate IMG_0276 – IMG_0400 range
for (let n = 276; n <= 400; n++) {
    PROBE_NAMES.push(`IMG_0${n}.JPG`);
    PROBE_NAMES.push(`IMG_0${n}.jpg`);
}
// Also probe generic names
for (let n = 1; n <= 60; n++) {
    PROBE_NAMES.push(`photo_${n}.jpg`);
    PROBE_NAMES.push(`photo_${n}.JPG`);
    PROBE_NAMES.push(`image_${n}.jpg`);
    PROBE_NAMES.push(`${n}.jpg`);
}

const BALLOON_COLORS = ['#ff6fb7','#ffd560','#5bc8ff','#6ee7b7','#c084fc','#ff9a3c','#ff5e78'];
const CONFETTI_COLORS = ['#ff6fb7','#ffd560','#5bc8ff','#6ee7b7','#c084fc','#ff9a3c','#ffffff'];

// ─── STATE ────────────────────────────────────────────────────────────────────
let discoveredImages = [];
let galleryIndex    = 0;
let cardsVisible    = getCardsVisible();
let modalIndex      = 0;
let musicPlaying    = false;
let autoSlideTimer  = null;

function getCardsVisible() {
    return window.innerWidth <= 700 ? 2 : window.innerWidth <= 1000 ? 3 : 4;
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initFloatingStars();
    initBalloons();
    initCountdown();
    initButtons();
    initKeyboard();
    await discoverImages();
    buildGallery();
});

// ─── FLOATING STARS ──────────────────────────────────────────────────────────
function initFloatingStars() {
    const c = document.getElementById('floating-elements');
    for (let i = 0; i < 60; i++) {
        const s = document.createElement('div');
        s.className = 'floating-star';
        const size = Math.random() * 4 + 1.5;
        s.style.cssText = `
            left:${Math.random()*100}%;
            top:${Math.random()*100}%;
            width:${size}px; height:${size}px;
            animation-delay:${Math.random()*8}s;
            animation-duration:${Math.random()*6+5}s;
        `;
        c.appendChild(s);
    }
}

// ─── BALLOONS ────────────────────────────────────────────────────────────────
function initBalloons() {
    const c = document.getElementById('balloons-container');
    function spawn() {
        const b = document.createElement('div');
        b.className = 'balloon';
        const col = BALLOON_COLORS[Math.floor(Math.random()*BALLOON_COLORS.length)];
        const size = Math.random()*20+45;
        b.style.cssText = `
            left:${Math.random()*100}%;
            background:${col};
            animation-duration:${Math.random()*10+12}s;
            animation-delay:${Math.random()*4}s;
            width:${size}px;
            height:${size*1.25}px;
        `;
        b.addEventListener('click', () => burstBalloon(b, col));
        b.addEventListener('touchstart', (e) => {
            e.preventDefault();
            burstBalloon(b, col);
        }, { passive: false });
        c.appendChild(b);
        setTimeout(() => {
            if (b.parentNode) b.remove();
        }, 24000);
    }
    for (let i = 0; i < 8; i++) setTimeout(spawn, i*400);
    setInterval(spawn, 1800);
}

function burstBalloon(balloon, color) {
    // Create burst effect
    const burst = document.createElement('div');
    burst.className = 'balloon-burst';
    burst.style.cssText = `
        position: absolute;
        left: ${balloon.style.left};
        top: ${balloon.style.top};
        width: 0; height: 0;
        pointer-events: none;
        z-index: 10;
    `;
    document.getElementById('balloons-container').appendChild(burst);
    
    // Create confetti pieces
    for (let i = 0; i < 12; i++) {
        const piece = document.createElement('div');
        piece.className = 'burst-confetti';
        
        // Generate random trajectory
        const tx = (Math.random() * 100) - 50; // -50 to +50px
        const ty = (Math.random() * 100) + 20;  // +20 to +120px
        
        piece.style.cssText = `
            position: absolute;
            left: 50%; top: 50%;
            width: 8px; height: 12px;
            background: ${color};
            border-radius: 50%;
            transform: translate(-50%, -50%);
            --tx: ${tx}px;
            --ty: ${ty}px;
            animation: burstFall ${Math.random()*1.5+0.8}s ease-out forwards;
            animation-delay: ${Math.random()*0.2}s;
        `;
        burst.appendChild(piece);
    }
    
    // Remove balloon
    balloon.style.opacity = '0';
    balloon.style.transform = 'scale(0)';
    setTimeout(() => {
        if (balloon.parentNode) balloon.remove();
        burst.remove();
    }, 1000);
    
    // Play pop sound
    playPopSound();
    
    // Launch celebration confetti
    launchConfetti();
}

// Add pop sound function for balloon bursting
function playPopSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.start();
        osc.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        // AudioContext not supported or blocked
    }
}

// Add happy birthday sound function for buttons
function playHappyBirthdaySound() {
    try {
        // Create a new audio element for each burst to allow overlapping sounds
        const audio = new Audio('Birthday.mp3');
        audio.volume = 0.3; // Set volume to 30% to avoid being too loud
        
        // Play the sound
        audio.play().catch((err) => {
            console.warn('Audio playback failed:', err);
        });
    } catch (e) {
        console.warn('Audio not supported:', e);
    }
}

// ─── CONFETTI ────────────────────────────────────────────────────────────────
function launchConfetti() {
    const c = document.getElementById('confetti-container');
    for (let i = 0; i < 80; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        const col = CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)];
        const size = Math.random()*10+6;
        p.style.cssText = `
            left:${Math.random()*100}%;
            top:0;
            width:${size}px; height:${size}px;
            background:${col};
            border-radius:${Math.random()>.5?'50%':'3px'};
            animation-duration:${Math.random()*2.5+2}s;
            animation-delay:${Math.random()*.8}s;
        `;
        c.appendChild(p);
        setTimeout(() => p.remove(), 4000);
    }
}

// ─── IMAGE DISCOVERY ─────────────────────────────────────────────────────────
/**
 * Probes each candidate filename by attempting to load it as an Image.
 * Returns an array of filenames that actually exist.
 */
function probeImage(filename) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => resolve(filename);
        img.onerror = () => resolve(null);
        img.src = PICTURES_DIR + filename + '?t=' + Date.now(); // bust cache
    });
}

async function discoverImages() {
    const countEl = document.getElementById('photo-count-text');
    countEl.textContent = 'Discovering memories…';

    // Deduplicate probe list
    const unique = [...new Set(PROBE_NAMES)];

    // Batch probe in groups of 20 (avoid overwhelming the browser)
    const BATCH = 20;
    const found = [];
    for (let i = 0; i < unique.length; i += BATCH) {
        const batch = unique.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(probeImage));
        results.forEach(r => { if (r) found.push(r); });
    }

    // Deduplicate (e.g. .JPG and .jpg both matched)
    const seen = new Set();
    discoveredImages = found.filter(f => {
        const key = f.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key); return true;
    });

    if (discoveredImages.length === 0) {
        countEl.textContent = 'No photos found — drop images into the pictures/ folder!';
    } else {
        countEl.textContent = `✨ ${discoveredImages.length} beautiful memor${discoveredImages.length===1?'y':'ies'} found!`;
    }
}

// ─── GALLERY BUILD ───────────────────────────────────────────────────────────
function buildGallery() {
    const track = document.getElementById('gallery-track');
    const dotsEl = document.getElementById('gallery-dots');
    track.innerHTML = '';
    dotsEl.innerHTML = '';

    if (discoveredImages.length === 0) {
        track.innerHTML = '<p style="color:rgba(255,255,255,.5);padding:40px;text-align:center">No photos yet. Add images to the <strong>pictures/</strong> folder.</p>';
        return;
    }

    // Build cards
    discoveredImages.forEach((filename, idx) => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <img src="${PICTURES_DIR}${filename}" alt="Memory ${idx+1}" loading="lazy">
            <div class="gallery-card-label">📸 Memory ${idx+1} — ${filename}</div>
        `;
        card.addEventListener('click', () => openModal(idx));
        track.appendChild(card);
    });

    // Build dots (one per card)
    const pages = Math.ceil(discoveredImages.length / cardsVisible);
    for (let i = 0; i < pages; i++) {
        const d = document.createElement('div');
        d.className = 'dot' + (i===0?' active':'');
        d.addEventListener('click', () => goToPage(i));
        dotsEl.appendChild(d);
    }

    startAutoSlide();
    updateGalleryPosition();
}

function updateGalleryPosition() {
    cardsVisible = getCardsVisible();
    const cardWidth = window.innerWidth <= 700 ? 170 : 220;
    const gap = 24;
    const offset = galleryIndex * (cardWidth + gap);
    document.getElementById('gallery-track').style.transform = `translateX(-${offset}px)`;

    // Dots
    const pages = Math.ceil(discoveredImages.length / cardsVisible);
    const currentPage = Math.floor(galleryIndex / cardsVisible);
    document.querySelectorAll('.dot').forEach((d,i) => {
        d.classList.toggle('active', i === currentPage);
    });
}

function goToPage(page) {
    galleryIndex = page * cardsVisible;
    clampGalleryIndex();
    updateGalleryPosition();
    resetAutoSlide();
}

function clampGalleryIndex() {
    const max = Math.max(0, discoveredImages.length - cardsVisible);
    galleryIndex = Math.max(0, Math.min(galleryIndex, max));
}

function startAutoSlide() {
    clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(() => {
        galleryIndex += cardsVisible;
        if (galleryIndex >= discoveredImages.length) galleryIndex = 0;
        updateGalleryPosition();
    }, 4000);
}
function resetAutoSlide() {
    clearInterval(autoSlideTimer);
    startAutoSlide();
}

// Nav buttons
document.getElementById('prev-btn').addEventListener('click', () => {
    galleryIndex -= cardsVisible;
    clampGalleryIndex();
    if (galleryIndex < 0) galleryIndex = Math.max(0, discoveredImages.length - cardsVisible);
    updateGalleryPosition();
    resetAutoSlide();
});
document.getElementById('next-btn').addEventListener('click', () => {
    galleryIndex += cardsVisible;
    if (galleryIndex >= discoveredImages.length) galleryIndex = 0;
    updateGalleryPosition();
    resetAutoSlide();
});

window.addEventListener('resize', () => {
    cardsVisible = getCardsVisible();
    clampGalleryIndex();
    updateGalleryPosition();
});

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(idx) {
    modalIndex = idx;
    renderModal();
    const modal = document.getElementById('photo-modal');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function renderModal() {
    const f = discoveredImages[modalIndex];
    document.getElementById('modal-img').src    = PICTURES_DIR + f;
    document.getElementById('modal-caption').textContent = `📸 Memory ${modalIndex+1} of ${discoveredImages.length} — ${f}`;
}
function closeModal() {
    document.getElementById('photo-modal').classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', closeModal);
document.getElementById('modal-prev').addEventListener('click', () => {
    modalIndex = (modalIndex - 1 + discoveredImages.length) % discoveredImages.length;
    renderModal();
});
document.getElementById('modal-next').addEventListener('click', () => {
    modalIndex = (modalIndex + 1) % discoveredImages.length;
    renderModal();
});

// ─── CANDLES ────────────────────────────────────────────────────────────────
document.getElementById('light-all-btn').addEventListener('click', () => {
    for (let i = 1; i <= 6; i++) {
        const fl = document.getElementById(`flame${i}`);
        if (fl) fl.classList.add('lit');
    }
    document.getElementById('wish-message').textContent = '🌟 Make a wish, Abhinandan! 🌟';
    launchConfetti();
});
document.getElementById('blow-btn').addEventListener('click', () => {
    for (let i = 1; i <= 6; i++) {
        const fl = document.getElementById(`flame${i}`);
        if (fl) fl.classList.remove('lit');
    }
    document.getElementById('wish-message').textContent = '🎉 Your wish is on its way! Happy Birthday! 🎂';
    launchConfetti();
});

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────
function initCountdown() {
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Birthday date: June 28, 2018
        const birthday = new Date(currentYear, 5, 28); // Month is 0-indexed (5 = June)
        
        // If birthday has already passed this year, set it for next year
        if (now > birthday) {
            birthday.setFullYear(currentYear + 1);
        }

        const diff = birthday - now;

        if (diff <= 0) {
            // It's the birthday!
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minutesEl.textContent = '00';
            secondsEl.textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.textContent = days.toString().padStart(2, '0');
        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ─── BUTTONS ────────────────────────────────────────────────────────────────
function initButtons() {
    const celebBtn  = document.getElementById('celebrate-btn');
    const musicBtn  = document.getElementById('play-music-btn');
    const music     = document.getElementById('birthday-music');

    // Separate audio context for celebrate button sound
    let celebrateAudioContext = null;
    let celebrateGainNode = null;

    function playCelebrateSound() {
        try {
            if (!celebrateAudioContext) {
                celebrateAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                celebrateGainNode = celebrateAudioContext.createGain();
                celebrateGainNode.gain.value = 0.3;
                celebrateGainNode.connect(celebrateAudioContext.destination);
            }

            if (celebrateAudioContext.state === 'suspended') {
                celebrateAudioContext.resume();
            }

            const osc = celebrateAudioContext.createOscillator();
            const gain = celebrateAudioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, celebrateAudioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, celebrateAudioContext.currentTime + 0.2);
            
            gain.gain.setValueAtTime(0.3, celebrateAudioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, celebrateAudioContext.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(celebrateGainNode);
            
            osc.start();
            osc.stop(celebrateAudioContext.currentTime + 0.2);
        } catch (e) {
            console.warn('Celebrate sound failed:', e);
        }
    }

    celebBtn.addEventListener('click', () => {
        launchConfetti();
        playCelebrateSound();
        celebBtn.textContent = '🎊 Celebrating! 🎊';
        setTimeout(() => celebBtn.textContent = '🎉 Celebrate!', 2500);
    });

    musicBtn.addEventListener('click', () => {
        if (musicPlaying) {
            music.pause();
            musicBtn.textContent = '🎵 Play Music';
            musicBtn.classList.remove('playing');
            musicPlaying = false;
        } else {
            // Try to play music with user gesture context
            music.play().then(() => {
                musicBtn.textContent = '🔇 Pause Music';
                musicBtn.classList.add('playing');
                musicPlaying = true;
            }).catch((err) => {
                console.warn('Audio play failed:', err);
                musicBtn.textContent = '🎵 Play Music (tap again)';
                musicBtn.classList.remove('playing');
                musicPlaying = false;
            });
        }
    });

    // Auto-play music on first user interaction (to bypass autoplay policies)
    document.body.addEventListener('click', () => {
        if (!musicPlaying && music.paused) {
            music.play().then(() => {
                musicBtn.textContent = '🔇 Pause Music';
                musicBtn.classList.add('playing');
                musicPlaying = true;
            }).catch(() => {});
        }
    }, { once: true });
}

// ─── KEYBOARD ────────────────────────────────────────────────────────────────
function initKeyboard() {
    document.addEventListener('keydown', e => {
        const modal = document.getElementById('photo-modal');
        if (modal.classList.contains('open')) {
            if (e.key === 'ArrowLeft')  document.getElementById('modal-prev').click();
            if (e.key === 'ArrowRight') document.getElementById('modal-next').click();
            if (e.key === 'Escape')     closeModal();
        } else {
            if (e.key === 'ArrowLeft')  document.getElementById('prev-btn').click();
            if (e.key === 'ArrowRight') document.getElementById('next-btn').click();
        }
    });
}

console.log('🎂 Happy Birthday Abhinandan Swain! Drop photos in pictures/ to populate the gallery.');
