// =====================================================
// CONFIGURATION
// =====================================================
const DEFAULT_WISP = window.SITE_CONFIG?.defaultWisp ?? `wss://${location.host}/wisp/`;
const WISP_SERVERS = [{ name: "Local Server", url: `wss://${location.host}/wisp/` }];

if (!localStorage.getItem("proxServer")) {
    localStorage.setItem("proxServer", DEFAULT_WISP);
}

function getAllWispServers() {
    const customWisps = getStoredWisps();
    return [...WISP_SERVERS, ...customWisps];
}

// =====================================================
// BULLETPROOF HEALTH & ERROR HANDLING
// =====================================================
async function pingWispServer(url, timeout = 2000) {
    return new Promise((resolve) => {
        const start = Date.now();
        try {
            const ws = new WebSocket(url);
            const timer = setTimeout(() => {
                try { ws.close(); } catch {}
                resolve({ url, success: false, latency: null });
            }, timeout);
            ws.onopen = () => { clearTimeout(timer); ws.close(); resolve({ url, success: true, latency: Date.now() - start }); };
            ws.onerror = () => { clearTimeout(timer); ws.close(); resolve({ url, success: false, latency: null }); };
        } catch { resolve({ url, success: false, latency: null }); }
    });
}

async function findBestWispServer(servers, currentUrl) {
    if (!servers || servers.length === 0) return currentUrl;
    const results = await Promise.all(servers.map(s => pingWispServer(s.url, 2000)));
    const working = results.filter(r => r.success).sort((a, b) => a.latency - b.latency);
    return working.length > 0 ? working[0].url : currentUrl || servers[0]?.url;
}

async function initializeWithBestServer() {
    const autoswitch = localStorage.getItem('wispAutoswitch') !== 'false';
    const allServers = getAllWispServers();
    if (!autoswitch || allServers.length <= 1) return;

    const currentUrl = localStorage.getItem("proxServer") || DEFAULT_WISP;
    const currentCheck = await pingWispServer(currentUrl, 2000);
    
    if (!currentCheck.success) {
        console.log("Current server dead. Finding best server...");
        const best = await findBestWispServer(allServers, currentUrl);
        if (best && best !== currentUrl) {
            localStorage.setItem("proxServer", best);
            notify('info', 'Auto-switched', 'Switched to a faster proxy server.');
        }
    }
}

// =====================================================
// BROWSER STATE
// =====================================================
const BareMux = window.BareMux ?? { BareMuxConnection: class { setTransport() {} } };
let sharedScramjet = null;
let sharedConnection = null;
let sharedConnectionReady = false;
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

const getBasePath = () => {
    const basePath = location.pathname.replace(/[^/]*$/, '');
    return basePath.endsWith('/') ? basePath : basePath + '/';
};
const getStoredWisps = () => { try { return JSON.parse(localStorage.getItem('customWisps') ?? '[]'); } catch { return []; } };
const getActiveTab = () => tabs.find(t => t.id === activeTabId);
const notify = (type, title, message) => { if (typeof Notify !== 'undefined') Notify[type](title, message); };

// =====================================================
// INITIALIZATION (With Auto-Nuke for Corruption)
// =====================================================
let scramjetFailed = false;
async function getSharedScramjet() {
    if (sharedScramjet) return sharedScramjet;
    if (scramjetFailed) return null;

    // Scramjet needs a service worker controller — requires HTTPS or localhost
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
        console.error('Scramjet requires HTTPS with active service worker. Proxy disabled.');
        scramjetFailed = true;
        return null;
    }

    const { ScramjetController } = $scramjetLoadController();

    sharedScramjet = new ScramjetController({
        prefix: getBasePath() + "scramjet/",
        files: {
            wasm: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.wasm.wasm",
            all: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.all.js",
            sync: "https://cdn.jsdelivr.net/gh/Destroyed12121/Staticsj@main/JS/scramjet.sync.js"
        }
    });

    try {
        await sharedScramjet.init();
    } catch (err) {
        console.error('Scramjet init failed:', err.message, '— proxy disabled.');
        sharedScramjet = null;
        scramjetFailed = true;
        return null;
    }
    return sharedScramjet;
}

