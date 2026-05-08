const gameCSS = `
:root {
    --accent: #3b82f6;
    --accent-light: #60a5fa;
    --accent-glow: rgba(59, 130, 246, 0.3);
    --accent-dim: rgba(59, 130, 246, 0.15);
    --bg-deep: #050a14;
    --bg-light: #0c1524;
    --sidebar-bg: #060e1a;
    --text-heading: #ffffff;
    --text-main: #c8d6e5;
    --text-muted: #6b7fa3;
    --glass-border: #1a2744;
}

body.game-active * { box-sizing: border-box; font-family: 'Inter', sans-serif; cursor: none !important; }
body.game-active iframe { cursor: auto !important; }
body.game-active { overflow: hidden !important; background-color: var(--bg-deep) !important; color: var(--text-main) !important; margin: 0; padding: 0; }

body.game-active > *:not(#app-container):not(#custom-v-cursor):not(script):not(style):not(link) {
    display: none !important;
}

#custom-v-cursor { position: fixed; top: 0; left: 0; width: 32px; height: 32px; z-index: 2147483647; pointer-events: none; will-change: transform; opacity: 0; transition: opacity 0.1s ease-out; }
#app-container { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: row; background-color: var(--bg-deep); z-index: 2147483646; }

@keyframes starDrift {
    0% { background-position: 0 0, 40px 60px, 130px 270px, 70px 100px; }
    100% { background-position: 550px 550px, 390px 410px, 380px 520px, 220px 250px; }
}

#app-container::before { content: ''; position: absolute; inset: 0; z-index: -1; background-image: radial-gradient(rgba(59,130,246,0.15), rgba(59,130,246,0.05) 2px, transparent 40px), radial-gradient(rgba(59,130,246,0.1), rgba(59,130,246,0.04) 1px, transparent 30px), radial-gradient(rgba(96,165,250,0.08), rgba(96,165,250,0.03) 2px, transparent 40px); background-size: 550px 550px, 350px 350px, 250px 250px; animation: starDrift 120s linear infinite; }
#sidebar-spacer { width: 85px; min-width: 85px; height: 100vh; flex-shrink: 0; background: transparent; z-index: 10; }
#sidebar-wrapper { position: absolute; left: 0; top: 0; width: 260px; height: 100vh; background: var(--sidebar-bg); border-right: 1px solid var(--glass-border); z-index: 50; overflow: hidden; transform: translate3d(-175px, 0, 0); transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; }
#sidebar-content { width: 260px; height: 100%; display: flex; flex-direction: column; padding: 25px 0; transform: translate3d(175px, 0, 0); transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); will-change: transform; }
#sidebar-wrapper.expanded { transform: translate3d(0, 0, 0); }
#sidebar-wrapper.expanded #sidebar-content { transform: translate3d(0, 0, 0); }

.sidebar-brand { display: flex; align-items: center; margin: 0 12px 30px 12px; height: 44px; }
.brand-icon-wrapper { width: 61px; min-width: 61px; display: flex; justify-content: center; }
.brand-icon { width: 42px; height: 42px; background: var(--bg-light); border: 1px solid var(--glass-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.brand-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.brand-icon .lucide { color: var(--accent); }
.brand-text { margin-left: 8px; font-size: 19px; font-weight: 700; color: var(--accent-light); opacity: 0; white-space: nowrap; transition: opacity 0.15s; text-shadow: 0 0 20px var(--accent-glow); }
.nav-item { display: flex; align-items: center; margin: 4px 12px; height: 48px; border-radius: 12px; color: var(--text-muted); transition: background 0.1s; white-space: nowrap; text-decoration: none; cursor: none !important; }
.icon-container { width: 61px; min-width: 61px; display: flex; justify-content: center; }
.nav-text { opacity: 0; margin-left: 6px; transition: opacity 0.15s; }
.nav-item:hover, .nav-item.active { background: var(--accent-dim); color: var(--accent-light); }
.sidebar-footer { margin-top: auto; border-top: 1px solid var(--glass-border); padding-top: 15px; }

#sidebar-wrapper.expanded .brand-text, #sidebar-wrapper.expanded .nav-text { opacity: 1; transition-delay: 0.1s; }
#content-area { flex-grow: 1; height: 100vh; padding: 20px; position: relative; }
#iframe-shield { position: absolute; inset: 20px; z-index: 40; background: transparent; pointer-events: none; }
#sidebar-wrapper.expanded ~ #content-area #iframe-shield { pointer-events: auto; }
#iframe-wrapper { width: 100%; height: 100%; border-radius: 24px; border: 1px solid var(--glass-border); overflow: hidden; position: relative; background: var(--bg-deep); }
#mainFrame { width: 100%; height: 100%; border: none; background: #fff; display: block; }
#loaderOverlay { position: absolute; inset: 0; z-index: 4500; background: var(--bg-deep); display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.8s ease; }
.loader-ring { width: 70px; height: 70px; border: 3px solid rgba(59, 130, 246, 0.15); border-radius: 50%; border-top-color: var(--accent); animation: spin 1s linear infinite; margin-bottom: 25px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.loading-text { font-size: 15px; letter-spacing: 6px; color: var(--accent-light); font-weight: 600; text-transform: uppercase; }
`;

const fontLink = document.createElement('link');
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const styleEl = document.createElement('style');
styleEl.innerHTML = gameCSS;
document.head.appendChild(styleEl);

