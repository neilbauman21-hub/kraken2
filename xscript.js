const gameCSS = `
:root {
    --accent: #3b82f6;
    --accent-light: #60a5fa;
    --accent-glow: rgba(59, 130, 246, 0.3);
    --accent-dim: rgba(59, 130, 246, 0.15);
    --bg-deep: #050a14;
    --bg-light: #0c1524;
    --text-heading: #ffffff;
    --text-main: #c8d6e5;
    --text-muted: #4a6a96;
    --glass-border: #1a2744;
}

body.game-active * { box-sizing: border-box; font-family: 'Inter', sans-serif; }
body.game-active { overflow: hidden !important; background-color: var(--bg-deep) !important; color: var(--text-main) !important; margin: 0; padding: 0; }

body.game-active > *:not(#app-container):not(script):not(style):not(link) {
    display: none !important;
}

#app-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; background-color: var(--bg-deep); z-index: 2147483646; }

/* Animated background */
#app-bg-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }

/* Top Navigation Bar */
#top-nav {
    position: relative; z-index: 50;
    display: flex; align-items: center;
    height: 56px; padding: 0 20px;
    background: rgba(5, 10, 20, 0.85);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
}

.nav-brand {
    display: flex; align-items: center; gap: 10px;
    margin-right: 32px; cursor: pointer;
}
.nav-brand img {
    width: 32px; height: 32px; border-radius: 8px;
    box-shadow: 0 0 12px var(--accent-glow);
}
.nav-brand span {
    font-size: 16px; font-weight: 700;
    background: linear-gradient(135deg, var(--accent-light), var(--accent));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-links {
    display: flex; align-items: center; gap: 4px;
    flex: 1;
}

.nav-link {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px;
    color: var(--text-muted); font-size: 13px; font-weight: 500;
    text-decoration: none; cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
}
.nav-link:hover {
    color: var(--accent-light);
    background: var(--accent-dim);
    border-color: rgba(59, 130, 246, 0.1);
}
.nav-link.active {
    color: var(--accent-light);
    background: var(--accent-dim);
    border-color: rgba(59, 130, 246, 0.2);
}
.nav-link i { font-size: 14px; }

.nav-right {
    display: flex; align-items: center; gap: 8px;
    margin-left: auto;
}
.nav-right a {
    color: var(--text-muted); font-size: 12px;
    text-decoration: none; padding: 6px 10px;
    border-radius: 6px; transition: color 0.15s;
    letter-spacing: 0.05em; text-transform: uppercase;
}
.nav-right a:hover { color: var(--accent-light); }

/* Content Area */
#content-area {
    flex: 1; position: relative; z-index: 10;
    overflow: hidden;
}

#mainFrame {
    width: 100%; height: 100%;
    border: none; background: var(--bg-deep);
    display: block;
}

/* Loader */
#loaderOverlay {
    position: absolute; inset: 0; z-index: 4500;
    background: var(--bg-deep);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    transition: opacity 0.6s ease;
}
.loader-ring {
    width: 48px; height: 48px;
    border: 2px solid rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text {
    font-size: 12px; letter-spacing: 4px;
    color: var(--text-muted); font-weight: 500;
    text-transform: uppercase;
}
`;

const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const faLink = document.createElement('link');
faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
faLink.rel = "stylesheet";
document.head.appendChild(faLink);

const styleEl = document.createElement('style');
styleEl.innerHTML = gameCSS;
document.head.appendChild(styleEl);

const gameHTML = `
    <div id="app-container">
        <canvas id="app-bg-canvas"></canvas>
        <nav id="top-nav">
            <div class="nav-brand" onclick="loadPage('hms.html', document.querySelector('.nav-link'))">
                <img src="assets/img/logo.jpg" alt="Kraken">
                <span>Kraken Network</span>
            </div>
            <div class="nav-links">
                <a class="nav-link active" onclick="loadPage('hms.html', this)">
                    <i class="fa-solid fa-house"></i> Home
                </a>
                <a class="nav-link" onclick="loadPage('gms.html', this)">
                    <i class="fa-solid fa-gamepad"></i> Games
                </a>
                <a class="nav-link" onclick="loadPage('24g.html', this)">
                    <i class="fa-solid fa-compass"></i> Proxy
                </a>
                <a class="nav-link" onclick="loadPage('ai.html', this)">
                    <i class="fa-solid fa-robot"></i> AI
                </a>
                <a class="nav-link" onclick="loadPage('aps.html', this)">
                    <i class="fa-solid fa-grid-2"></i> Apps
                </a>
                <a class="nav-link" onclick="loadPage('movies.html', this)">
                    <i class="fa-solid fa-film"></i> Movies
                </a>
            </div>
            <div class="nav-right">
                <a href="#" target="_blank">Discord</a>
                <a href="#" target="_blank">GitHub</a>
            </div>
        </nav>
        <main id="content-area">
            <iframe id="mainFrame" src="hms.html" onload="hideLoader()"></iframe>
            <div id="loaderOverlay">
                <div class="loader-ring"></div>
                <div class="loading-text">Loading</div>
            </div>
        </main>
    </div>
`;

document.body.insertAdjacentHTML('beforeend', gameHTML);

// Animated particle background
(function initBgCanvas() {
    const canvas = document.getElementById('app-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.5 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            o: Math.random() * 0.4 + 0.1
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59, 130, 246, ${p.o})`;
            ctx.fill();
        });

        // Draw faint connecting lines between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }
    draw();
})();

// Load external cursor script
const externalScript = document.createElement('script');
externalScript.src = "https://latte-x.neocities.org/pilly.js";
document.body.appendChild(externalScript);

const appContainer = document.getElementById('app-container');
appContainer.style.display = 'none';

setTimeout(() => {
    if (!document.body.classList.contains('game-active')) {
        document.body.classList.add('game-active');
        appContainer.style.display = 'flex';
    }
}, 2000);

window.loadPage = function(url, element) {
    const loader = document.getElementById('loaderOverlay');
    loader.style.display = 'flex';
    loader.style.opacity = '1';
    document.getElementById('mainFrame').src = url;
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    if (element) element.classList.add('active');
};

window.hideLoader = function() {
    setTimeout(() => {
        const loader = document.getElementById('loaderOverlay');
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 600);
    }, 800);
};

document.addEventListener('keydown', (e) => {
    if (e.key === '`') {
        const app = document.getElementById('app-container');
        if (document.body.classList.contains('game-active')) {
            document.body.classList.remove('game-active');
            app.style.display = 'none';
        } else {
            document.body.classList.add('game-active');
            app.style.display = 'flex';
        }
    }
});
