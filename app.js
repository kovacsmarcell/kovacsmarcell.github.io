/* Marcell Kovács, app.js
   Behaviour only: all content (ticker, stats, publications, experience,
   schools, speaking, awards, civic, now, marquee) is static in index.html.
   Here: map + pins, hover sync, scroll reveal and count-up, side rail,
   mode toggle, cursor, hero name letters, hero network canvas.
*/
(function(){
  /* ============ map: real world geometry ============ */
  const svg = document.getElementById('worldSvg');
  svg.innerHTML = `
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0 L0 0 0 40" fill="none" stroke="var(--map-grid)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    <line x1="0" y1="250" x2="1000" y2="250" stroke="var(--map-line)" stroke-dasharray="2 5"/>
    <line x1="0" y1="185" x2="1000" y2="185" stroke="var(--map-line-soft)" stroke-dasharray="1 6"/>
    <line x1="0" y1="315" x2="1000" y2="315" stroke="var(--map-line-soft)" stroke-dasharray="1 6"/>
    <path d="${window.WORLD_PATH}" fill="var(--map-fill)" stroke="var(--map-stroke)" stroke-width="0.5" stroke-linejoin="round"/>
  `;

  function project(lat, lng){
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return [x, y];
  }
  // one pin per school card, from its data-lat / data-lng / data-city attributes
  const pinsHost = document.getElementById('pins');
  document.querySelectorAll('#schools .school').forEach(s=>{
    const [x, y] = project(parseFloat(s.dataset.lat), parseFloat(s.dataset.lng));
    const div = document.createElement('div');
    div.className = 'pin';
    div.dataset.i = s.dataset.i;
    div.style.left = (x/1000*100)+'%';
    div.style.top = (y/500*100)+'%';
    div.title = s.dataset.city + ' / ' + s.querySelector('h3').textContent;
    pinsHost.appendChild(div);
  });

  // school card hover ↔ pin sync
  const schoolCards = document.querySelectorAll('#schools .school');
  const pinEls = document.querySelectorAll('#pins .pin');
  function highlight(i){
    schoolCards.forEach(s=>s.classList.toggle('active', +s.dataset.i===i));
    pinEls.forEach(p=>p.style.transform = (+p.dataset.i===i) ? 'translate(-50%, -50%) scale(1.6)' : 'translate(-50%, -50%) scale(1)');
  }
  schoolCards.forEach(s=>{
    s.addEventListener('mouseenter', ()=>highlight(+s.dataset.i));
    s.addEventListener('mouseleave', ()=>highlight(-1));
  });
  pinEls.forEach(p=>{
    p.addEventListener('mouseenter', ()=>highlight(+p.dataset.i));
    p.addEventListener('mouseleave', ()=>highlight(-1));
  });

  /* ============ scroll reveal ============ */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('in');
        // count up
        if(en.target.querySelectorAll){
          en.target.querySelectorAll('[data-count]').forEach(el=>{
            const target = +el.dataset.count;
            const dur = 1200;
            const start = performance.now();
            function tick(t){
              const p = Math.min(1, (t-start)/dur);
              const eased = 1 - Math.pow(1-p, 3);
              el.textContent = Math.round(target * eased);
              if(p<1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          });
        }
      }
    });
  }, {threshold: 0.18});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ============ side rail active ============ */
  const railLinks = document.querySelectorAll('.rail a');
  const sectionEls = [...railLinks].map(a => document.getElementById(a.dataset.target));
  const railIo = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        const id = en.target.id;
        railLinks.forEach(a => a.classList.toggle('active', a.dataset.target===id));
      }
    });
  }, {threshold: 0.4});
  sectionEls.forEach(s => s && railIo.observe(s));

  /* ============ rail open/close ============ */
  const rail = document.getElementById('rail');
  const railToggle = document.getElementById('railToggle');
  let railOpen = false;
  function setRail(open){
    railOpen = open;
    rail.classList.toggle('closed', !open);
    railToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  railToggle.addEventListener('click', () => setRail(!railOpen));
  document.addEventListener('keydown', e => { if(e.key==='Escape' && railOpen) setRail(false); });
  rail.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(()=>setRail(false), 200)));

  // auto-show on hero, auto-hide everywhere else (unless user manually toggled)
  const heroEl = document.getElementById('hero');
  let onHero = true;
  let userOverride = false; // user manually toggled: pause hero-based auto behavior
  railToggle.addEventListener('click', () => { userOverride = true; });
  const heroIo = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      onHero = en.isIntersecting;
      if(userOverride) return;
      if(window.innerWidth <= 720) return; // mobile: rail stays manually controlled
      setRail(onHero);
    });
  }, {threshold: 0.1});
  if(heroEl) heroIo.observe(heroEl);

  // when off-hero and rail is open, any meaningful scroll closes it
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    // toggle topbar background after a small scroll
    document.body.classList.toggle('scrolled', window.scrollY > 40);
    const dy = Math.abs(window.scrollY - lastY);
    if(dy > 200){
      if(!onHero && railOpen) setRail(false);
      userOverride = false; // re-enable hero-based auto behavior
      lastY = window.scrollY;
    }
  }, {passive:true});

  // initial state based on load position
  setTimeout(()=>{
    if(heroEl && heroEl.getBoundingClientRect().bottom < 200) setRail(false);
  }, 100);

  /* ============ smooth scroll ============ */
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href').slice(1);
      const t = document.getElementById(id);
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });

  /* ============ mode toggle ============ */
  const mt = document.getElementById('modeToggle');
  // accent colour for the hero canvas: read once by the next drawn frame,
  // and read again after every mode change (empty string = read pending)
  let accentColor = '';
  function setMode(m){
    document.documentElement.dataset.mode = m;
    mt.textContent = m==='dark' ? 'Dark / Light' : 'Light / Dark';
    accentColor = '';
  }
  mt.addEventListener('click', ()=>{
    const cur = document.documentElement.dataset.mode || 'light';
    setMode(cur==='light' ? 'dark' : 'light');
  });

  /* ============ cursor ============ */
  // The dot and ring are hidden by CSS on devices that cannot hover, so the
  // follow loop only runs while the primary input can hover (re-checked on change).
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const noHover = matchMedia('(hover: none)');
  let cursorRunning = false;
  let mx=window.innerWidth/2, my=window.innerHeight/2, rx=mx, ry=my;
  window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
  function loop(){
    if(noHover.matches){ cursorRunning = false; return; }
    rx += (mx-rx)*0.18;
    ry += (my-ry)*0.18;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  function startCursor(){
    if(cursorRunning || noHover.matches) return;
    cursorRunning = true;
    requestAnimationFrame(loop);
  }
  if(noHover.addEventListener) noHover.addEventListener('change', startCursor);
  else if(noHover.addListener) noHover.addListener(startCursor);
  startCursor();
  document.querySelectorAll('a, button, .pin, .school, .card, .pub').forEach(el=>{
    el.addEventListener('mouseenter', ()=>ring.classList.add('hover'));
    el.addEventListener('mouseleave', ()=>ring.classList.remove('hover'));
  });

  /* ============ magnetic ============ */
  document.querySelectorAll('.magnetic').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      el.style.transform = `translate(${x*0.15}px, ${y*0.2}px)`;
    });
    el.addEventListener('mouseleave', ()=>{ el.style.transform=''; });
  });

  /* ============ split hero name into letters ============ */
  const heroName = document.getElementById('heroName');
  if(heroName){
    // walk: split text nodes into spans, preserve <span class="ital">
    function splitNode(node){
      const out = document.createElement('span');
      out.style.display = 'inline-block';
      // Group consecutive non-space chars into a .word wrapper so the browser
      // only breaks at real spaces, not between letters of a name.
      let word = null;
      const ensureWord = () => {
        if(!word){ word = document.createElement('span'); word.className = 'word'; }
        return word;
      };
      const flushWord = () => { if(word){ out.appendChild(word); word = null; } };
      const makeCh = (ch) => {
        const s = document.createElement('span');
        s.className = 'ch' + (ch===' ' ? ' sp' : '');
        s.textContent = ch;
        return s;
      };
      [...node.childNodes].forEach(c => {
        if(c.nodeType === 3){ // text
          [...c.textContent].forEach(ch => {
            if(ch === ' '){ flushWord(); out.appendChild(makeCh(ch)); }
            else { ensureWord().appendChild(makeCh(ch)); }
          });
        } else if(c.nodeType === 1){
          flushWord();
          const wrap = c.cloneNode(false);
          wrap.classList.add('word');
          [...c.childNodes].forEach(cc => {
            if(cc.nodeType === 3){
              [...cc.textContent].forEach(ch => wrap.appendChild(makeCh(ch)));
            }
          });
          out.appendChild(wrap);
        }
      });
      flushWord();
      return out;
    }
    // The plain name stays the heading's accessible name; the animated
    // letters are decoration, so screen readers do not spell them out.
    const nameText = heroName.textContent.replace(/\s+/g, ' ').trim();
    const splitted = splitNode(heroName);
    splitted.setAttribute('aria-hidden', 'true');
    heroName.innerHTML = '';
    heroName.setAttribute('aria-label', nameText);
    heroName.appendChild(splitted);

    const chars = heroName.querySelectorAll('.ch');
    const hero = document.getElementById('hero');
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      chars.forEach(ch => {
        const cr = ch.getBoundingClientRect();
        const cx = cr.left - r.left + cr.width/2;
        const cy = cr.top - r.top + cr.height/2;
        const dx = mx - cx, dy = my - cy;
        const d = Math.hypot(dx, dy);
        const f = Math.max(0, 1 - d/420);
        ch.style.transform = `translate(${dx*f*0.08}px, ${dy*f*0.08}px)`;
      });
    });
    hero.addEventListener('mouseleave', () => {
      chars.forEach(ch => ch.style.transform = '');
    });
  }

  /* ============ HERO NETWORK CANVAS ============ */
  const canvas = document.getElementById('netCanvas');
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');
  let W=0, H=0, DPR=Math.min(2, window.devicePixelRatio||1);
  function resize(){
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W*DPR; canvas.height = H*DPR;
    canvas.style.width = W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    placeNodes();
  }
  // discipline nodes, anchored, plus ambient particles
  const disc = [
    { id: "cs",   label: "Computer Engineering", deg: 0,    detail: "BSc, BME, 4.73 / 5.00" },
    { id: "math", label: "Mathematics",          deg: 60,   detail: "Morgan Stanley Special Award" },
    { id: "econ", label: "Economics",            deg: 120,  detail: "MSc International Economy & Business" },
    { id: "pol",  label: "Political Science",    deg: 180,  detail: "BA, Corvinus" },
    { id: "dip",  label: "Diplomacy",            deg: 240,  detail: "U.S. Embassy Youth Council" },
    { id: "biz",  label: "Entrepreneurship",     deg: 300,  detail: "CDL Berlin / Danube Cup" }
  ];
  let nodes = [], particles = [];
  function placeNodes(){
    const cx = W/2, cy = H/2;
    const rad = Math.min(W, H) * (W < 900 ? 0.26 : 0.34);
    nodes = disc.map((d, i)=>{
      const a = (d.deg - 90) * Math.PI/180;
      return {
        id: d.id, label: d.label, detail: d.detail,
        x: cx + Math.cos(a)*rad,
        y: cy + Math.sin(a)*rad,
        ax: cx + Math.cos(a)*rad,
        ay: cy + Math.sin(a)*rad,
        a, vx:0, vy:0
      };
    });
    // ambient particles
    particles = Array.from({length:90}, ()=>({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*0.18, vy:(Math.random()-.5)*0.18,
      r: Math.random()*1.4 + 0.3, o: Math.random()*0.6 + 0.1
    }));
    placeLabels();
  }
  // place HTML labels next to nodes
  function placeLabels(){
    // remove old
    hero.querySelectorAll('.nodelabel').forEach(n=>n.remove());
    nodes.forEach(n=>{
      const lab = document.createElement('div');
      lab.className = 'nodelabel';
      const cx=W/2, cy=H/2;
      const dx = n.ax-cx, dy = n.ay-cy;
      const len = Math.hypot(dx, dy);
      const ox = dx/len * 30; // push outward
      const oy = dy/len * 30;
      lab.style.left = (n.ax + ox) + 'px';
      lab.style.top  = (n.ay + oy) + 'px';
      // detail lookup
      const d = disc.find(d => d.id===n.id);
      lab.innerHTML = d.label + '<small>'+ d.detail +'</small>';
      hero.appendChild(lab);
    });
  }
  resize();
  window.addEventListener('resize', resize);

  // mouse pulls nodes slightly
  let hmx = -9999, hmy = -9999;
  hero.addEventListener('mousemove', e=>{
    const r = hero.getBoundingClientRect();
    hmx = e.clientX - r.left;
    hmy = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', ()=>{ hmx=-9999; hmy=-9999; });

  // The loop runs only while the hero is on screen and the tab is visible.
  // t advances per drawn frame, so a paused loop resumes exactly where it stopped.
  let t=0;
  let drawId = 0;          // pending frame id, 0 while the loop is stopped
  let heroInView = true;   // updated by the observer below
  function canDraw(){ return heroInView && !document.hidden; }
  function startDraw(){
    if(!drawId && canDraw()) drawId = requestAnimationFrame(draw);
  }
  function draw(){
    drawId = 0;
    if(!canDraw()) return;
    t += 0.008;
    ctx.clearRect(0, 0, W, H);

    // ambient particles
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
      ctx.fillStyle = `rgba(168, 184, 255, ${p.o*0.5})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    });

    // node motion: gentle orbit + mouse repulsion-attraction
    nodes.forEach((n, i)=>{
      const breathe = Math.sin(t + i)*6;
      let tx = n.ax + Math.cos(t*0.3 + i)*8;
      let ty = n.ay + Math.sin(t*0.4 + i)*8 + breathe;

      // pull toward mouse if near
      const dx = hmx - n.x, dy = hmy - n.y;
      const dist = Math.hypot(dx, dy);
      if(dist < 220 && hmx>=0){
        const f = (220-dist)/220 * 0.05;
        tx += dx * f;
        ty += dy * f;
      }
      n.x += (tx - n.x)*0.06;
      n.y += (ty - n.y)*0.06;
    });

    // edges: connect every pair, opacity by distance, with traveling pulses
    if(!accentColor) accentColor = getCSS('--accent') || '#1f4ed8';
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i], b=nodes[j];
        const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx, dy);
        const op = Math.max(0.04, 0.18 - d/2200);
        ctx.strokeStyle = `rgba(168, 184, 255, ${op})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        // a moving pulse along the line
        const phase = ((t*0.5 + (i*0.13 + j*0.07)) % 1);
        const px = a.x + dx*phase;
        const py = a.y + dy*phase;
        ctx.fillStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(px, py, 1.4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // nodes
    nodes.forEach((n, i)=>{
      // halo
      const grd = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, 32);
      grd.addColorStop(0, 'rgba(168, 184, 255, 0.5)');
      grd.addColorStop(1, 'rgba(168, 184, 255, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(n.x, n.y, 32, 0, Math.PI*2); ctx.fill();
      // ring
      ctx.strokeStyle = 'rgba(241, 236, 221, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, Math.PI*2); ctx.stroke();
      // dot
      ctx.fillStyle = '#f1ecdd';
      ctx.beginPath(); ctx.arc(n.x, n.y, 3.2, 0, Math.PI*2); ctx.fill();
    });

    // re-position labels
    const labels = hero.querySelectorAll('.nodelabel');
    labels.forEach((lab, i)=>{
      const n = nodes[i]; if(!n) return;
      const cx=W/2, cy=H/2;
      const dx = n.x-cx, dy = n.y-cy;
      const len = Math.max(1, Math.hypot(dx, dy));
      const ox = dx/len * 40, oy = dy/len * 40;
      lab.style.left = (n.x + ox) + 'px';
      lab.style.top  = (n.y + oy) + 'px';
    });

    drawId = requestAnimationFrame(draw);
  }
  function getCSS(v){
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }
  // 200px margin: drawing resumes just before the hero scrolls back into view
  new IntersectionObserver(entries => {
    heroInView = entries[entries.length - 1].isIntersecting;
    startDraw();
  }, {rootMargin: '200px 0px'}).observe(hero);
  document.addEventListener('visibilitychange', startDraw);
  startDraw();

})();
