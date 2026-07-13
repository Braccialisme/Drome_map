// Moteur générique panneaux v4 — plaque Figma en fond + overlay vivant.
// Config par panneau : window.PANEL = { plate, w, h, mode, slots, halves }.
// slots  : { id, label, sub, x, y }         (touche ~157×150, coin haut-gauche)
// halves : { id, label, cx, cy, on }         (demi-key : label top-centré)
// mode   : 'single' (basemap) | 'toggle' (couches)
(function () {
  const P = window.PANEL;
  const KW = P.keyW || 157, KH = P.keyH || 150;

  const style = document.createElement('style');
  style.textContent = `
    @font-face { font-family:'VG5000'; font-display:swap;
      src:url('fonts/VG5000-Regular_web.ttf') format('truetype'),
          url('https://cdn.velvetyne.fr/fonts/vg5000/VG5000-Regular.woff2') format('woff2'); }
    body { margin:0; background:#222; padding:20px; box-sizing:border-box; font-family:'VG5000',monospace; }
    .panel { position:relative; width:${P.w}px; height:${P.h}px;
      background:url('${P.plate}') 0 0 / ${P.w}px ${P.h}px no-repeat;
      transform:scale(var(--s,1)); transform-origin:top left; }
    .klabel { position:absolute; font-size:27px; color:#ededed; letter-spacing:.01em; pointer-events:none; }
    .klabel.on { color:#fff; }
    .hk { position:absolute; font-size:26px; color:#e6e6e2; transform:translateX(-50%); pointer-events:none; }
    .hk.on { color:#fff; }
    .led { position:absolute; width:20px; height:20px;
      background:url('assets/ui/led-off.png') center/contain no-repeat; pointer-events:none; }
    .led.on { background-image:url('assets/ui/led-on.png'); }
    .ksub { position:absolute; font-size:17px; color:#8a877c; text-transform:uppercase;
      letter-spacing:.12em; pointer-events:none; }
    .hit { position:absolute; background:transparent; border:0; cursor:pointer; padding:0; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'panel'; panel.id = 'panel';
  document.body.appendChild(panel);

  // état
  const on = {};
  (P.slots || []).forEach(s => on[s.id] = !!s.on);
  (P.halves || []).forEach(h => on[h.id] = !!h.on);
  let selected = (P.slots || []).find(s => s.on)?.id || (P.slots || [])[0]?.id;

  const el = (c, s, t) => { const d = document.createElement('div'); d.className = c; Object.assign(d.style, s); if (t != null) d.textContent = t; return d; };

  function isOn(s) { return P.mode === 'single' ? s.id === selected : !!on[s.id]; }

  function render() {
    panel.innerHTML = '';
    // top-bar partagée : pill min/max + recherche (sprites)
    makeButton(panel, { type: 'minmax', x: 79, y: 120, onClick: () => P.onMinmax && P.onMinmax() });
    makeButton(panel, { type: 'search', x: 249, y: 118, onClick: () => P.onSearch && P.onSearch() });
    // demi-keys (sprite small_button) — x,y = coin face, ou converti depuis cx,cy
    (P.halves || []).forEach(h => {
      const hx = h.x != null ? h.x : (h.cx - 79), hy = h.y != null ? h.y : (h.cy - 40);
      makeButton(panel, { type: 'half', x: hx, y: hy, label: h.label, on: !!on[h.id],
        onClick: () => { on[h.id] = !on[h.id]; render(); P.onHalf && P.onHalf(h.id, on[h.id]); } });
    });
    // touches (sprite main_button) + LED/info dessous (ne s'enfoncent pas)
    (P.slots || []).forEach(s => {
      const o = isOn(s);
      makeButton(panel, { type: 'key', x: s.x, y: s.y, label: s.label, on: o,
        onClick: () => { if (P.mode === 'single') selected = s.id; else on[s.id] = !on[s.id];
          render(); P.onSlot && P.onSlot(s.id, isOn(s)); } });
      panel.appendChild(el('led' + (o ? ' on' : ''), { left: (s.x + 2) + 'px', top: (s.y + KH + 14) + 'px' }));
      if (s.sub) panel.appendChild(el('ksub', { left: (s.x + 34) + 'px', top: (s.y + KH + 17) + 'px' }, s.sub));
    });
    P.extra && P.extra(panel, el);
  }
  render();

  const fit = () => panel.style.setProperty('--s',
    Math.min(1, (innerWidth - 40) / P.w, (innerHeight - 40) / P.h).toFixed(3));
  addEventListener('resize', fit); fit();
  window._panelRender = render;
})();
