    document.addEventListener('DOMContentLoaded', () => {
      gsap.registerPlugin(ScrollTrigger);
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isTouch = window.matchMedia('(hover: none)').matches;

      /* ---------- Theme toggle (light/dark, drives CSS custom properties) ---------- */
      const root = document.documentElement;
      const toggleBtn = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const themeLabel = document.getElementById('theme-label');

      function applyTheme(mode) {
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
        themeIcon.textContent = mode === 'dark' ? '☀' : '☾';
        themeLabel.textContent = mode === 'dark' ? 'Light' : 'Dark';
        try { localStorage.setItem('drift-theme', mode); } catch (e) { }
      }
      let savedTheme = 'light';
      try { savedTheme = localStorage.getItem('drift-theme') || 'light'; } catch (e) { }
      applyTheme(savedTheme);

      toggleBtn.addEventListener('click', () => {
        const next = root.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(next);
      });

      /* ---------- Lenis smooth scroll ---------- */
      let lenis;
      if (!prefersReduced) {
        lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 3), smoothWheel: true });
        (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })();
        lenis.on('scroll', ScrollTrigger.update);
      }
      document.querySelectorAll('nav a, .footer-links a').forEach(a => {
        a.addEventListener('click', e => {
          const target = document.querySelector(a.getAttribute('href'));
          if (target) {
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { offset: -20 });
            else target.scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      /* ---------- Intro reveal ---------- */
      const introTl = gsap.timeline({
        onComplete: () => {
          document.getElementById('intro-overlay').style.pointerEvents = 'none';
          heroTl.play();
        }
      });
      introTl
        .to('#intro-overlay .word', { opacity: 1, duration: .5, ease: 'power2.out' })
        .to('#intro-overlay .word', { opacity: 1, duration: .5 })
        .to('#intro-overlay', { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '+=0.1')
        .set('#intro-overlay', { display: 'none' });

      /* ---------- Hero entrance ---------- */
      const heroTl = gsap.timeline({ paused: true });
      heroTl
        .from('.marquee-track.fwd', { xPercent: 14, duration: 1.4, ease: 'power4.out' })
        .from('.marquee-track.rev', { xPercent: -14, duration: 1.4, ease: 'power4.out' }, '<')
        .to('.reveal-mask > *', { translateY: '0%', duration: 1, ease: 'power4.out', stagger: .05 }, '-=0.7')
        .from('.hero-meta div', { opacity: 0, y: 16, duration: .7, stagger: .08, ease: 'power2.out' }, '-=0.6')
        .from('.scroll-cue', { opacity: 0, duration: .6 }, '-=0.4');

      /* ---------- Infinite marquees ---------- */
      gsap.to('.marquee-track.fwd', { xPercent: -25, duration: 22, ease: 'none', repeat: -1 });
      gsap.to('.marquee-track.rev', { xPercent: 25, duration: 26, ease: 'none', repeat: -1 });
      gsap.to('#reel .reel-track', { xPercent: -25, duration: 18, ease: 'none', repeat: -1 });

      /* ---------- Header shrink ---------- */
      const header = document.getElementById('header');
      ScrollTrigger.create({
        start: 0, end: 400,
        onUpdate: self => {
          const p = self.progress;
          header.style.padding = `${28 - p * 12}px clamp(20px, 5vw, 64px)`;
          header.style.backdropFilter = `blur(${p * 16}px)`;
          header.style.backgroundColor = `rgba(10,8,8,${p * .55})`;
          header.style.borderBottom = `1px solid rgba(242,237,232,${p * .1})`;
        }
      });

      const bgChapter = document.getElementById('bgChapter');
      const bgParallax = document.getElementById('bgParallax');

      let scrolling = false, scrollTimer;
      if (lenis) {
        lenis.on('scroll', () => {
          scrolling = true;
          clearTimeout(scrollTimer);
          scrollTimer = setTimeout(() => { scrolling = false; }, 140);
        });
      }

      /* ---------- Sticky pin chapters ---------- */
      document.querySelectorAll('.sticky-section').forEach((section, idx) => {
        const stage = section.querySelector('.pin-stage');
        const card = section.querySelector('.hero-card');
        const pillars = section.querySelectorAll('.pillar');
        const chapters = (section.dataset.chapters || '').split(',').map(s => s.trim());

        let tiltX = 0, tiltY = 0, curX = 0, curY = 0;
        if (!isTouch && !prefersReduced) {
          stage.addEventListener('mousemove', e => {
            const r = stage.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - .5;
            const py = (e.clientY - r.top) / r.height - .5;
            tiltY = px * 30; tiltX = -py * 30;
          });
          stage.addEventListener('mouseleave', () => { tiltX = 0; tiltY = 0; });
          (function tiltRaf() {
            const target = scrolling ? 0 : 1;
            curX += (tiltX * target - curX) * .08;
            curY += (tiltY * target - curY) * .08;
            card.style.transform = `rotateX(${curX}deg) rotateY(${curY}deg)`;
            requestAnimationFrame(tiltRaf);
          })();
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section, start: 'top top', end: 'bottom bottom',
            pin: stage, scrub: 1,
            onEnter: () => setChapter(chapters[0]),
            onEnterBack: () => setChapter(chapters[0]),
          }
        });
        function setChapter(c) { if (c) gsap.to(bgChapter, { backgroundColor: c, duration: .8 }); }

        if (chapters[1]) tl.to(bgChapter, { backgroundColor: chapters[1], duration: 1 }, 0.0);
        if (chapters[2]) tl.to(bgChapter, { backgroundColor: chapters[2], duration: 1 }, 1.2);
        if (chapters[3]) tl.to(bgChapter, { backgroundColor: chapters[3], duration: 1 }, 2.4);

        tl.fromTo(card, { scale: .9 }, { scale: 1.04, duration: 3.6, ease: 'none' }, 0);
        tl.to(bgParallax, { yPercent: idx % 2 === 0 ? -20 : -12, duration: 3.6, ease: 'none' }, 0);

        const starts = [.35, 1.55, 2.75];
        pillars.forEach((el, i) => {
          const t = starts[i] || .35 + i * 1.2;
          const globalIdx = idx * 3 + i; // 0..8 across all 3 chapters — each gets a unique animation
          animatePillar(tl, el, globalIdx, t);
        });
      });

      /* ---------- 9 unique pillar scroll animations ---------- */
      function animatePillar(tl, el, animIndex, t) {
        // give every pillar its own transform-origin / perspective context
        el.style.transformOrigin = 'center center';
        el.style.willChange = 'transform, opacity, filter, clip-path';

        switch (animIndex % 9) {

          /* 0 — Slide + blur focus-pull from the left */
          case 0:
            gsap.set(el, { filter: 'blur(14px)' });
            tl.fromTo(el,
              { opacity: 0, x: -90, filter: 'blur(14px)' },
              { opacity: 1, x: 0, filter: 'blur(0px)', duration: .6, ease: 'power3.out' }, t)
              .to(el, { opacity: 0, x: 40, filter: 'blur(10px)', duration: .55, ease: 'power2.in' }, t + .9);
            break;

          /* 1 — Diagonal drop with soft bounce */
          case 1:
            tl.fromTo(el,
              { opacity: 0, x: 70, y: -60, rotate: 6 },
              { opacity: 1, x: 0, y: 0, rotate: 0, duration: .7, ease: 'back.out(1.8)' }, t)
              .to(el, { opacity: 0, y: 50, rotate: -4, duration: .5, ease: 'power2.in' }, t + .9);
            break;

          /* 2 — 3D flip reveal around the Y axis */
          case 2:
            el.style.perspective = '900px';
            tl.fromTo(el,
              { opacity: 0, rotateY: 85, x: 60, transformPerspective: 900 },
              { opacity: 1, rotateY: 0, x: 0, duration: .65, ease: 'power3.out' }, t)
              .to(el, { opacity: 0, rotateY: -60, x: -30, duration: .5, ease: 'power2.in' }, t + .9);
            break;

          /* 3 — Clip-path wipe reveal (left to right curtain) */
          case 3:
            tl.fromTo(el,
              { opacity: 0, clipPath: 'inset(0 100% 0 0)', x: 0 },
              { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: .7, ease: 'power4.out' }, t)
              .to(el, { opacity: 0, clipPath: 'inset(0 0 0 100%)', duration: .5, ease: 'power2.in' }, t + .9);
            break;

          /* 4 — Elastic scale-up from a pinpoint */
          case 4:
            tl.fromTo(el,
              { opacity: 0, scale: .55, y: 30 },
              { opacity: 1, scale: 1, y: 0, duration: .8, ease: 'elastic.out(1, .6)' }, t)
              .to(el, { opacity: 0, scale: .8, y: -20, duration: .45, ease: 'power2.in' }, t + .95);
            break;

          /* 5 — Skewed slide-up, like sliding out from under a mask */
          case 5:
            tl.fromTo(el,
              { opacity: 0, y: 90, skewY: 6, x: -20 },
              { opacity: 1, y: 0, skewY: 0, x: 0, duration: .6, ease: 'power3.out' }, t)
              .to(el, { opacity: 0, y: -60, skewY: -4, duration: .5, ease: 'power2.in' }, t + .9);
            break;

          /* 6 — Rotating drop-in from above with slight overshoot */
          case 6:
            tl.fromTo(el,
              { opacity: 0, y: -100, rotate: -10, transformOrigin: 'top center' },
              { opacity: 1, y: 0, rotate: 0, duration: .7, ease: 'back.out(2.2)' }, t)
              .to(el, { opacity: 0, y: 70, rotate: 8, duration: .5, ease: 'power2.in' }, t + .9);
            break;

          /* 7 — Letter-by-letter stagger reveal on the heading, fade on the rest */
          case 7: {
            const heading = el.querySelector('h3');
            const rest = el.querySelectorAll('.num, p');
            if (heading && !heading.dataset.split) {
              const original = heading.innerHTML;
              heading.dataset.split = '1';
              heading.innerHTML = original
                .split(/(<br\s*\/?>)/gi)
                .map(chunk => chunk.match(/<br/i)
                  ? chunk
                  : chunk.split('').map(ch => `<span class="char-span" style="display:inline-block;">${ch === ' ' ? '&nbsp;' : ch}</span>`).join(''))
                .join('');
            }
            const chars = el.querySelectorAll('.char-span');
            tl.set(el, { opacity: 1 }, t)
              .fromTo(chars,
                { opacity: 0, y: 26, rotate: 4 },
                { opacity: 1, y: 0, rotate: 0, duration: .35, ease: 'power3.out', stagger: .012 }, t)
              .fromTo(rest,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: .4, ease: 'power2.out', stagger: .05 }, t + .15)
              .to(el, { opacity: 0, y: -30, duration: .45, ease: 'power2.in' }, t + .95);
            break;
          }

          /* 8 — Zoom-through from deep 3D space (translateZ) with blur */
          case 8:
            el.style.perspective = '1200px';
            tl.fromTo(el,
              { opacity: 0, scale: 1.6, z: -300, filter: 'blur(18px)' },
              { opacity: 1, scale: 1, z: 0, filter: 'blur(0px)', duration: .75, ease: 'power4.out' }, t)
              .to(el, { opacity: 0, scale: .7, filter: 'blur(10px)', duration: .5, ease: 'power2.in' }, t + .95);
            break;
        }
      }

      /* ---------- Work rows: staggered slide reveal ---------- */
      gsap.utils.toArray('.project-row').forEach(row => {
        gsap.from(row, {
          opacity: 0, y: 40, duration: .8, ease: 'power3.out',
          scrollTrigger: { trigger: row, start: 'top 90%', toggleActions: 'play none none reverse' }
        });
      });

      /* ---------- Reel: pin + scale-in on approach ---------- */
      gsap.fromTo('#reel', { scale: .92 }, {
        scale: 1, duration: 1,
        scrollTrigger: { trigger: '#reel', start: 'top bottom', end: 'top center', scrub: true }
      });
      gsap.from('#reel .center-btn', {
        scale: .5, opacity: 0, duration: .8, ease: 'back.out(1.7)',
        scrollTrigger: { trigger: '#reel', start: 'top 60%' }
      });

      /* ---------- Categories: staggered slide-in on scroll ---------- */
      gsap.utils.toArray('.cat-row').forEach((row, i) => {
        gsap.fromTo(row,
          { opacity: 0, x: i % 2 === 0 ? -50 : 50 },
          {
            opacity: 1, x: 0, duration: .9, ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 92%', toggleActions: 'play none none reverse' }
          }
        );
      });

      /* ---------- Categories: floating image pops out and follows cursor ---------- */
      if (!isTouch) {
        const catFloat = document.getElementById('catImageFloat');
        const catImg = catFloat.querySelector('img');
        let cmx = 0, cmy = 0, cvx = 0, cvy = 0, catActive = false;

        window.addEventListener('mousemove', e => { cmx = e.clientX; cmy = e.clientY; });
        gsap.ticker.add(() => {
          // slight lag/float so the image glides smoothly to the cursor
          cvx += (cmx - cvx) * .14;
          cvy += (cmy - cvy) * .14;
          catFloat.style.left = cvx + 'px';
          catFloat.style.top = cvy + 'px';
        });

        document.querySelectorAll('.cat-row').forEach(row => {
          row.addEventListener('mouseenter', () => {
            catActive = true;
            catImg.src = row.dataset.img;
            catFloat.classList.add('show');
            gsap.killTweensOf(catFloat);
            gsap.fromTo(catFloat,
              { scale: 0, opacity: 0, rotate: -6 },
              { scale: 1, opacity: 1, rotate: 0, duration: .6, ease: 'elastic.out(1, .65)' }
            );
          });
          row.addEventListener('mousemove', e => {
            // subtle tilt of the popped-out image based on cursor position within the row
            const r = row.getBoundingClientRect();
            const py = (e.clientY - r.top) / r.height - .5;
            gsap.to(catFloat, { rotate: py * 8, duration: .4, ease: 'power2.out' });
          });
          row.addEventListener('mouseleave', () => {
            catActive = false;
            catFloat.classList.remove('show');
            gsap.killTweensOf(catFloat);
            gsap.to(catFloat, { scale: 0, opacity: 0, rotate: 6, duration: .4, ease: 'power3.in' });
          });
        });
      }

      /* ---------- About: word-by-word reveal + count-up stats ---------- */
      const sentenceEl = document.getElementById('aboutSentence');
      const wrapped = sentenceEl.innerHTML
        .split(/(<em>.*?<\/em>|\s+)/)
        .filter(Boolean)
        .map(chunk => {
          if (chunk.match(/^\s+$/)) return chunk;
          if (chunk.startsWith('<em>')) return `<em><span class="word-span">${chunk.replace(/<\/?em>/g, '')}</span></em>`;
          return `<span class="word-span">${chunk}</span>`;
        }).join(' ');
      sentenceEl.innerHTML = wrapped;

      gsap.to('#about .word-span', {
        opacity: 1, duration: .4, ease: 'none', stagger: .02,
        scrollTrigger: { trigger: '#about', start: 'top 75%', end: 'top 25%', scrub: true }
      });
      gsap.from('#about .stat', {
        opacity: 0, y: 30, duration: .7, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 75%' }
      });

      /* ---------- Count-up numbers (about stats + metrics) ---------- */
      document.querySelectorAll('[data-count]').forEach(el => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const obj = { val: 0 };
        ScrollTrigger.create({
          trigger: el, start: 'top 88%', once: true,
          onEnter: () => gsap.to(obj, {
            val: target, duration: 1.6, ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.round(obj.val) + suffix; }
          })
        });
      });

      gsap.from('footer h2', {
        opacity: 0, y: 60, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: 'footer', start: 'top 85%' }
      });
      gsap.from('.outro h2, .outro p, .outro .cta', {
        opacity: 0, y: 40, duration: .9, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: '.outro', start: 'top 75%' }
      });

      /* ---------- Custom cursor: viewfinder ---------- */
      if (!isTouch) {
        const vf = document.getElementById('viewfinder');
        const vfImg = document.getElementById('vf-img');
        const vfLabel = document.getElementById('vf-label');
        const dot = document.getElementById('dot');
        let mx = 0, my = 0, vx = 0, vy = 0;

        window.addEventListener('mousemove', e => {
          mx = e.clientX; my = e.clientY;
          dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
        });
        gsap.ticker.add(() => {
          vx += (mx - vx) * .16; vy += (my - vy) * .16;
          vf.style.transform = `translate(${vx}px, ${vy}px) translate(-50%,-50%) scale(${vf.classList.contains('active') ? 1 : .001})`;
        });

        document.querySelectorAll('.project-row').forEach(row => {
          row.addEventListener('mouseenter', () => {
            vf.classList.add('active');
            vfImg.src = row.dataset.img;
            vfImg.classList.add('show');
            vfLabel.textContent = row.dataset.label || 'View';
            gsap.to(vf, { width: 170, height: 120, duration: .35, ease: 'power3.out' });
          });
          row.addEventListener('mouseleave', () => {
            vf.classList.remove('active');
            vfImg.classList.remove('show');
            gsap.to(vf, { width: 120, height: 84, duration: .35, ease: 'power3.out' });
          });
        });
      }

      /* ============================================================
         EXTENDED MOTION MODULE — new dynamic systems
         ============================================================ */

      /* ---------- Scroll progress bar ---------- */
      const scrollFill = document.getElementById('scrollbar-fill');
      function updateScrollbar() {
        const h = document.documentElement;
        const scrolled = h.scrollTop || document.body.scrollTop;
        const height = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
        const pct = height > 0 ? (scrolled / height) * 100 : 0;
        scrollFill.style.width = pct + '%';
      }
      if (lenis) lenis.on('scroll', updateScrollbar);
      window.addEventListener('scroll', updateScrollbar, { passive: true });
      updateScrollbar();

      /* ---------- Ambient gradient-mesh blob canvas ---------- */
      (function blobField() {
        const canvas = document.getElementById('blob-canvas');
        const ctx = canvas.getContext('2d');
        let w, h, blobs;
        function resize() {
          w = canvas.width = window.innerWidth;
          h = canvas.height = window.innerHeight;
        }
        function makeBlobs() {
          const palette = ['#3a5bff', '#9aa06a', '#3a5bff', '#5c3aff'];
          blobs = Array.from({ length: 4 }, (_, i) => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 220 + Math.random() * 180,
            color: palette[i % palette.length],
            vx: (Math.random() - .5) * .25,
            vy: (Math.random() - .5) * .25,
          }));
        }
        resize(); makeBlobs();
        window.addEventListener('resize', () => { resize(); });
        function draw() {
          if (!prefersReduced) {
            ctx.clearRect(0, 0, w, h);
            blobs.forEach(b => {
              b.x += b.vx; b.y += b.vy;
              if (b.x < -b.r) b.x = w + b.r; if (b.x > w + b.r) b.x = -b.r;
              if (b.y < -b.r) b.y = h + b.r; if (b.y > h + b.r) b.y = -b.r;
              const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
              g.addColorStop(0, b.color + '33');
              g.addColorStop(1, b.color + '00');
              ctx.fillStyle = g;
              ctx.beginPath();
              ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
              ctx.fill();
            });
          }
          requestAnimationFrame(draw);
        }
        draw();
      })();

      /* ---------- Cursor particle trail ---------- */
      if (!isTouch && !prefersReduced) {
        (function trail() {
          const canvas = document.getElementById('trail-canvas');
          const ctx = canvas.getContext('2d');
          let w, h, particles = [];
          function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
          resize(); window.addEventListener('resize', resize);

          let lastX = null, lastY = null;
          window.addEventListener('mousemove', e => {
            const dx = lastX === null ? 0 : e.clientX - lastX;
            const dy = lastY === null ? 0 : e.clientY - lastY;
            const speed = Math.min(Math.hypot(dx, dy), 40);
            lastX = e.clientX; lastY = e.clientY;
            const neutralColors = [
              '255,253,208', // cream
              '245,245,220', // beige
              '255,255,240', // ivory
              '188,184,177'  // warm gray
            ];
            if (speed > 2) {
              particles.push({
                x: e.clientX,
                y: e.clientY,
                r: 1.5 + Math.random() * 8,
                life: 1,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                color: neutralColors[Math.floor(Math.random() * neutralColors.length)]
              });
            }
            if (particles.length > 120) particles.splice(0, particles.length - 120);
          });

          function draw() {
            ctx.clearRect(0, 0, w, h);
            particles.forEach(p => {
              p.life -= 0.005;
              p.x += p.vx; p.y += p.vy;
              if (p.life > 0) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(${p.color},${p.life * .7})`;
                ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
                ctx.fill();
              }
            });
            particles = particles.filter(p => p.life > 0);
            requestAnimationFrame(draw);
          }
          draw();
        })(); 5
      }

      /* ---------- Magnetic pull for nav links + CTA + sound toggle ---------- */
      if (!isTouch && !prefersReduced) {
        const magneticTargets = document.querySelectorAll('nav a, .cta, #sound-toggle, #theme-toggle, .testi-nav');
        magneticTargets.forEach(el => {
          let bx = 0, by = 0, cx = 0, cy = 0;
          el.addEventListener('mousemove', e => {
            const r = el.getBoundingClientRect();
            bx = (e.clientX - r.left - r.width / 2) * .35;
            by = (e.clientY - r.top - r.height / 2) * .35;
          });
          el.addEventListener('mouseleave', () => { bx = 0; by = 0; });
          (function raf() {
            cx += (bx - cx) * .18; cy += (by - cy) * .18;
            el.style.transform = `translate(${cx}px, ${cy}px)`;
            requestAnimationFrame(raf);
          })();
        });
      }

      /* ---------- Text scramble reveal for hero-adjacent headings ---------- */
      class TextScramble {
        constructor(el) {
          this.el = el;
          this.chars = '!<>-_\\/[]{}—=+*^?#________';
          this.queue = [];
          this.frame = 0;
          this.resolve = null;
          this.frameRequest = null;
          this.update = this.update.bind(this);
        }
        setText(newText) {
          const oldText = this.el.textContent;
          const length = Math.max(oldText.length, newText.length);
          const promise = new Promise(resolve => this.resolve = resolve);
          this.queue = [];
          for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 20);
            const end = start + Math.floor(Math.random() * 20);
            this.queue.push({ from, to, start, end });
          }
          cancelAnimationFrame(this.frameRequest);
          this.frame = 0;
          this.update();
          return promise;
        }
        update() {
          let output = '';
          let complete = 0;
          for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) { complete++; output += to; }
            else if (this.frame >= start) {
              if (!char || Math.random() < .28) {
                char = this.chars[Math.floor(Math.random() * this.chars.length)];
                this.queue[i].char = char;
              }
              output += `<span style="opacity:.6">${char}</span>`;
            } else { output += from; }
          }
          this.el.innerHTML = output;
          if (complete === this.queue.length) { this.resolve(); }
          else { this.frame++; this.frameRequest = requestAnimationFrame(this.update); }
        }
      }
      if (!prefersReduced) {
        document.querySelectorAll('.hero-meta div span').forEach(el => {
          const fx = new TextScramble(el);
          const original = el.textContent;
          ScrollTrigger.create({
            trigger: el, start: 'top 95%', once: true,
            onEnter: () => fx.setText(original)
          });
        });
      }

      /* ---------- Awards: cursor-tracked radial glow per card studio size ---------- */
      document.querySelectorAll('.award-card').forEach(card => {
        card.addEventListener('mousemove', e => {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
          card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        });
      });
      gsap.utils.toArray('.award-card').forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 30, duration: .7, delay: (i % 3) * .08, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 92%', toggleActions: 'play none none reverse' }
        });
      });

      /* ---------- Testimonials carousel: autoplay + drag + dots ---------- */
      (function testimonials() {
        const viewport = document.getElementById('testiViewport');
        const track = document.getElementById('testiTrack');
        const slides = track.querySelectorAll('.testi-slide');
        const dotsWrap = document.getElementById('testiDots');
        const prevBtn = document.getElementById('testiPrev');
        const nextBtn = document.getElementById('testiNext');
        let index = 0, autoTimer;

        slides.forEach((_, i) => {
          const dot = document.createElement('button');
          dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
          dot.addEventListener('click', () => goTo(i));
          dotsWrap.appendChild(dot);
        });
        const dots = dotsWrap.querySelectorAll('.testi-dot');

        function goTo(i) {
          index = (i + slides.length) % slides.length;
          gsap.to(track, { xPercent: -100 * index, duration: .7, ease: 'power3.inOut' });
          dots.forEach((d, di) => d.classList.toggle('active', di === index));
          restartAuto();
        }
        function restartAuto() {
          clearInterval(autoTimer);
          autoTimer = setInterval(() => goTo(index + 1), 5500);
        }
        prevBtn.addEventListener('click', () => goTo(index - 1));
        nextBtn.addEventListener('click', () => goTo(index + 1));

        /* drag support */
        let startX = 0, currentXPercent = 0, dragging = false;
        const onDown = x => { dragging = true; startX = x; viewport.classList.add('dragging'); clearInterval(autoTimer); };
        const onMove = x => {
          if (!dragging) return;
          const delta = ((x - startX) / viewport.clientWidth) * 100;
          gsap.set(track, { xPercent: -100 * index + delta });
        };
        const onUp = x => {
          if (!dragging) return;
          dragging = false; viewport.classList.remove('dragging');
          const delta = x !== null ? ((x - startX) / viewport.clientWidth) * 100 : 0;
          if (delta < -12) goTo(index + 1);
          else if (delta > 12) goTo(index - 1);
          else goTo(index);
        };
        viewport.addEventListener('mousedown', e => onDown(e.clientX));
        window.addEventListener('mousemove', e => onMove(e.clientX));
        window.addEventListener('mouseup', e => onUp(e.clientX));
        viewport.addEventListener('touchstart', e => onDown(e.touches[0].clientX), { passive: true });
        viewport.addEventListener('touchmove', e => onMove(e.touches[0].clientX), { passive: true });
        viewport.addEventListener('touchend', () => onUp(null));

        goTo(0);
      })();

      /* ---------- Film-strip: vertical scroll drives horizontal frame movement ---------- */
      (function filmstrip() {
        const section = document.getElementById('filmstrip');
        const track = document.getElementById('filmTrack');
        if (!section || !track) return;
        const setDistance = () => Math.max(track.scrollWidth - window.innerWidth + 120, 0);

        gsap.to(track, {
          x: () => -setDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section, start: 'top top', end: 'bottom bottom',
            scrub: 1, pin: '.filmstrip-stage', invalidateOnRefresh: true,
          }
        });

        gsap.utils.toArray('.film-frame').forEach((frame, i) => {
          gsap.fromTo(frame, { scale: .92, filter: 'brightness(.6)' }, {
            scale: 1, filter: 'brightness(1)', ease: 'none',
            scrollTrigger: {
              trigger: section, start: 'top top', end: 'bottom bottom',
              scrub: 1,
            }
          });
        });
      })();

      /* ---------- Tilt effect for project rows on hover (subtle 3D) ---------- */
      if (!isTouch && !prefersReduced) {
        document.querySelectorAll('.project-row').forEach(row => {
          row.addEventListener('mousemove', e => {
            const r = row.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - .5;
            const py = (e.clientY - r.top) / r.height - .5;
            gsap.to(row, { rotateX: -py * 3, rotateY: px * 4, duration: .4, ease: 'power2.out', transformPerspective: 800 });
          });
          row.addEventListener('mouseleave', () => {
            gsap.to(row, { rotateX: 0, rotateY: 0, duration: .5, ease: 'power3.out' });
          });
        });
      }

      /* ---------- Sound toggle (visual ambient state, muted by default) - hover--------- */
      const soundToggle = document.getElementById('sound-toggle');
      let soundOn = false;

      // Create an Audio element
      const audio = new Audio('E:/ThemeMain.mp3');
      audio.loop = true;          // loop the song
      audio.volume = 0.05;        // subtle background volume (adjust as needed)
      audio.preload = 'auto';     // optional: start loading early

      // Start muted (matches the initial UI)
      soundToggle.classList.add('muted');

      soundToggle.addEventListener('click', () => {
        soundOn = !soundOn;
        soundToggle.classList.toggle('muted', !soundOn);
        soundToggle.setAttribute('aria-label', soundOn ? 'Mute ambient sound' : 'Unmute ambient sound');

        if (soundOn) {
          audio.play().catch(err => console.warn('Audio play failed:', err));
        } else {
          audio.pause();
          // Optional: reset playback position if you want the track to restart next time
          // audio.currentTime = 0;
        }
      });

      /* ---------- Page-transition wipe on internal nav clicks ---------- */
      if (!prefersReduced) {
        const wipe = document.getElementById('page-transition');
        document.querySelectorAll('nav a:not(.enquire)').forEach(a => {
          a.addEventListener('click', () => {
            gsap.fromTo(wipe, { yPercent: 101 }, {
              yPercent: 0, duration: .45, ease: 'power4.in',
              onComplete: () => gsap.to(wipe, {
                yPercent: -101, duration: .5, delay: .15, ease: 'power4.out',
                onComplete: () => gsap.set(wipe, { yPercent: 101 })
              })
            });
          });
        });
      }

      ScrollTrigger.refresh();
    });