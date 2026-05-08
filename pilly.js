(function() {
    function initCursor() {
        if (!document.body) {
            requestAnimationFrame(initCursor);
            return;
        }

        
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                cursor: none !important;
            }
            #custom-v-cursor {
                position: fixed;
                top: 0;
                left: 0;
                width: 32px;
                height: 32px;
                z-index: 2147483647; 
                pointer-events: none;
                will-change: transform;
                filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
                opacity: 0; 
                transition: opacity 0.15s ease-out; /* Slightly faster fade out */
            }
        `;
        document.head.appendChild(style);

       
        const cursorDiv = document.createElement('div');
        cursorDiv.innerHTML = `
            <svg id="custom-v-cursor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L22 22 L12 18 L2 22 Z" fill="#3b82f6" />
            </svg>
        `;
        document.body.appendChild(cursorDiv.firstElementChild);
        const ship = document.getElementById('custom-v-cursor');

        
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let shipX = window.innerWidth / 2;
        let shipY = window.innerHeight / 2;
        let currentAngle = 0;
        let isVisible = false;

       
        
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isVisible) {
                ship.style.opacity = '1';
                isVisible = true;
            }
        });

        
        document.addEventListener('mouseout', (e) => {
            
            if (e.relatedTarget === null) {
                ship.style.opacity = '0';
                isVisible = false;
            }
        });


        window.addEventListener('blur', () => {
            ship.style.opacity = '0';
            isVisible = false;
        });

        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                ship.style.opacity = '0';
                isVisible = false;
            }
        });

        
        function animate() {
            const dx = mouseX - shipX;
            const dy = mouseY - shipY;

            shipX += dx * 0.15;
            shipY += dy * 0.15;

            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                let targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                currentAngle = targetAngle + 90;
            }

            ship.style.transform = `translate3d(${shipX - 16}px, ${shipY - 16}px, 0) rotate(${currentAngle}deg)`;

            requestAnimationFrame(animate);
        }
        
        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCursor);
    } else {
        initCursor();
    }
})();