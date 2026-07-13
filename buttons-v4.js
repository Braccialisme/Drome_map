// buttons-v4.js — boutons EP-133 en sprite overlay (plaques "no_button_layout").
// Chaque bouton = sprite posé sur la plaque nue → vrai enfoncement + états on/off,
// zéro bouton baké qui dépasse. x,y = coin haut-gauche de la FACE VISIBLE.
// Face = décalée de (fx,fy) dans le canvas du sprite (marge transparente + ombre).
// fw/fh = dimensions RÉELLES de la face opaque (ombre asymétrique → ≠ canvas-2·offset)
window.BTN = {
  key:    { off:'assets/ui/mkey.png',   on:'assets/ui/mkey-on.png',   w:264, h:258, fx:9,  fy:9,  fw:159, fh:151, fs:27, lx:18, ly:16, la:'left'   },
  half:   { off:'assets/ui/mhalf.png',  on:'assets/ui/mhalf-on.png',  w:264, h:189, fx:9,  fy:9,  fw:158, fh:81,  fs:26, lx:0,  ly:0,  la:'center' },
  tab:    { off:'assets/ui/tab.png',    on:'assets/ui/tab-on.png',    w:265, h:175, fx:9,  fy:9,  fw:158, fh:67,  fs:22, lx:0,  ly:0,  la:'center', alt:'assets/ui/tab-white.png' },
  kind:   { off:'assets/ui/kind.png',   on:'assets/ui/kind-on.png',   w:321, h:115, fx:20, fy:20, fw:283, fh:77,  fs:23, lx:22, ly:0,  la:'left'   },
  search: { off:'assets/ui/search.png', on:'assets/ui/search.png',    w:321, h:115, fx:20, fy:20, fw:283, fh:77,  fs:0                             },
  dl:     { off:'assets/ui/dl.png',     on:'assets/ui/dl.png',        w:141, h:115, fx:20, fy:20, fw:103, fh:77,  fs:0                             },
  minmax: { off:'assets/ui/minmax.png', on:'assets/ui/minmax.png',    w:141, h:115, fx:20, fy:20, fw:103, fh:77,  fs:0                             },
};

// makeButton(host, opts) — opts: {type, x, y, label, on, onClick, press(bool), fs/lx/ly (override)}
// Retourne l'élément bouton. La face visible se pose exactement à (x,y).
window.makeButton = function (host, o) {
  const B = window.BTN[o.type], on = !!o.on;
  const b = document.createElement('button');
  b.className = 'v4btn' + (on ? ' on' : '');
  const faceW = B.fw, faceH = B.fh;
  Object.assign(b.style, {
    position: 'absolute', left: (o.x - B.fx) + 'px', top: (o.y - B.fy) + 'px',
    width: B.w + 'px', height: B.h + 'px', border: 0, padding: 0, cursor: 'pointer',
    background: `url('${on ? B.on : (o.alt && B.alt ? B.alt : B.off)}') 0 0/100% 100% no-repeat`,
    transition: 'transform .07s ease, filter .07s ease',
  });
  const fs = o.fs != null ? o.fs : B.fs;
  if (o.label && fs) {
    const l = document.createElement('span');
    const la = o.la || B.la, lx = o.lx != null ? o.lx : B.lx, ly = o.ly != null ? o.ly : B.ly;
    Object.assign(l.style, {
      position: 'absolute', pointerEvents: 'none', font: fs + "px VG5000,monospace",
      letterSpacing: '.01em', color: on ? '#fff' : '#ededed', whiteSpace: 'nowrap',
    });
    if (la === 'center') { l.style.left = B.fx + 'px'; l.style.top = B.fy + 'px';
      l.style.width = faceW + 'px'; l.style.height = faceH + 'px';
      l.style.display = 'flex'; l.style.alignItems = 'center'; l.style.justifyContent = 'center'; }
    else if (la === 'left' && o.type === 'kind') { l.style.left = (B.fx + lx) + 'px';
      l.style.top = B.fy + 'px'; l.style.height = faceH + 'px'; l.style.display = 'flex'; l.style.alignItems = 'center'; }
    else { l.style.left = (B.fx + lx) + 'px'; l.style.top = (B.fy + ly) + 'px'; }
    l.textContent = o.label;
    b.appendChild(l);
  }
  const sc = o.scale || 1;
  if (sc !== 1) b.style.transformOrigin = '0 0';
  const set = v => { b.style.transform = (v ? 'translateY(7px) ' : '') + `scale(${sc * (v ? .985 : 1)})`;
    b.style.filter = v ? 'brightness(.8) contrast(1.05)' : ''; };
  set(0);
  b.addEventListener('pointerdown', () => set(1));
  b.addEventListener('pointerup',   () => set(0));
  b.addEventListener('pointerleave',() => set(0));
  b.addEventListener('click', () => o.onClick && o.onClick());
  host.appendChild(b);
  return b;
};
