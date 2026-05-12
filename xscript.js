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