async function getSharedConnection() {
    if (sharedConnectionReady) return sharedConnection;
    const wispUrl = localStorage.getItem("proxServer") ?? DEFAULT_WISP;
    sharedConnection = new BareMux.BareMuxConnection(getBasePath() + "bareworker.js");
    
    await sharedConnection.setTransport(
        "https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@latest/dist/index.mjs",
        [{ wisp: wispUrl }]
    );
    sharedConnectionReady = true;
    return sharedConnection;
}

// Check if SW is alive before navigating
async function ensureServiceWorker() {
    if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
            console.warn("Service Worker asleep! Reloading window to wake it up...");
            window.location.reload();
        }
    }
}


async function initializeBrowser() {
    const root = document.getElementById("app");
    root.innerHTML = `
        <div class="browser-container">
            <div class="flex tabs" id="tabs-container"></div>
            <div class="flex nav">
                <button id="back-btn" title="Back"><i class="fa-solid fa-chevron-left"></i></button>
                <button id="fwd-btn" title="Forward"><i class="fa-solid fa-chevron-right"></i></button>
                <button id="reload-btn" title="Reload"><i class="fa-solid fa-rotate-right"></i></button>
                <div class="address-wrapper">
                    <input class="bar" id="address-bar" autocomplete="off" placeholder="Search or enter URL">
                    <button id="home-btn-nav" title="Home"><i class="fa-solid fa-house"></i></button>
                </div>
                <button id="devtools-btn" title="DevTools"><i class="fa-solid fa-code"></i></button>
                <button id="wisp-settings-btn" title="Proxy Settings"><i class="fa-solid fa-gear"></i></button>
            </div>
            <div class="loading-bar-container"><div class="loading-bar" id="loading-bar"></div></div>
            <div class="iframe-container" id="iframe-container">
                <div id="loading" class="message-container" style="display: none;">
                    <div class="message-content">
                        <div class="spinner"></div>
                        <h1 id="loading-title">Connecting</h1>
                        <p id="loading-url">Initializing proxy...</p>
                        <button id="skip-btn">Skip</button>
                    </div>
                </div>
                <div id="error" class="message-container" style="display: none;">
                    <div class="message-content">
                        <h1><i class="fa-solid fa-triangle-exclamation"></i> Connection Failed</h1>
                        <p id="error-message">The proxy failed to load this page. It may be blocked or the server is down.</p>
                        <button id="retry-error-btn" style="margin-top: 15px; padding: 8px 16px; cursor: pointer;">Try Again</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.getElementById('back-btn').onclick = () => getActiveTab()?.frame.back();
    document.getElementById('fwd-btn').onclick = () => getActiveTab()?.frame.forward();
    document.getElementById('reload-btn').onclick = () => getActiveTab()?.frame.reload();
    document.getElementById('home-btn-nav').onclick = () => window.location.href = '../index.html';
    document.getElementById('devtools-btn').onclick = toggleDevTools;
    document.getElementById('wisp-settings-btn').onclick = openSettings;
    
    document.getElementById('skip-btn').onclick = () => {
        const tab = getActiveTab();
        if (tab) { tab.loading = false; showIframeLoading(false); }
    };
    
    document.getElementById('retry-error-btn').onclick = () => {
        document.getElementById("error").style.display = "none";
        getActiveTab()?.frame.reload();
    };

    const addrBar = document.getElementById('address-bar');
    addrBar.onkeyup = (e) => e.key === 'Enter' && handleSubmit();
    addrBar.onfocus = () => addrBar.select();

    window.addEventListener('message', (e) => { if (e.data?.type === 'navigate') handleSubmit(e.data.url); });

    createTab(true);
    if (window.location.hash) {
        handleSubmit(decodeURIComponent(window.location.hash.substring(1)));
        history.replaceState(null, null, location.pathname);
    }
}

// =====================================================
// BULLETPROOF TAB MANAGEMENT
// =====================================================
function createTab(makeActive = true) {
    const frame = sharedScramjet.createFrame();
    const tab = {
        id: nextTabId++,
        title: "New Tab",
        url: "NT.html",
        frame,
        loading: false,
        favicon: null,
        timeoutTracker: null
    };

    frame.frame.src = "NT.html";

    frame.addEventListener("urlchange", (e) => {
        tab.url = e.url;
        tab.loading = true;
        document.getElementById("error").style.display = "none";

        if (tab.id === activeTabId) showIframeLoading(true, tab.url);

        try {
            const urlObj = new URL(e.url);
            tab.title = urlObj.hostname;
            tab.favicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
        } catch {
            tab.title = "Browsing";
            tab.favicon = null;
        }
        
        updateTabsUI();
        updateAddressBar();
        updateLoadingBar(tab, 10);

        // Kill Switch: If it takes longer than 15 seconds, assume proxy failure.
        clearTimeout(tab.timeoutTracker);
        tab.timeoutTracker = setTimeout(() => {
            if (tab.loading && tab.id === activeTabId && tab.url && !tab.url.includes('NT.html')) {
                showIframeLoading(false);
                document.getElementById("error").style.display = "flex";
                document.getElementById("error-message").textContent = "Connection Timed Out. The server took too long to respond.";
                tab.loading = false;
                updateLoadingBar(tab, 100);
            }
        }, 15000);
    });

    frame.frame.addEventListener('load', () => {
        tab.loading = false;
        clearTimeout(tab.timeoutTracker);

        if (tab.id === activeTabId) showIframeLoading(false);

        // --- BULLETPROOF BLANK PAGE DETECTOR ---
        let isBlank = false;
        try {
            const frameDoc = frame.frame.contentDocument || frame.frame.contentWindow.document;
            if (frameDoc && frameDoc.body && frameDoc.body.innerHTML.trim() === "" && tab.url && !tab.url.includes('NT.html')) {
                isBlank = true;
            }
        } catch (e) {
            // Cross-origin error means it actually loaded successfully!
            isBlank = false; 
        }

        if (isBlank && tab.id === activeTabId) {
            document.getElementById("error").style.display = "flex";
            document.getElementById("error-message").textContent = "The server returned an empty page. The site might be blocking proxies.";
        } else if (tab.id === activeTabId) {
            document.getElementById("error").style.display = "none";
        }
        // ---------------------------------------

        try { const title = frame.frame.contentWindow.document.title; if (title) tab.title = title; } catch {}

        if (frame.frame.contentWindow.location.href.includes('NT.html')) {
            tab.title = "New Tab"; tab.url = ""; tab.favicon = null;
        }

        updateTabsUI();
        updateAddressBar();
        updateLoadingBar(tab, 100);
    });

    tabs.push(tab);
    document.getElementById("iframe-container").appendChild(frame.frame);
    if (makeActive) switchTab(tab.id);
    return tab;
}

function showIframeLoading(show, url = '') {
    const loader = document.getElementById("loading");
    if (!loader) return;
    loader.style.display = show ? "flex" : "none";
    getActiveTab()?.frame.frame.classList.toggle('loading', show);
    if (show) {
        document.getElementById("loading-title").textContent = "Connecting";
        document.getElementById("loading-url").textContent = url || "Loading content...";
        document.getElementById("skip-btn").style.display = 'none';
        setTimeout(() => { if (document.getElementById("skip-btn")) document.getElementById("skip-btn").style.display = 'inline-block'; }, 3000);
    }
}

function switchTab(tabId) {
    activeTabId = tabId;
    const tab = getActiveTab();
    tabs.forEach(t => t.frame.frame.classList.toggle("hidden", t.id !== tabId));
    
    // Clear error UI when switching tabs
    document.getElementById("error").style.display = "none";

    if (tab) showIframeLoading(tab.loading, tab.url);
    updateTabsUI();
    updateAddressBar();
}

function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;
    const tab = tabs[idx];
    clearTimeout(tab.timeoutTracker);
    if (tab.frame?.frame) { tab.frame.frame.src = 'about:blank'; tab.frame.frame.remove(); }
    tabs.splice(idx, 1);
    if (activeTabId === tabId) {
        if (tabs.length > 0) switchTab(tabs[Math.max(0, idx - 1)].id);
        else window.location.reload();
    } else { updateTabsUI(); }
}

function updateTabsUI() {
    const container = document.getElementById("tabs-container");
    container.innerHTML = "";
    tabs.forEach(tab => {
        const el = document.createElement("div");
        el.className = `tab ${tab.id === activeTabId ? "active" : ""}`;
        const iconHtml = tab.loading ? `<div class="tab-spinner"></div>` : tab.favicon ? `<img src="${tab.favicon}" class="tab-favicon" onerror="this.style.display='none'">` : '';
        el.innerHTML = `${iconHtml}<span class="tab-title">${tab.title}</span><span class="tab-close">&times;</span>`;
        el.onclick = () => switchTab(tab.id);
        el.querySelector(".tab-close").onclick = (e) => { e.stopPropagation(); closeTab(tab.id); };
        container.appendChild(el);
    });
    const newBtn = document.createElement("button");
    newBtn.className = "new-tab"; newBtn.innerHTML = "<i class='fa-solid fa-plus'></i>";
    newBtn.onclick = () => createTab(true);
    container.appendChild(newBtn);
}

function updateAddressBar() {
    const bar = document.getElementById("address-bar");
    const tab = getActiveTab();
    if (bar && tab) bar.value = (tab.url && !tab.url.includes("NT.html")) ? tab.url : "";
}

async function handleSubmit(url) {
    await ensureServiceWorker(); // Check SW before sending request

    const tab = getActiveTab();
    let input = url ?? document.getElementById("address-bar").value.trim();
    if (!input) return;

    if (!input.startsWith('http')) {
        input = input.includes('.') && !input.includes(' ') 
            ? `https://${input}` : `https://search.brave.com/search?q=${encodeURIComponent(input)}`;
    }
    
    document.getElementById("error").style.display = "none";
    tab.loading = true;
    showIframeLoading(true, input);
    updateLoadingBar(tab, 10);
    tab.frame.go(input);
}