const gameHTML = `
    <svg id="custom-v-cursor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2 L22 22 L12 18 L2 22 Z" fill="#3b82f6" />
    </svg>
    <div id="app-container">
        <div id="sidebar-spacer"></div>
        <div id="sidebar-wrapper" onmouseenter="handleSidebarHover(true)" onmouseleave="handleSidebarHover(false)">
            <nav id="sidebar-content">
                <div class="sidebar-brand">
                    <div class="brand-icon-wrapper">
                        <div class="brand-icon"><img src="assets/img/logo.jpg" alt="Kraken"></div>
                    </div>
                    <div class="brand-text">Kraken Network</div>
                </div>
                <a class="nav-item active" onclick="loadPage('hms.html', this)">
                    <div class="icon-container"><i data-lucide="home"></i></div>
                    <span class="nav-text">Home</span>
                </a>
                <a class="nav-item" onclick="loadPage('gms.html', this)">
                    <div class="icon-container"><i data-lucide="gamepad-2"></i></div>
                    <span class="nav-text">Games</span>
                </a>
                <a class="nav-item" onclick="loadPage('24g.html', this)">
                    <div class="icon-container"><i data-lucide="compass"></i></div>
                    <span class="nav-text">Proxy</span>
                </a>
                <a class="nav-item" onclick="loadPage('ai.html', this)">
                    <div class="icon-container"><i data-lucide="bot"></i></div>
                    <span class="nav-text">AI</span>
                </a>
                <a class="nav-item" onclick="loadPage('aps.html', this)">
                    <div class="icon-container"><i data-lucide="grid"></i></div>
                    <span class="nav-text">Apps</span>
                </a>
                <a class="nav-item" onclick="loadPage('movies.html', this)">
                    <div class="icon-container"><i data-lucide="film"></i></div>
                    <span class="nav-text">Movies</span>
                </a>
                <div class="sidebar-footer">
                    <a class="nav-item" href="#" target="_blank">
                        <div class="icon-container"><i data-lucide="message-circle"></i></div>
                        <span class="nav-text">Discord</span>
                    </a>
                </div>
            </nav>
        </div>
        <main id="content-area">
            <div id="iframe-shield"></div>
            <div id="iframe-wrapper">
                <iframe id="mainFrame" src="hms.html" onload="hideLoader()"></iframe>
                <div id="loaderOverlay">
                    <div class="loader-ring"></div>
                    <div class="loading-text">Loading</div>
                </div>
            </div>
        </main>
    </div>
`;

document.body.insertAdjacentHTML('beforeend', gameHTML);

const externalScript = document.createElement('script');
externalScript.src = "https://latte-x.neocities.org/pilly.js";
document.body.appendChild(externalScript);

const lucideScript = document.createElement('script');
lucideScript.src = "https://unpkg.com/lucide@latest";
lucideScript.onload = () => { lucide.createIcons(); };
document.body.appendChild(lucideScript);

const appContainer = document.getElementById('app-container');
const cursorShip = document.getElementById('custom-v-cursor');
appContainer.style.display = 'none';
cursorShip.style.display = 'none';

setTimeout(() => {
    if (!document.body.classList.contains('game-active')) {
        document.body.classList.add('game-active');
        appContainer.style.display = 'flex';
        cursorShip.style.display = 'block';
    }
}, 2000);

window.handleSidebarHover = function(isHovering) {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    if (isHovering) sidebarWrapper.classList.add('expanded');
    else sidebarWrapper.classList.remove('expanded');
};

window.loadPage = function(url, element) {
    const loader = document.getElementById('loaderOverlay');
    loader.style.display = 'flex';
    setTimeout(() => { loader.style.opacity = '1'; }, 10);
    document.getElementById('mainFrame').src = url;
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    element.classList.add('active');
};

window.hideLoader = function() {
    setTimeout(() => {
        const loader = document.getElementById('loaderOverlay');
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 800);
    }, 1200);
};

document.addEventListener('keydown', (e) => {
    if (e.key === '`') {
        const app = document.getElementById('app-container');
        const ship = document.getElementById('custom-v-cursor');
        if (document.body.classList.contains('game-active')) {
            document.body.classList.remove('game-active');
            app.style.display = 'none';
            ship.style.display = 'none';
        } else {
            document.body.classList.add('game-active');
            app.style.display = 'flex';
            ship.style.display = 'block';
        }
    }
});

const ship = document.getElementById('custom-v-cursor');
const iframeWrapper = document.getElementById('iframe-wrapper');
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let shipX = window.innerWidth / 2, shipY = window.innerHeight / 2;
let currentAngle = 0;
let isCursorVisible = false;

document.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('game-active')) return;
    mouseX = e.clientX; mouseY = e.clientY;
    const overIframe = e.target.closest('#iframe-wrapper') || e.target.tagName.toLowerCase() === 'iframe';
    if (overIframe) { if (isCursorVisible) { ship.style.opacity = '0'; isCursorVisible = false; } }
    else { if (!isCursorVisible) { ship.style.opacity = '1'; isCursorVisible = true; } }
});

if (iframeWrapper) {
    iframeWrapper.addEventListener('mouseenter', () => { ship.style.opacity = '0'; isCursorVisible = false; });
    iframeWrapper.addEventListener('mouseleave', () => { ship.style.opacity = '1'; isCursorVisible = true; });
}

document.addEventListener('mouseout', (e) => { if (e.relatedTarget === null) { ship.style.opacity = '0'; isCursorVisible = false; } });
window.addEventListener('blur', () => { ship.style.opacity = '0'; isCursorVisible = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) { ship.style.opacity = '0'; isCursorVisible = false; } });

function animateCursor() {
    const dx = mouseX - shipX; const dy = mouseY - shipY;
    shipX += dx * 0.45; shipY += dy * 0.45;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { currentAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; }
    ship.style.transform = `translate3d(${shipX - 16}px, ${shipY - 16}px, 0) rotate(${currentAngle}deg)`;
    requestAnimationFrame(animateCursor);
}
animateCursor();
