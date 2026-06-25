(function () {
  'use strict';

  let isDark = false;
  let busy   = false;

  const themeBtn = document.getElementById('theme');

  const MOON_SVG = `<svg class="moon" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><g fill="none" stroke="currentcolor" stroke-dasharray="4" stroke-dashoffset="4" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5"><animate id="a0" fill="freeze" attributeName="stroke-dashoffset" begin="0.7s;a0.begin+6s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="a0.begin+2s;a0.begin+4s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="a0.begin+1.2s;a0.begin+3.2s;a0.begin+5.2s" dur="0.4s" values="0;4"/><set fill="freeze" attributeName="d" begin="a0.begin+1.8s" to="M12 5h1.5M12 5h-1.5M12 5v1.5M12 5v-1.5"/><set fill="freeze" attributeName="d" begin="a0.begin+3.8s" to="M12 4h1.5M12 4h-1.5M12 4v1.5M12 4v-1.5"/><set fill="freeze" attributeName="d" begin="a0.begin+5.8s" to="M13 4h1.5M13 4h-1.5M13 4v1.5M13 4v-1.5"/></path><path d="M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5"><animate id="a1" fill="freeze" attributeName="stroke-dashoffset" begin="1.1s;a1.begin+6s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="a1.begin+2s;a1.begin+4s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="a1.begin+1.2s;a1.begin+3.2s;a1.begin+5.2s" dur="0.4s" values="0;4"/><set fill="freeze" attributeName="d" begin="a1.begin+1.8s" to="M17 11h1.5M17 11h-1.5M17 11v1.5M17 11v-1.5"/><set fill="freeze" attributeName="d" begin="a1.begin+3.8s" to="M18 12h1.5M18 12h-1.5M18 12v1.5M18 12v-1.5"/><set fill="freeze" attributeName="d" begin="a1.begin+5.8s" to="M19 11h1.5M19 11h-1.5M19 11v1.5M19 11v-1.5"/></path><path d="M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5"><animate id="a2" fill="freeze" attributeName="stroke-dashoffset" begin="2s;a2.begin+6s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="a2.begin+2s" dur="0.4s" values="4;0"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="a2.begin+1.2s;a2.begin+3.2s" dur="0.4s" values="0;4"/><set fill="freeze" attributeName="d" begin="a2.begin+1.8s" to="M20 5h1.5M20 5h-1.5M20 5v1.5M20 5v-1.5"/><set fill="freeze" attributeName="d" begin="a2.begin+5.8s" to="M19 4h1.5M19 4h-1.5M19 4v1.5M19 4v-1.5"/></path></g><path fill="none" stroke="currentcolor" stroke-dasharray="56" stroke-dashoffset="56" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6 C7 12.08 11.92 17 18 17 C18.53 17 19.05 16.96 19.56 16.89 C17.95 19.36 15.17 21 12 21 C7.03 21 3 16.97 3 12 C3 8.83 4.64 6.05 7.11 4.44 C7.04 4.95 7 5.47 7 6 Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="56;0"/></path></svg>`;

  const SUN_SVG = `<svg class="sun" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24"><g fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="36" stroke-dashoffset="36" d="M12 7c2.76 0 5 2.24 5 5c0 2.76 -2.24 5 -5 5c-2.76 0 -5 -2.24 -5 -5c0 -2.76 2.24 -5 5 -5"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="36;0"/></path><g><path stroke-dasharray="2" stroke-dashoffset="2" d="M12 19v1M19 12h1M12 5v-1M5 12h-1"><animate fill="freeze" attributeName="d" begin="0.5s" dur="0.2s" values="M12 19v1M19 12h1M12 5v-1M5 12h-1;M12 21v1M21 12h1M12 3v-1M3 12h-1"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="2;0"/></path><path stroke-dasharray="2" stroke-dashoffset="2" d="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5"><animate fill="freeze" attributeName="d" begin="0.7s" dur="0.2s" values="M17 17l0.5 0.5M17 7l0.5 -0.5M7 7l-0.5 -0.5M7 17l-0.5 0.5;M18.5 18.5l0.5 0.5M18.5 5.5l0.5 -0.5M5.5 5.5l-0.5 -0.5M5.5 18.5l-0.5 0.5"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="2;0"/></path><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></g></g></svg>`;

  const style = document.createElement('style');
  style.textContent = `
    .no-tr, .no-tr * { transition: none !important; }

    .to-dark::view-transition-old(root) { z-index: 1; animation: none; }
    .to-dark::view-transition-new(root) { z-index: 2; animation: vt-expand var(--vt-dur,600ms) cubic-bezier(.4,0,.2,1) forwards; }

    .to-light::view-transition-old(root) { z-index: 2; animation: vt-shrink var(--vt-dur,600ms) cubic-bezier(.4,0,.2,1) forwards; }
    .to-light::view-transition-new(root) { z-index: 1; animation: none; }

    @keyframes vt-expand {
      from { clip-path: var(--vt-small); }
      to   { clip-path: var(--vt-big); }
    }
    @keyframes vt-shrink {
      from { clip-path: var(--vt-big); }
      to   { clip-path: var(--vt-small); }
    }

    @media (prefers-reduced-motion: reduce) {
      .to-dark::view-transition-new(root),
      .to-light::view-transition-old(root) { animation-duration: 1ms !important; }
    }
  `;
  document.head.appendChild(style);

  function applyTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    const iconWrap = themeBtn?.querySelector('.icon-wrap');
    const btnText  = themeBtn?.querySelector('.btn-text');
    if (iconWrap) iconWrap.innerHTML = dark ? SUN_SVG : MOON_SVG;
    if (btnText)  btnText.textContent = dark ? 'Light mode' : 'Dark mode';
  }

  /*
   * THE KEY FIX:
   *
   * Instead of getBoundingClientRect() (which has viewport-system mismatches
   * on mobile), we get the center of the icon using the pointer/touch event
   * coordinates directly — clientX/clientY from the actual user interaction.
   *
   * clientX/clientY from a pointer event are ALWAYS in visual-viewport space.
   * clip-path on ::view-transition and position:fixed overlays are ALSO in
   * visual-viewport space. So they match perfectly on every browser/device
   * with zero correction needed.
   *
   * For keyboard/programmatic triggers (no event coords), we fall back to
   * getBoundingClientRect() with visualViewport correction.
   */
  function getOrigin(e) {
    // Touch event
    if (e.touches && e.touches.length > 0) {
      return { x: Math.round(e.touches[0].clientX), y: Math.round(e.touches[0].clientY) };
    }
    // Pointer / mouse event with real coordinates (not synthetic 0,0)
    if (e.clientX !== undefined && (e.clientX !== 0 || e.clientY !== 0)) {
      return { x: Math.round(e.clientX), y: Math.round(e.clientY) };
    }
    // Keyboard / programmatic fallback → use SVG element center
    const svg = themeBtn?.querySelector('svg');
    const el  = svg || themeBtn;
    if (!el) return { x: Math.round(window.innerWidth / 2), y: 40 };
    const r   = el.getBoundingClientRect();
    let cx = r.left + r.width  / 2;
    let cy = r.top  + r.height / 2;
    // Only apply visualViewport correction in the fallback path
    if (window.visualViewport) {
      cx += window.visualViewport.offsetLeft;
      cy += window.visualViewport.offsetTop;
    }
    return { x: Math.round(cx), y: Math.round(cy) };
  }

  function maxR(x, y) {
    const vvw = window.visualViewport ? window.visualViewport.width  : window.innerWidth;
    const vvh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    return Math.ceil(Math.hypot(Math.max(x, vvw - x), Math.max(y, vvh - y)));
  }

  async function toggle(e) {
    if (busy) return;
    busy = true;

    const { x: cx, y: cy } = getOrigin(e);
    const r        = maxR(cx, cy);
    const dur      = 600;
    const nextDark = !isDark;

    const small = `circle(0px at ${cx}px ${cy}px)`;
    const big   = `circle(${r}px at ${cx}px ${cy}px)`;

    if (document.startViewTransition) {
      const root = document.documentElement;
      root.style.setProperty('--vt-small', small);
      root.style.setProperty('--vt-big',   big);
      root.style.setProperty('--vt-dur',   dur + 'ms');
      root.classList.add(nextDark ? 'to-dark' : 'to-light');

      document.startViewTransition(() => {
        isDark = nextDark;
        applyTheme(isDark);
      }).finished.finally(() => {
        root.classList.remove('to-dark', 'to-light');
        busy = false;
      });
      return;
    }

    // Fallback overlay
    document.body.classList.add('no-tr');

    if (nextDark) {
      const ov = document.createElement('div');
      ov.style.cssText = `position:fixed;inset:0;z-index:9999;pointer-events:none;background:#111119;clip-path:${small};will-change:clip-path;`;
      document.body.appendChild(ov);
      isDark = true;
      applyTheme(true);
      document.body.classList.remove('no-tr');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ov.style.transition = `clip-path ${dur}ms cubic-bezier(.4,0,.2,1)`;
        ov.style.clipPath   = big;
        ov.addEventListener('transitionend', () => { ov.remove(); busy = false; }, { once: true });
      }));
    } else {
      isDark = false;
      applyTheme(false);
      document.body.classList.remove('no-tr');
      const ov = document.createElement('div');
      ov.style.cssText = `position:fixed;inset:0;z-index:9999;pointer-events:none;background:#111119;clip-path:${big};will-change:clip-path;`;
      document.body.appendChild(ov);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ov.style.transition = `clip-path ${dur}ms cubic-bezier(.4,0,.2,1)`;
        ov.style.clipPath   = small;
        ov.addEventListener('transitionend', () => { ov.remove(); busy = false; }, { once: true });
      }));
    }
  }

  if (themeBtn) themeBtn.addEventListener('click', toggle);

  applyTheme(false);
})();