function updateLoadingBar(tab, percent) {
    if (tab.id !== activeTabId) return;
    const bar = document.getElementById("loading-bar");
    bar.style.width = percent + "%";
    bar.style.opacity = percent === 100 ? "0" : "1";
    if (percent === 100) setTimeout(() => { bar.style.width = "0%"; }, 200);
}

// =====================================================
// SETTINGS UI
// =====================================================
function openSettings() {
    const modal = document.getElementById('wisp-settings-modal');
    modal.classList.remove('hidden');
    document.getElementById('close-wisp-modal').onclick = () => modal.classList.add('hidden');
    document.getElementById('save-custom-wisp').onclick = saveCustomWisp;
    modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
    renderServerList();
}

function renderServerList() {
    const list = document.getElementById('server-list');
    list.innerHTML = '';
    const currentUrl = localStorage.getItem('proxServer') ?? DEFAULT_WISP;
    const allWisps = [...WISP_SERVERS, ...getStoredWisps()];

    allWisps.forEach((server, index) => {
        const isActive = server.url === currentUrl;
        const isCustom = index >= WISP_SERVERS.length;
        const item = document.createElement('div');
        item.className = `wisp-option ${isActive ? 'active' : ''}`;
        const deleteBtn = isCustom ? `<button class="delete-wisp-btn" onclick="event.stopPropagation(); deleteCustomWisp('${server.url}')"><i class="fa-solid fa-trash"></i></button>` : '';
        item.innerHTML = `
            <div class="wisp-option-header">
                <div class="wisp-option-name">${server.name} ${isActive ? '<i class="fa-solid fa-check" style="margin-left:8px; font-size: 0.7em; color: var(--accent);"></i>' : ''}</div>
                <div class="server-status"><span class="ping-text">...</span><div class="status-indicator"></div>${deleteBtn}</div>
            </div>
            <div class="wisp-option-url">${server.url}</div>
        `;
        item.onclick = () => setWisp(server.url);
        list.appendChild(item);
        checkServerHealth(server.url, item);
    });

    const isAutoswitch = localStorage.getItem('wispAutoswitch') !== 'false';
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'wisp-option';
    toggleContainer.style.cssText = 'margin-top: 10px; cursor: default;';
    toggleContainer.innerHTML = `<div class="wisp-option-header" style="justify-content: space-between;"><div class="wisp-option-name"><i class="fa-solid fa-rotate" style="margin-right:8px"></i> Auto-switch on failure</div><div class="toggle-switch ${isAutoswitch ? 'active' : ''}" id="autoswitch-toggle"><div class="toggle-knob"></div></div></div>`;
    toggleContainer.onclick = () => {
        const newState = !isAutoswitch;
        localStorage.setItem('wispAutoswitch', newState);
        document.getElementById('autoswitch-toggle').classList.toggle('active', newState);
        navigator.serviceWorker.controller?.postMessage({ type: 'config', autoswitch: newState });
    };
    list.appendChild(toggleContainer);
}

