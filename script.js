document.addEventListener('DOMContentLoaded', () => {

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // ═══════════════ LOADING SCREEN ═══════════════
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        setTimeout(() => loader.classList.add('hidden'), 500);
    });
    setTimeout(() => loader.classList.add('hidden'), 2000);

    // ═══════════════ CURSOR GLOW ═══════════════
    const cursorGlow = document.getElementById('cursorGlow');
    let glowX = 0, glowY = 0, curX = 0, curY = 0;
    if (isTouch) {
        cursorGlow.style.display = 'none';
    } else {
        document.addEventListener('mousemove', (e) => { glowX = e.clientX; glowY = e.clientY; });
    }

    // ═══════════════ SCROLL PROGRESS BAR ═══════════════
    const scrollBar = document.getElementById('scrollProgress');

    // ═══════════════ TERMINAL SEQUENCE ═══════════════
    const termBody = document.getElementById('terminalBody');
    const termCursor = document.getElementById('terminalCursor');
    const commands = [
        { cmd: 'whoami', output: 'Vaibhav Singhal -- Software Engineer' },
        { cmd: 'cat skills.txt', output: 'Python, Java, TypeScript, OIDC, SCIM, Kafka, Kubernetes, PostgreSQL...' },
        { cmd: 'curl -s api.career/current', output: '{ "company": "Workday", "role": "SWE", "focus": "Identity Platform" }', isJson: true },
    ];
    let cmdIdx = 0;

    function typeCommand(cmd, cb) {
        let i = 0;
        const line = document.createElement('div');
        line.className = 'terminal-line';
        const prompt = document.createElement('span');
        prompt.className = 'terminal-prompt';
        prompt.textContent = '> ';
        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'terminal-cmd';
        line.appendChild(prompt);
        line.appendChild(cmdSpan);
        termBody.insertBefore(line, termCursor);
        function tick() {
            if (i < cmd.length) {
                cmdSpan.textContent += cmd[i++];
                setTimeout(tick, 40 + Math.random() * 30);
            } else {
                setTimeout(cb, 300);
            }
        }
        tick();
    }

    function showOutput(text, isJson, cb) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        const out = document.createElement('span');
        out.className = isJson ? 'terminal-json' : 'terminal-output';
        out.textContent = text;
        out.style.opacity = '0';
        line.appendChild(out);
        termBody.insertBefore(line, termCursor);
        requestAnimationFrame(() => {
            out.style.transition = 'opacity 0.4s';
            out.style.opacity = '1';
        });
        setTimeout(cb, 800);
    }

    function runNextCommand() {
        if (cmdIdx >= commands.length) {
            termCursor.style.display = 'inline-block';
            return;
        }
        const { cmd, output, isJson } = commands[cmdIdx++];
        typeCommand(cmd, () => {
            showOutput(output, isJson, runNextCommand);
        });
    }

    setTimeout(runNextCommand, 2400);

    // ═══════════════ REVEAL ON SCROLL ═══════════════
    const reveals = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    reveals.forEach(el => revealObs.observe(el));

    // ═══════════════ STAT COUNTERS ═══════════════
    let counted = false;
    function animCounters() {
        if (counted) return;
        counted = true;
        document.querySelectorAll('.stat-number').forEach(el => {
            const target = +el.dataset.target;
            const start = performance.now();
            (function step(now) {
                const p = Math.min((now - start) / 1500, 1);
                el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
                if (p < 1) requestAnimationFrame(step);
            })(start);
        });
    }
    const statsEl = document.querySelector('.hero-stats');
    if (statsEl) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) animCounters();
        }, { threshold: 0.5 }).observe(statsEl);
    }

    // ═══════════════ NAVBAR ═══════════════
    const navbar = document.getElementById('navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const sections = document.querySelectorAll('section[id]');

    navToggle.setAttribute('aria-expanded', 'false');
    function closeNav() { navToggle.classList.remove('active'); navLinks.classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
    document.addEventListener('click', (e) => { if (navLinks.classList.contains('open') && !e.target.closest('#navbar')) closeNav(); });
    window.addEventListener('scroll', () => { if (navLinks.classList.contains('open')) closeNav(); }, { passive: true });

    // ═══════════════ CONSOLIDATED RAF LOOP ═══════════════
    (function mainLoop() {
        // Cursor glow (desktop only)
        if (!isTouch) {
            curX += (glowX - curX) * 0.12;
            curY += (glowY - curY) * 0.12;
            cursorGlow.style.left = curX + 'px';
            cursorGlow.style.top = curY + 'px';
        }

        // Scroll progress bar
        const h = document.documentElement.scrollHeight - window.innerHeight;
        scrollBar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';

        // Navbar scroll state + active section
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        const sy = window.scrollY + 120;
        sections.forEach(s => {
            const link = document.querySelector(`.nav-links a[href="#${s.id}"]`);
            if (link) link.classList.toggle('active', sy >= s.offsetTop && sy < s.offsetTop + s.offsetHeight);
        });

        requestAnimationFrame(mainLoop);
    })();

    // ═══════════════ 3D TILT CARDS (desktop only) ═══════════════
    if (!isTouch) {
        document.querySelectorAll('.tilt-card').forEach(card => {
            const glow = card.querySelector('.tilt-glow');
            if (glow) glow.style.pointerEvents = 'none';
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const cx = r.width / 2;
                const cy = r.height / 2;
                const rotY = ((x - cx) / cx) * 8;
                const rotX = ((cy - y) / cy) * 8;
                card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
                if (glow) { glow.style.left = x + 'px'; glow.style.top = y + 'px'; }
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
                card.style.transition = 'transform 0.5s ease';
                setTimeout(() => card.style.transition = '', 500);
            });
        });
    }

    // ═══════════════ JOB DETAIL SPLIT PANEL ═══════════════
    const timeline = document.getElementById('timeline');
    const detailPanel = document.getElementById('jobDetailPanel');
    const detailHeader = document.getElementById('detailPanelHeader');
    const detailBody = document.getElementById('detailPanelBody');
    const detailClose = document.getElementById('detailPanelClose');

    function openDetail(header) {
        const item = header.closest('.timeline-item');
        const card = item.querySelector('.timeline-card');
        const details = card.querySelector('.job-details');

        detailHeader.innerHTML = header.innerHTML;
        detailBody.innerHTML = details ? details.innerHTML : '';
        detailPanel.scrollTop = 0;

        document.querySelectorAll('.timeline-item.active-job').forEach(el => el.classList.remove('active-job'));
        item.classList.add('active-job');

        if (!timeline.classList.contains('detail-open')) {
            timeline.classList.add('detail-open');
        }

        requestAnimationFrame(() => detailPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }

    function closeDetail() {
        const activeItem = document.querySelector('.timeline-item.active-job');
        timeline.classList.remove('detail-open');
        document.querySelectorAll('.timeline-item.active-job').forEach(el => el.classList.remove('active-job'));
        if (activeItem) {
            requestAnimationFrame(() => activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        }
    }

    document.querySelectorAll('.job-header').forEach(header => {
        header.addEventListener('click', () => openDetail(header));
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetail(header);
            }
        });
    });

    detailClose.addEventListener('click', closeDetail);
    const detailCloseBottom = detailPanel.querySelector('.detail-panel-close-bottom');
    if (detailCloseBottom) detailCloseBottom.addEventListener('click', closeDetail);
    document.addEventListener('click', (e) => {
        if (!timeline.classList.contains('detail-open')) return;
        if (e.target.closest('#jobDetailPanel') || e.target.closest('.timeline-item')) return;
        closeDetail();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && timeline.classList.contains('detail-open')) closeDetail();
    });

    let swipeStartX = 0, swipeStartY = 0;
    detailPanel.addEventListener('touchstart', (e) => {
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
    }, { passive: true });
    detailPanel.addEventListener('touchend', (e) => {
        if (!timeline.classList.contains('detail-open')) return;
        const dx = e.changedTouches[0].clientX - swipeStartX;
        const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY);
        if (dx > 100 && dy < 80) closeDetail();
    }, { passive: true });

    // ═══════════════ UDEMY COLLAPSIBLE TOGGLE ═══════════════
    const udemyBtn = document.getElementById('udemyToggle');
    if (udemyBtn) udemyBtn.addEventListener('click', () => toggleCollapsible(udemyBtn));

    // ═══════════════ MAGNETIC BUTTONS (desktop only) ═══════════════
    if (!isTouch) {
        document.querySelectorAll('.magnetic').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0,0)';
                btn.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
                setTimeout(() => btn.style.transition = '', 400);
            });
        });
    }

    // ═══════════════ FLIP CARDS: TAP-TO-TOGGLE (mobile/touch only) ═══════════════
    if (isTouch || window.innerWidth <= 768) {
        const flipHint = document.querySelector('.flip-hint');
        if (flipHint) flipHint.textContent = 'Tap to flip and see details.';
        let currentFlipped = null;
        document.querySelectorAll('.flip-card').forEach(card => {
            card.addEventListener('click', () => {
                if (currentFlipped && currentFlipped !== card) {
                    currentFlipped.classList.remove('flipped');
                }
                card.classList.toggle('flipped');
                currentFlipped = card.classList.contains('flipped') ? card : null;
            });
        });
    }

    // ═══════════════ TIMELINE DOT LIGHTING ═══════════════
    const dots = document.querySelectorAll('.timeline-dot');
    const dotObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('lit');
                dotObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.5 });
    dots.forEach(d => dotObs.observe(d));

    // ═══════════════ ORBIT: set --tx per ring for hover scale ═══════════════
    const ringRadii = { 'ring-1': 120, 'ring-2': 200, 'ring-3': 290, 'ring-4': 370 };
    document.querySelectorAll('.orbit-node').forEach(node => {
        const ring = node.parentElement;
        for (const [cls, r] of Object.entries(ringRadii)) {
            if (ring.classList.contains(cls)) { node.style.setProperty('--tx', r + 'px'); break; }
        }
    });

    // ═══════════════ ORBIT TOOLTIP (desktop only) ═══════════════
    if (!isTouch) {
        const tooltip = document.getElementById('orbitTooltip');
        document.querySelectorAll('.orbit-node').forEach(node => {
            node.addEventListener('mouseenter', () => {
                tooltip.textContent = node.dataset.cat + ': ' + node.textContent;
                tooltip.classList.add('visible');
            });
            node.addEventListener('mousemove', (e) => {
                tooltip.style.left = e.clientX + 14 + 'px';
                tooltip.style.top = e.clientY - 10 + 'px';
            });
            node.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
        });
    }

    // ═══════════════ KONAMI CODE EASTER EGG ═══════════════
    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiIdx = 0;
    const confettiCanvas = document.getElementById('confettiCanvas');
    const cctx = confettiCanvas.getContext('2d');

    document.addEventListener('keydown', (e) => {
        if (e.key === konami[konamiIdx]) {
            konamiIdx++;
            if (konamiIdx === konami.length) {
                konamiIdx = 0;
                fireConfetti();
            }
        } else {
            konamiIdx = 0;
        }
    });

    function fireConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        const particles = [];
        const colors = ['#6c63ff','#00d4aa','#ff6b9d','#febc2e','#28c840','#fff'];
        for (let i = 0; i < 200; i++) {
            particles.push({
                x: Math.random() * confettiCanvas.width,
                y: -20 - Math.random() * 200,
                w: 6 + Math.random() * 6,
                h: 4 + Math.random() * 4,
                vx: (Math.random() - 0.5) * 6,
                vy: 2 + Math.random() * 4,
                rot: Math.random() * 360,
                rotV: (Math.random() - 0.5) * 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
            });
        }
        let frame = 0;
        function draw() {
            cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let alive = false;
            particles.forEach(p => {
                if (p.life <= 0) return;
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.rot += p.rotV;
                if (frame > 60) p.life -= 0.015;
                cctx.save();
                cctx.translate(p.x, p.y);
                cctx.rotate(p.rot * Math.PI / 180);
                cctx.globalAlpha = Math.max(0, p.life);
                cctx.fillStyle = p.color;
                cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                cctx.restore();
            });
            frame++;
            if (alive) requestAnimationFrame(draw);
            else cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
        draw();
    }
});

// ═══════════════ TOGGLE COLLAPSIBLE ═══════════════
function toggleCollapsible(button) {
    const content = button.nextElementSibling;
    const arrow = button.querySelector('.toggle-arrow');
    content.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
}
