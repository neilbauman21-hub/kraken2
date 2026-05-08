#!/bin/bash
set -e

# ============================================
# Kraken Network - Ubuntu Setup Script
# Usage: sudo bash setup.sh
# Hosts on port 8080 with systemd service
# ============================================

APP_NAME="kraken"
APP_DIR="/opt/kraken"
APP_PORT=8080
APP_USER="kraken"
SERVICE_FILE="/etc/systemd/system/${APP_NAME}.service"
NODE_VERSION="20"

echo "============================================"
echo "  Kraken Network - Server Setup"
echo "============================================"

# Must be root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Run with sudo"
    exit 1
fi

# 1. Install Node.js if missing
if ! command -v node &>/dev/null; then
    echo "[1/7] Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
else
    echo "[1/7] Node.js already installed: $(node -v)"
fi

# 2. Create app user
if ! id "$APP_USER" &>/dev/null; then
    echo "[2/7] Creating user '${APP_USER}'..."
    useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
else
    echo "[2/7] User '${APP_USER}' exists"
fi

# 3. Copy site files
echo "[3/7] Deploying to ${APP_DIR}..."
mkdir -p "$APP_DIR"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
rsync -a --exclude='setup.sh' --exclude='node_modules' --exclude='.git' "$SCRIPT_DIR/" "$APP_DIR/"

# 4. Create Node.js server
echo "[4/7] Creating backend server..."
cat > "${APP_DIR}/server.js" << 'SERVEREOF'
const http = require("http");
const fs = require("fs");
const path = require("path");
const { routeRequest } = require("wisp-server-node");

const PORT = parseInt(process.env.PORT || "8080", 10);
const STATIC_DIR = __dirname;

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".wasm": "application/wasm",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".map": "application/json",
};

function serveStatic(req, res) {
    let urlPath = new URL(req.url, `http://localhost:${PORT}`).pathname;

    if (urlPath === "/") urlPath = "/index.html";

    const filePath = path.join(STATIC_DIR, urlPath);
    const safePath = path.resolve(filePath);

    if (!safePath.startsWith(path.resolve(STATIC_DIR))) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            const htmlPath = safePath + ".html";
            fs.stat(htmlPath, (err2, stats2) => {
                if (err2 || !stats2.isFile()) {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not Found");
                    return;
                }
                streamFile(htmlPath, res);
            });
            return;
        }
        streamFile(safePath, res);
    });
}

function streamFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=3600",
    });

    fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
    serveStatic(req, res);
});

// Wisp server handles WebSocket upgrades at /wisp/
server.on("upgrade", (req, socket, head) => {
    if (req.url.startsWith("/wisp/")) {
        routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Kraken Network running on http://0.0.0.0:${PORT}`);
    console.log(`Wisp server at ws://0.0.0.0:${PORT}/wisp/`);
});
SERVEREOF

# 5. Install npm dependencies
echo "[5/7] Installing dependencies..."
cd "$APP_DIR"

cat > "${APP_DIR}/package.json" << 'PKGEOF'
{
    "name": "kraken-network",
    "version": "1.0.0",
    "private": true,
    "scripts": {
        "start": "node server.js"
    },
    "dependencies": {
        "wisp-server-node": "^1.1.0"
    }
}
PKGEOF

npm install --production 2>&1 | tail -3

# 6. Set permissions
echo "[6/7] Setting permissions..."
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# 7. Create systemd service
echo "[7/7] Creating systemd service..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Kraken Network Web Server
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=PORT=${APP_PORT}
Environment=NODE_ENV=production
ExecStart=$(which node) ${APP_DIR}/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=${APP_DIR}
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl daemon-reload
systemctl enable "$APP_NAME"
systemctl restart "$APP_NAME"

# Wait and check
sleep 2
if systemctl is-active --quiet "$APP_NAME"; then
    echo ""
    echo "============================================"
    echo "  Kraken Network is LIVE"
    echo "  http://$(hostname -I | awk '{print $1}'):${APP_PORT}"
    echo ""
    echo "  Service: sudo systemctl status ${APP_NAME}"
    echo "  Logs:    sudo journalctl -u ${APP_NAME} -f"
    echo "  Stop:    sudo systemctl stop ${APP_NAME}"
    echo "  Restart: sudo systemctl restart ${APP_NAME}"
    echo "============================================"
else
    echo ""
    echo "ERROR: Service failed to start."
    echo "Check: sudo journalctl -u ${APP_NAME} -e"
    exit 1
fi