function saveCustomWisp() {
    const input = document.getElementById('custom-wisp-input');
    const url = input.value.trim();
    if (!url) return;
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) return notify('error', 'Invalid URL', 'URL must start with wss:// or ws://');
    
    const customWisps = getStoredWisps();
    if (customWisps.some(w => w.url === url) || WISP_SERVERS.some(w => w.url === url)) return notify('warning', 'Already Exists', 'Server already exists.');
    
    customWisps.push({ name: `Custom ${customWisps.length + 1}`, url });
    localStorage.setItem('customWisps', JSON.stringify(customWisps));
    setWisp(url);
    input.value = '';
}

window.deleteCustomWisp = function (urlToDelete) {
    if (!confirm("Remove this server?")) return;
    localStorage.setItem('customWisps', JSON.stringify(getStoredWisps().filter(w => w.url !== urlToDelete)));
    if (localStorage.getItem('proxServer') === urlToDelete) setWisp(DEFAULT_WISP); else renderServerList();
};

async function checkServerHealth(url, element) {
    const dot = element.querySelector('.status-indicator');
    const text = element.querySelector('.ping-text');
    const res = await pingWispServer(url, 2000);
    if (res.success) {
        dot.classList.add('status-success');
        text.textContent = `${res.latency}ms`;
    } else {
        dot.classList.add('status-error');
        text.textContent = "Offline";
    }
}

