document.addEventListener('DOMContentLoaded', () => {

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // ═══════════════ LOADING SCREEN ═══════════════
    const loader = document.getElementById('loader');
    const deferredInits = [];  // functions to run AFTER loader hides
    function hideLoader() {
        if (loader.classList.contains('hidden')) return;
        loader.classList.add('hidden');
        // initPage during fade-out (opacity fade is GPU-composited, won't stutter)
        requestAnimationFrame(initPage);
        // Run deferred inits after the fade-out completes (600ms transition)
        setTimeout(() => deferredInits.forEach(fn => fn()), 650);
    }
    // Don't hide until bar animation finishes (1.8s)
    window.addEventListener('load', () => setTimeout(hideLoader, 1900));
    setTimeout(hideLoader, 2500);

    // ALL page init deferred until loader starts fading.
    // Loader covers everything — nothing is visible, so no work needed until then.
    function initPage() {

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

    // ═══════════════ BACK TO TOP ═══════════════
    const backToTop = document.getElementById('backToTop');
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ═══════════════ CACHED NAV LINKS ═══════════════
    const sectionLinks = Array.from(sections).map(s => ({
        section: s,
        link: document.querySelector(`.nav-links a[href="#${s.id}"]`)
    })).filter(item => item.link);

    // ═══════════════ SCROLL HANDLER (throttled via RAF) ═══════════════
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(() => {
                const h = document.documentElement.scrollHeight - window.innerHeight;
                scrollBar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
                backToTop.classList.toggle('visible', window.scrollY > 400);
                navbar.classList.toggle('scrolled', window.scrollY > 50);
                const sy = window.scrollY + 120;
                sectionLinks.forEach(({ section, link }) => {
                    link.classList.toggle('active', sy >= section.offsetTop && sy < section.offsetTop + section.offsetHeight);
                });
                scrollTicking = false;
            });
        }
    }, { passive: true });

    // ═══════════════ CURSOR GLOW RAF (desktop only, deferred) ═══════════════
    if (!isTouch) {
        deferredInits.push(() => {
            (function glowLoop() {
                curX += (glowX - curX) * 0.12;
                curY += (glowY - curY) * 0.12;
                cursorGlow.style.left = curX + 'px';
                cursorGlow.style.top = curY + 'px';
                requestAnimationFrame(glowLoop);
            })();
        });
    }

    // (3D tilt cards removed — caused lag and visual glitches)

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

    // ═══════════════ EARLIER EXPERIENCE MOBILE TOGGLE ═══════════════
    const earlierDivider = document.getElementById('earlierDivider');
    if (earlierDivider) {
        const earlierGrid = document.querySelector('.earlier-grid');
        earlierDivider.addEventListener('click', () => {
            const icon = earlierDivider.querySelector('.earlier-toggle-icon');
            if (icon && getComputedStyle(icon).display !== 'none') {
                earlierDivider.classList.toggle('earlier-open');
                earlierGrid.classList.toggle('earlier-expanded');
            }
        });
    }

    // ═══════════════ EARLIER EXPERIENCE LIGHTBOX ═══════════════
    const earlierLightbox = document.getElementById('earlierLightbox');
    if (earlierLightbox) {
        const earlierLbHeader = document.getElementById('earlierLbHeader');
        const earlierLbBody = document.getElementById('earlierLbBody');

        function openEarlierLb(card) {
            const identity = card.querySelector('.earlier-card-identity');
            const meta = card.querySelector('.earlier-card-meta');
            const details = card.querySelector('.earlier-card-details');
            if (!details) return;

            earlierLbHeader.innerHTML = (identity ? identity.outerHTML : '') +
                (meta ? '<div class="earlier-card-meta">' + meta.innerHTML + '</div>' : '');
            earlierLbBody.innerHTML = details.innerHTML;

            earlierLightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
            earlierLightbox.querySelector('.earlier-lb-content').scrollTop = 0;
        }

        function closeEarlierLb() {
            earlierLightbox.classList.remove('open');
            document.body.style.overflow = '';
        }

        document.querySelectorAll('.earlier-card').forEach(card => {
            card.addEventListener('click', () => openEarlierLb(card));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEarlierLb(card);
                }
            });
        });

        earlierLightbox.querySelector('.earlier-lb-close').addEventListener('click', closeEarlierLb);
        earlierLightbox.querySelector('.earlier-lb-backdrop').addEventListener('click', closeEarlierLb);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && earlierLightbox.classList.contains('open')) closeEarlierLb();
        });
    }

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

    // ═══════════════ ANIMATED FOLDERS + LIGHTBOX ═══════════════
    const folderData = [
        {
            title: 'Axiom',
            subtitle: '4 services + Prism',
            row: 'main',
            projects: [
                {
                    title: 'Axiom — Knowledge Workspace',
                    date: '2025 – Present',
                    summary: 'Cloud-native knowledge workspace with Obsidian-like note management, AI-powered RAG search, and a production-grade processing pipeline. 134 PRs merged, 961 tests.',
                    bullets: [
                        'Architected 4 product services: REST API (FastAPI/SQLModel), React UI (Next.js 14), LLM orchestrator (Nexus), and Docker orchestration.',
                        'Built rich editor with BlockNote, version history with snapshot/restore, wiki-style [[links]] with backlinks, soft-delete with cascade recovery.',
                        'Implemented semantic search via pgvector embeddings + hybrid ranking (full-text + vector similarity), workspace-scoped conversational RAG chat.',
                        'Designed job queue using PostgreSQL FOR UPDATE SKIP LOCKED — heartbeat reclamation, retry with backoff, dead-letter queue. No external message broker.',
                        'End-to-end SSE streaming: Worker → Cortex → Synth → Gateway → Client with sequence numbering for reconnect replay.',
                        'Powered by Prism (shared AI platform) for multi-provider LLM execution, input normalization, and output rendering.'
                    ],
                    tags: ['Python','FastAPI','React','Next.js','TypeScript','PostgreSQL','pgvector','Docker'],
                    image: 'img/axiom.svg', fallback: 'img/axiom.svg',
                    links: [
                        { label: 'my-notes (v1)', url: 'https://github.com/vsinghal3737/my-notes' },
                        { label: 'Axiom-api', url: 'https://github.com/vsinghal3737/Axiom-api' },
                        { label: 'Axiom-ui', url: 'https://github.com/vsinghal3737/Axiom-ui' },
                        { label: 'Axiom-nexus', url: 'https://github.com/vsinghal3737/Axiom-nexus' },
                        { label: 'Orchestration', url: 'https://github.com/vsinghal3737/Axiom-orchestration' }
                    ]
                },
            ]
        },
        {
            title: 'ZitherAi',
            subtitle: '5 services + Prism',
            row: 'main',
            projects: [
                {
                    title: 'ZitherAi — AI Music Copilot',
                    date: '2026 – Present',
                    summary: 'AI-powered music recommendation engine and playlist copilot. Conversational playlist generation across Spotify, YouTube Music, and Apple Music — without hosting a music catalog.',
                    bullets: [
                        'Designed 5-service architecture: API (users/taste profiles), Nexus (8-stage recommendation pipeline), Bridge (stateless provider adapters), UI (chat-first React), and Docker orchestration.',
                        'Built 8-stage recommendation pipeline: Input → Intent Extraction → Candidate Retrieval → Enrichment → Ranking → Sequencing → Metadata → SSE Output.',
                        'Provider-agnostic Bridge service with circuit breakers per provider (error rate, p95 latency, rate limit headroom, cost) and automatic failover.',
                        'Fernet encryption (AES-128-CBC + HMAC) for OAuth tokens at rest with MultiFernet key rotation support.',
                        'Optimistic concurrency with version columns + atomic CAS on all mutable entities. Cursor-based pagination (not offset) for stable reads.',
                        'Powered by Prism (shared AI platform) for LLM execution, mood/intent inference, and output rendering.'
                    ],
                    tags: ['Python','FastAPI','React','Next.js','TypeScript','PostgreSQL','Spotify API','Docker'],
                    image: 'img/zither.svg', fallback: 'img/zither.svg',
                    links: []
                },
            ]
        },
        {
            title: 'Data Engineering',
            row: 'category',
            projects: [
                { title: 'RosterData — Ice Hockey v2', date: 'Jan 2020 – Apr 2020', summary: 'Expanded RosterData from NHL-only to 4-league coverage (NHL, SHL, Liiga, KHL) with cross-league player comparison.', bullets: ['Built league-specific Scrapy pipelines for SHL, Liiga, and KHL — each with unique HTML structures and pagination patterns.','Designed a normalized JSON data model for cross-league consistency (player identity, season stats, team associations).','Stored normalized data in PostgreSQL on AWS RDS with query-optimized indexing for player lookup and league standings.','Built REST APIs for player search, team rosters, and cross-league career timelines.'], tags: ['Python','Scrapy','PostgreSQL','AWS'], image: 'img/ice-hockey.webp', fallback: 'img/ice-hockey.jpg' },
                { title: 'Hadoop Cluster & MapReduce', date: 'Mar 2017 – Jun 2017', summary: '8-node Hadoop cluster processing 300M+ YouTube video logs with MapReduce and cross-version benchmarking.', bullets: ['Configured 1 NameNode + 7 DataNodes with HDFS replication and YARN resource management.','Designed MapReduce jobs (Hadoop Streaming, Python): most-viewed by category, upload trends, viral video detection.','Benchmarked identical jobs across Hadoop versions — measured job time, CPU/memory, shuffle overhead, and speculative execution.','Documented quantitative speedups in scheduling and data shuffle across framework versions.'], tags: ['Hadoop','MapReduce','Python','HDFS'], image: 'img/hadoop.webp', fallback: 'img/hadoop.png' },
            ]
        },
        {
            title: 'Machine Learning',
            row: 'category',
            projects: [
                { title: 'LSA Classification & Prediction', date: 'Mar 2020 – Apr 2020', summary: 'End-to-end ML pipeline for financial document classification — 98% accuracy, deployed as a REST API on GCP.', bullets: ['Preprocessed financial documents: tokenization, stop-word removal, TF-IDF vectorization into numerical feature vectors.','Applied LSA (SVD on TF-IDF matrix) for dimensionality reduction while preserving discriminative dimensions.','Evaluated Naive Bayes, SVM, Random Forest, and Logistic Regression with grid search and cross-validation.','Built Flask REST APIs for real-time inference and deployed containerized on GCP Compute Engine.'], tags: ['Python','scikit-learn','Flask','GCP'], image: 'img/tfidf.webp', fallback: 'img/tfidf.png' },
                { title: 'Diabetes Classifier & Clustering', date: 'Aug 2019 – Nov 2019', summary: 'Rigorous ML classification on clinical data with K-fold validation — 85% accuracy, plus unsupervised meal clustering.', bullets: ['Preprocessed Pima Indians Diabetes Dataset: median imputation for missing values, feature normalization, class imbalance analysis.','Evaluated Decision Tree, SVM, and KNN classifiers using K-fold cross-validation for generalizability.','Applied K-Means and DBSCAN clustering on meal/glucose data to identify dietary patterns correlated with glucose response.','Achieved 85% accuracy / 83% confidence validated across folds — not an artifact of a favorable split.'], tags: ['Python','Pandas','NumPy','scikit-learn'], image: 'img/sklearn.webp', fallback: 'img/sklearn.png' },
            ]
        },
        {
            title: 'Software Engineering',
            row: 'category',
            projects: [
                { title: 'Visual Learning Portal', date: 'Aug 2019 – Nov 2019', summary: 'Interactive math portal with drag-and-drop, built by a team of 5 using Agile/Scrum and formal design patterns.', bullets: ['Applied Facade (simplified complex subsystems), Factory (dynamic content creation), and Iterator (collection traversal) patterns.','Built Flask REST APIs with SQLAlchemy ORM; drag-and-drop frontend for interactive math exploration.','Ran 2-week sprints with backlog grooming, standups, and retrospectives across a 5-person team.'], tags: ['Python','Flask','SQLAlchemy','Agile'], image: 'img/math.webp', fallback: 'img/math.jpg' },
                { title: '!Xobile Programming Language', date: 'Jan 2019 – May 2019', summary: 'Custom OOP language with full compilation pipeline — grammar spec, tokenizer, parser, and semantic analyzer.', bullets: ['Designed formal grammar: class declarations, inheritance, control flow, expressions, and OOP constructs (this, constructors, method dispatch).','Built regex-based tokenizer in Python (keywords, identifiers, operators, string literals with escape chars).','Implemented parser and semantic analyzer in Prolog: type checking, variable scoping, inheritance cycle detection, and method resolution.','End-to-end pipeline: valid programs produce semantically validated parse trees; invalid programs yield meaningful error messages.'], tags: ['Python','Prolog','Compiler Design'], image: 'img/lang.webp', fallback: 'img/lang.jpg' },
            ]
        }
    ];

    // Prism platform data (rendered as connecting strip, not a folder)
    const prismData = {
        title: 'Prism',
        subtitle: 'Shared AI Platform',
        stats: '48 PRs · 366 Tests',
        services: [
            { name: 'Pulse', role: 'Input', desc: 'Text, audio, PDF, images → StructuredContext' },
            { name: 'Cortex', role: 'LLM Gateway', desc: 'OpenAI, Anthropic, Gemini + circuit breakers' },
            { name: 'Synth', role: 'Output', desc: 'SSE streaming, TTS, PDF/DOCX assembly' }
        ],
        project: {
            title: 'Prism — Shared AI Platform',
            date: '2025 – Present',
            summary: 'Reusable, stateless AI infrastructure layer powering multiple projects. Three services handle input normalization, multi-provider LLM execution, and output rendering — any project connects via HTTP + bearer token.',
            bullets: [
                'Pulse normalizes any input modality (text, audio via ffmpeg+Whisper, images via vision captioning, PDF/DOCX/XLSX) into deterministic StructuredContext JSON.',
                'Cortex provides a universal AI gateway: 12 completion models across 3 providers with per-provider circuit breakers, fallback chains, and Decimal cost tracking.',
                'Synth renders output as SSE-streamed text, sentence-boundary-buffered TTS audio, or assembled files (PDF, DOCX, HTML, CSV) with HTML sanitization.',
                'All services stateless by design — no database, horizontal scaling trivial. Bearer token + HMAC-SHA256 auth. Centralized cost metadata passthrough.',
                'Strategy pattern for provider adapters — adding a new LLM provider is one file + one catalog entry, zero core changes.',
                'Currently powers Axiom (knowledge workspace) and ZitherAi (music recommendation).'
            ],
            tags: ['Python','FastAPI','OpenAI','Anthropic','Gemini','Docker','SSE','TTS'],
            image: 'img/prism.svg', fallback: 'img/prism.svg',
            links: [
                { label: 'Pulse', url: 'https://github.com/vsinghal3737/pulse', platform: true },
                { label: 'Cortex', url: 'https://github.com/vsinghal3737/cortex', platform: true },
                { label: 'Synth', url: 'https://github.com/vsinghal3737/synth', platform: true }
            ]
        }
    };

    // Render folders in rows: main projects, prism strip, category folders
    const folderGrid = document.getElementById('folderGrid');
    if (folderGrid) {
        // Create row wrappers (pure layout, no reveal/glass — avoids visual artifacts)
        const mainRow = document.createElement('div');
        mainRow.className = 'folder-row folder-row-main';
        const catRow = document.createElement('div');
        catRow.className = 'folder-row folder-row-categories';

        folderData.forEach((folder, fi) => {
            const count = folder.projects.length;
            const el = document.createElement('div');
            el.className = 'folder reveal';
            el.style.setProperty('--delay', `${fi * 0.1}s`);
            el.innerHTML = `
                <div class="folder-visual">
                    <div class="folder-back"></div>
                    <div class="folder-tab"></div>
                    <div class="folder-cards">
                        ${folder.projects.map((p, pi) => `
                            <div class="folder-card" data-fan="${count}-${pi}" data-fi="${fi}" data-pi="${pi}">
                                <img src="${p.fallback}" alt="${p.title}" loading="lazy"/>
                                <div class="folder-card-overlay"></div>
                                <span class="folder-card-label">${p.title}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="folder-front"></div>
                </div>
                <h3 class="folder-title">${folder.title}</h3>
                <p class="folder-count">${folder.subtitle || (count + ' ' + (count === 1 ? 'project' : 'projects'))}</p>
                <span class="folder-hint">Hover to explore</span>
            `;
            if (folder.row === 'main') {
                mainRow.appendChild(el);
            } else {
                catRow.appendChild(el);
            }
            revealObs.observe(el);
        });

        folderGrid.appendChild(mainRow);

        // Render Prism platform strip between rows
        const prismStrip = document.createElement('div');
        prismStrip.className = 'prism-strip';
        const prismFi = folderData.length;
        prismStrip.innerHTML = `
            <div class="prism-strip-inner">
                <div class="prism-label">
                    <span class="prism-icon">⚡</span>
                    <span class="prism-title">PRISM</span>
                    <span class="prism-subtitle">Shared AI Platform</span>
                </div>
                <div class="prism-services">
                    ${prismData.services.map((s, i) => `
                        <div class="prism-service">
                            <span class="prism-service-role">${s.role}</span>
                            <span class="prism-service-name">${s.name}</span>
                            <span class="prism-service-desc">${s.desc}</span>
                        </div>
                        ${i < prismData.services.length - 1 ? '<span class="prism-arrow">→</span>' : ''}
                    `).join('')}
                </div>
                <div class="prism-meta">
                    <span class="prism-stats">${prismData.stats}</span>
                    <span class="prism-powers">Powers <strong>Axiom</strong> &amp; <strong>ZitherAi</strong></span>
                </div>
            </div>
        `;
        folderGrid.appendChild(prismStrip);

        // Prism strip click opens lightbox
        prismStrip.querySelector('.prism-strip-inner').addEventListener('click', () => {
            openLightbox(prismFi, 0);
        });

        folderGrid.appendChild(catRow);

        // On touch devices: tap folder to toggle hover state
        if (isTouch) {
            let openFolder = null;
            document.querySelectorAll('.folder').forEach(f => {
                f.addEventListener('click', (e) => {
                    if (e.target.closest('.folder-card')) return; // let card clicks through
                    if (openFolder && openFolder !== f) openFolder.classList.remove('folder-open');
                    f.classList.toggle('folder-open');
                    openFolder = f.classList.contains('folder-open') ? f : null;
                });
            });
            // CSS: .folder-open triggers same visual as :hover
            const touchStyle = document.createElement('style');
            touchStyle.textContent = `
                .folder-open .folder-back { transform: translate(-50%,-50%) rotateX(-15deg) !important; }
                .folder-open .folder-tab { transform: rotateX(-25deg) translateY(-2px) !important; }
                .folder-open .folder-front { transform: translateX(-50%) rotateX(25deg) translateY(8px) !important; }
                .folder-open .folder-card[data-fan="1-0"] { transform: translateY(-85px) translateX(0) rotate(0deg) scale(1.05) !important; opacity:1 !important; }
                .folder-open .folder-card[data-fan="2-0"] { transform: translateY(-80px) translateX(-32px) rotate(-8deg) scale(1) !important; opacity:1 !important; }
                .folder-open .folder-card[data-fan="2-1"] { transform: translateY(-80px) translateX(32px) rotate(8deg) scale(1) !important; opacity:1 !important; transition-delay:80ms !important; }
                .folder-open .folder-card[data-fan="3-0"] { transform: translateY(-80px) translateX(-50px) rotate(-12deg) scale(1) !important; opacity:1 !important; }
                .folder-open .folder-card[data-fan="3-1"] { transform: translateY(-90px) translateX(0) rotate(0deg) scale(1) !important; opacity:1 !important; transition-delay:80ms !important; }
                .folder-open .folder-card[data-fan="3-2"] { transform: translateY(-80px) translateX(50px) rotate(12deg) scale(1) !important; opacity:1 !important; transition-delay:160ms !important; }
                .folder-open .folder-title { transform: translateY(4px) !important; }
                .folder-open .folder-hint { opacity:0 !important; transform: translateY(10px) !important; }
            `;
            document.head.appendChild(touchStyle);
        }
    }

    // Lightbox
    const lb = document.getElementById('projectLightbox');
    const lbImage = document.getElementById('lbImage');
    const lbTitle = document.getElementById('lbTitle');
    const lbDate = document.getElementById('lbDate');
    const lbSummary = document.getElementById('lbSummary');
    const lbTags = document.getElementById('lbTags');
    const lbDots = document.getElementById('lbDots');
    const lbPrev = lb ? lb.querySelector('.lb-prev') : null;
    const lbNext = lb ? lb.querySelector('.lb-next') : null;
    const lbClose = lb ? lb.querySelector('.lb-close') : null;

    let lbFolderIdx = 0;
    let lbProjectIdx = 0;

    function openLightbox(fi, pi) {
        lbFolderIdx = fi;
        lbProjectIdx = pi;
        // Wide layout for main projects (Axiom, ZitherAi, Prism)
        const isPrism = fi >= folderData.length;
        const isMain = isPrism || (folderData[fi] && folderData[fi].row === 'main');
        lb.classList.toggle('lb-wide', isMain);
        updateLightbox();
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lb.classList.remove('open');
        lb.classList.remove('lb-wide');
        document.body.style.overflow = '';
    }

    function updateLightbox() {
        // Handle virtual Prism folder (index beyond folderData)
        const isPrism = lbFolderIdx >= folderData.length;
        const folder = isPrism
            ? { title: prismData.title, projects: [prismData.project] }
            : folderData[lbFolderIdx];
        if (!folder) return;
        const p = folder.projects[lbProjectIdx];
        if (!p) return;
        lbImage.src = p.fallback;
        lbImage.style.display = '';
        lbImage.alt = p.title;
        lbTitle.textContent = p.title;
        lbDate.textContent = p.date;
        lbSummary.textContent = p.summary;
        const lbBullets = document.getElementById('lbBullets');
        if (lbBullets) {
            lbBullets.innerHTML = p.bullets && p.bullets.length
                ? '<ul>' + p.bullets.map(b => `<li>${b}</li>`).join('') + '</ul>'
                : '';
        }
        lbTags.innerHTML = p.tags.map(t => `<span>${t}</span>`).join('');
        // Render GitHub links if present
        let lbLinks = lb.querySelector('.lb-links');
        if (!lbLinks) {
            lbLinks = document.createElement('div');
            lbLinks.className = 'lb-links';
            lbTags.parentElement.insertBefore(lbLinks, lbTags.nextSibling);
        }
        if (p.links && p.links.length) {
            lbLinks.style.display = '';
            lbLinks.innerHTML = p.links.map(l =>
                `<a href="${l.url}" target="_blank" rel="noopener" class="lb-link${l.platform ? ' lb-link-platform' : ''}">`
                + `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>`
                + `<span>${l.label}</span></a>`
            ).join('');
        } else {
            lbLinks.style.display = 'none';
        }
        lbDots.innerHTML = folder.projects.map((_, i) =>
            `<button class="lb-dot${i === lbProjectIdx ? ' active' : ''}" data-i="${i}"></button>`
        ).join('');
        lbPrev.disabled = lbProjectIdx <= 0;
        lbNext.disabled = lbProjectIdx >= folder.projects.length - 1;
    }

    if (lb) {
        // Card click → open lightbox
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.folder-card');
            if (!card) return;
            e.stopPropagation();
            openLightbox(+card.dataset.fi, +card.dataset.pi);
        });

        lbClose.addEventListener('click', closeLightbox);
        lb.querySelector('.lb-backdrop').addEventListener('click', closeLightbox);
        lbPrev.addEventListener('click', (e) => { e.stopPropagation(); if (lbProjectIdx > 0) { lbProjectIdx--; updateLightbox(); } });
        lbNext.addEventListener('click', (e) => { e.stopPropagation(); if (lbProjectIdx < folderData[lbFolderIdx].projects.length - 1) { lbProjectIdx++; updateLightbox(); } });
        lbDots.addEventListener('click', (e) => {
            const dot = e.target.closest('.lb-dot');
            if (dot) { lbProjectIdx = +dot.dataset.i; updateLightbox(); }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight' && lbProjectIdx < folderData[lbFolderIdx].projects.length - 1) { lbProjectIdx++; updateLightbox(); }
            if (e.key === 'ArrowLeft' && lbProjectIdx > 0) { lbProjectIdx--; updateLightbox(); }
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

    // ═══════════════ ORBITING SKILLS ANIMATION ═══════════════
    const orbitContainer = document.querySelector('.orbit-container');
    if (orbitContainer) {
        const ringSpeeds = [0.4, -0.25, 0.15, -0.1]; // CW, CCW, CW, CCW

        // Collect nodes per ring with their base angle; radius from CSS
        function buildRings() {
            return ['ring-1', 'ring-2', 'ring-3', 'ring-4'].map((cls, idx) => {
                const ringEl = orbitContainer.querySelector(`.${cls}`);
                if (!ringEl || ringEl.offsetParent === null) return null; // hidden (e.g. ring-4 at 900px)
                const nodes = Array.from(ringEl.querySelectorAll('.orbit-node'));
                const radiusX = ringEl.offsetWidth / 2;
                const radiusY = ringEl.offsetHeight / 2; // elliptical
                return {
                    cls, radiusX, radiusY, speed: ringSpeeds[idx], el: ringEl,
                    nodes: nodes.map((node, i) => ({
                        el: node,
                        baseAngle: (2 * Math.PI / nodes.length) * i
                    }))
                };
            }).filter(Boolean);
        }
        let rings = buildRings();

        // Rebuild on resize so radii stay in sync with CSS breakpoints
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { rings = buildRings(); }, 150);
        });

        let orbitTime = 0;
        let orbitPaused = false;
        let orbitRAF = null;
        let lastOrbitTime = performance.now();

        function updateOrbit(now) {
            if (!orbitPaused) {
                const dt = (now - lastOrbitTime) / 1000;
                orbitTime += dt;
            }
            lastOrbitTime = now;

            rings.forEach(ring => {
                const angleOffset = orbitTime * ring.speed;
                ring.nodes.forEach(({ el, baseAngle }) => {
                    const angle = baseAngle + angleOffset;
                    const x = Math.cos(angle) * ring.radiusX;
                    const y = Math.sin(angle) * ring.radiusY;
                    el.style.left = (ring.radiusX + x) + 'px';
                    el.style.top = (ring.radiusY + y) + 'px';
                    el.style.transform = 'translate(-50%, -50%)';
                });
            });

            orbitRAF = requestAnimationFrame(updateOrbit);
        }

        // Start animation after loader finishes (avoid competing for frames)
        // Skip on reduced-motion or if orbit container is hidden (mobile)
        const prefersStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersStill && orbitContainer.offsetParent !== null) {
            deferredInits.push(() => { orbitRAF = requestAnimationFrame(updateOrbit); });
        }

        // Pause on hover
        orbitContainer.addEventListener('mouseenter', () => {
            orbitPaused = true;
            orbitContainer.classList.add('paused');
        });
        orbitContainer.addEventListener('mouseleave', () => {
            orbitPaused = false;
            orbitContainer.classList.remove('paused');
            lastOrbitTime = performance.now(); // avoid dt spike
        });

        // Tooltip (desktop only)
        if (!isTouch) {
            const tooltip = document.getElementById('orbitTooltip');
            document.querySelectorAll('.orbit-node').forEach(node => {
                node.addEventListener('mouseenter', () => {
                    tooltip.textContent = node.dataset.cat + ': ' + node.textContent.trim();
                    tooltip.classList.add('visible');
                });
                node.addEventListener('mousemove', (e) => {
                    tooltip.style.left = e.clientX + 14 + 'px';
                    tooltip.style.top = e.clientY - 10 + 'px';
                });
                node.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
            });
        }

        // Pause when out of viewport (save CPU)
        const orbitVisObs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                if (!orbitRAF) orbitRAF = requestAnimationFrame(updateOrbit);
            } else {
                if (orbitRAF) { cancelAnimationFrame(orbitRAF); orbitRAF = null; }
            }
        }, { threshold: 0.1 });
        orbitVisObs.observe(orbitContainer);
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

    // ═══════════════ DARK/LIGHT THEME TOGGLE ═══════════════
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = savedTheme;

    themeToggle.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('theme', next);
    });

    // ═══════════════ VISITOR-AWARE GREETING ═══════════════
    const greetingEl = document.getElementById('heroGreeting');
    if (greetingEl) {
        const hour = new Date().getHours();
        let greeting;
        if (hour >= 5 && hour < 12) greeting = 'Good morning \u2014 welcome to my corner of the internet.';
        else if (hour >= 12 && hour < 17) greeting = 'Good afternoon \u2014 glad you stopped by.';
        else if (hour >= 17 && hour < 21) greeting = 'Good evening \u2014 hope your day went well.';
        else greeting = 'Late night coding? You\u2019re in good company.';
        greetingEl.textContent = greeting;
    }

    // ═══════════════ COMMAND PALETTE (Ctrl+K / Cmd+K) ═══════════════
    const cmdOverlay = document.getElementById('cmdOverlay');
    const cmdPalette = document.getElementById('cmdPalette');
    const cmdInput = document.getElementById('cmdInput');
    const cmdResults = document.getElementById('cmdResults');
    let cmdActiveIdx = -1;
    let cmdFiltered = [];

    // Build search index
    const cmdItems = [
        // Sections
        { title: 'Work Experience', hint: 'Workday, LivePerson, Black Knight', icon: '💼', action: '#experience' },
        { title: 'Technical Skills', hint: 'Python, Java, Kafka, Kubernetes...', icon: '⚡', action: '#skills' },
        { title: 'Projects', hint: 'Axiom, RosterData, LSA, Hadoop...', icon: '🚀', action: '#projects' },
        { title: 'Education', hint: 'ASU, GGSIPU, GNDIT', icon: '🎓', action: '#education' },
        { title: 'Certifications', hint: 'CCA-175, PCAP, OCA, GCP', icon: '📜', action: '#certifications' },
        { title: 'Contact', hint: 'LinkedIn, GitHub, Email', icon: '📬', action: '#contact' },
        // Jobs
        { title: 'Workday (Evisort)', hint: 'Senior Software Engineer — Identity Platform', icon: '🏢', action: '#experience', sub: 0 },
        { title: 'LivePerson', hint: 'Software Engineer — Voice AI', icon: '🏢', action: '#experience', sub: 1 },
        { title: 'Black Knight', hint: 'Software Engineer — AWS Serverless', icon: '🏢', action: '#experience', sub: 2 },
        // Skills
        { title: 'Python', hint: 'Languages — Expert', icon: '🔧', action: '#skills' },
        { title: 'Java', hint: 'Languages — Expert', icon: '🔧', action: '#skills' },
        { title: 'TypeScript', hint: 'Languages — Advanced', icon: '🔧', action: '#skills' },
        { title: 'FastAPI', hint: 'Backend — Expert', icon: '🔧', action: '#skills' },
        { title: 'Kafka', hint: 'Backend — Expert', icon: '🔧', action: '#skills' },
        { title: 'OIDC', hint: 'Backend — Expert', icon: '🔧', action: '#skills' },
        { title: 'SCIM', hint: 'Backend — Expert', icon: '🔧', action: '#skills' },
        { title: 'PostgreSQL', hint: 'Data & Cloud — Expert', icon: '🔧', action: '#skills' },
        { title: 'Kubernetes', hint: 'Data & Cloud — Expert', icon: '🔧', action: '#skills' },
        { title: 'Docker', hint: 'Backend — Advanced', icon: '🔧', action: '#skills' },
        { title: 'Redis', hint: 'Data & Cloud — Expert', icon: '🔧', action: '#skills' },
        // Projects
        { title: 'RosterData — Ice Hockey', hint: 'Python, Scrapy, PostgreSQL, AWS', icon: '📂', action: '#projects' },
        { title: 'LSA Classification', hint: 'Python, scikit-learn, Flask, GCP', icon: '📂', action: '#projects' },
        { title: 'Diabetes Classifier', hint: 'Python, Pandas, scikit-learn', icon: '📂', action: '#projects' },
        { title: '!Xobile Programming Language', hint: 'Python, Prolog, Compiler Design', icon: '📂', action: '#projects' },
        { title: 'Hadoop Cluster', hint: 'Hadoop, MapReduce, Python, HDFS', icon: '📂', action: '#projects' },
        // Links
        { title: 'Email', hint: 'vsvsinghal3737@gmail.com', icon: '✉️', action: 'mailto:vsvsinghal3737@gmail.com' },
        { title: 'LinkedIn', hint: 'linkedin.com/in/-singhal-vaibhav-/', icon: '🔗', action: 'https://linkedin.com/in/-singhal-vaibhav-/' },
        { title: 'GitHub', hint: 'github.com/vsinghal3737', icon: '🔗', action: 'https://github.com/vsinghal3737' },
        { title: 'Resume', hint: 'Google Drive', icon: '📄', action: 'https://drive.google.com/drive/folders/14P5q0XW5jiU3eIH2igkKzJ6LDOcdwyKn?usp=sharing' },
        // Theme
        { title: 'Toggle Theme', hint: 'Switch between dark and light mode', icon: '🎨', action: 'theme' },
        { title: 'Back to Top', hint: 'Scroll to the top of the page', icon: '⬆️', action: '#hero' },
    ];

    function openCmdPalette() {
        cmdOverlay.classList.add('active');
        cmdPalette.classList.add('active');
        cmdInput.value = '';
        cmdActiveIdx = -1;
        renderCmdResults('');
        setTimeout(() => cmdInput.focus(), 50);
    }

    function closeCmdPalette() {
        cmdOverlay.classList.remove('active');
        cmdPalette.classList.remove('active');
        cmdInput.blur();
    }

    function renderCmdResults(query) {
        const q = query.toLowerCase().trim();
        cmdFiltered = q
            ? cmdItems.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.hint.toLowerCase().includes(q))
            : cmdItems.slice(0, 8);

        if (cmdFiltered.length === 0) {
            cmdResults.innerHTML = '<div class="cmd-result-empty">No results found</div>';
            return;
        }

        cmdResults.innerHTML = cmdFiltered.map((item, i) =>
            `<div class="cmd-result-item${i === cmdActiveIdx ? ' active' : ''}" data-idx="${i}">
                <span class="cmd-result-icon">${item.icon}</span>
                <div class="cmd-result-text">
                    <div class="cmd-result-title">${item.title}</div>
                    <div class="cmd-result-hint">${item.hint}</div>
                </div>
            </div>`
        ).join('');

        cmdResults.querySelectorAll('.cmd-result-item').forEach(el => {
            el.addEventListener('click', () => {
                executeCmdItem(cmdFiltered[+el.dataset.idx]);
            });
        });
    }

    function executeCmdItem(item) {
        closeCmdPalette();
        if (item.action === 'theme') {
            themeToggle.click();
        } else if (item.action.startsWith('#')) {
            const target = document.querySelector(item.action);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else if (item.action.startsWith('http') || item.action.startsWith('mailto:')) {
            window.open(item.action, '_blank');
        }
    }

    cmdInput.addEventListener('input', () => {
        cmdActiveIdx = -1;
        renderCmdResults(cmdInput.value);
    });

    cmdInput.addEventListener('keydown', (e) => {
        const items = cmdResults.querySelectorAll('.cmd-result-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            cmdActiveIdx = Math.min(cmdActiveIdx + 1, items.length - 1);
            items.forEach((el, i) => el.classList.toggle('active', i === cmdActiveIdx));
            items[cmdActiveIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            cmdActiveIdx = Math.max(cmdActiveIdx - 1, 0);
            items.forEach((el, i) => el.classList.toggle('active', i === cmdActiveIdx));
            items[cmdActiveIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' && cmdActiveIdx >= 0) {
            e.preventDefault();
            if (cmdFiltered[cmdActiveIdx]) executeCmdItem(cmdFiltered[cmdActiveIdx]);
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (cmdPalette.classList.contains('active')) {
                closeCmdPalette();
            } else {
                openCmdPalette();
            }
        }
        if (e.key === 'Escape' && cmdPalette.classList.contains('active')) {
            closeCmdPalette();
        }
    });

    cmdOverlay.addEventListener('click', closeCmdPalette);

    } // end initPage
});

// ═══════════════ TOGGLE COLLAPSIBLE ═══════════════
function toggleCollapsible(button) {
    const content = button.nextElementSibling;
    const arrow = button.querySelector('.toggle-arrow');
    content.classList.toggle('open');
    if (arrow) arrow.classList.toggle('open');
}