function setWisp(url) {
    localStorage.setItem('proxServer', url);
    navigator.serviceWorker.controller?.postMessage({ type: 'config', wispurl: url });
    setTimeout(() => location.reload(), 600);
}

function toggleDevTools() {
    const win = getActiveTab()?.frame.frame.contentWindow;
    if (!win) return;
    if (win.eruda) { win.eruda.show(); return; }
    const script = win.document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/eruda";
    script.onload = () => { win.eruda.init(); win.eruda.show(); };
    win.document.body.appendChild(script);
}

// =====================================================
// MASTER BOOT SEQUENCE
// =====================================================
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Nuke stale scramjet IndexedDB to prevent object store errors
        try {
            for (const db of ['scramjet-data', 'scrambase', 'ScramjetData', '__scramjet']) {
                indexedDB.deleteDatabase(db);
            }
        } catch (e) {}

        // Centralized robust service worker initialization
        await (async function waitForServiceWorker() {
            if (!('serviceWorker' in navigator)) {
                console.error("Service Workers are not supported in this browser.");
                return;
            }

            const basePath = getBasePath();
            const swUrl = basePath + 'sw.js';

            console.log("Registering service worker...");
            const registration = await navigator.serviceWorker.register(swUrl, { scope: basePath });
            console.log("Service worker registered:", registration);

            // Wait for the service worker to become active
            if (registration.installing) {
                console.log("Service worker installing...");
                await new Promise(resolve => {
                    registration.installing.addEventListener('statechange', function handler() {
                        if (this.state === 'activated') {
                            console.log("Service worker activated.");
                            registration.installing.removeEventListener('statechange', handler);
                            resolve();
                        }
                    });
                });
            } else if (registration.waiting) {
                console.log("Service worker waiting. Skipping straight to activate.");
                // If there's a waiting service worker, try to activate it directly
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                await new Promise(resolve => {
                    navigator.serviceWorker.addEventListener('controllerchange', function handler() {
                        console.log("Service worker controller changed (from waiting).");
                        navigator.serviceWorker.removeEventListener('controllerchange', handler);
                        resolve();
                    }, { once: true });
                });
            } else if (registration.active) {
                console.log("Service worker already active.");
            }

            // Ensure the page is controlled by the active service worker
            if (!navigator.serviceWorker.controller) {
                console.log("Waiting for service worker to control the page...");
                await new Promise(resolve => {
                    navigator.serviceWorker.addEventListener('controllerchange', function handler() {
                        console.log("Service worker is now controlling the page.");
                        navigator.serviceWorker.removeEventListener('controllerchange', handler);
                        resolve();
                    }, { once: true });
                    // If the page is already being controlled by an active SW, resolve immediately
                    if (navigator.serviceWorker.controller) {
                        resolve();
                    }
                });
            }

            // Send initial config to the active service worker
            const swConfig = {
                type: "config",
                wispurl: localStorage.getItem("proxServer") ?? DEFAULT_WISP,
                servers: getAllWispServers(),
                autoswitch: localStorage.getItem('wispAutoswitch') !== 'false'
            };
            navigator.serviceWorker.controller?.postMessage(swConfig);
            console.log("Service Worker ready and configured.");
        })();
        
        await getSharedScramjet();
        await getSharedConnection();
        await initializeBrowser();
    } catch (err) {
        console.error("Initialization error:", err);
    }
});
