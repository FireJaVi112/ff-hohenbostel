// ── FF Hohenbostel – main.js ──────────────────────────────────────────────
// Lädt Einsätze und News aus den vom Build-Script erzeugten JSON-Dateien.
// Neue Einträge im CMS → Netlify deployed → JSON wird neu gebaut → Seite zeigt sie.

const BADGE = {
  brand:    { cls: 'badge-brand',    label: 'Brand' },
  hilfe:    { cls: 'badge-hilfe',    label: 'Hilfe' },
  ubung:    { cls: 'badge-ubung',    label: 'Übung' },
  sonstige: { cls: 'badge-sonstige', label: 'Sonst.' },
};
const MONTHS = ['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

// ── DATEN LADEN ────────────────────────────────────────────────────────────
async function loadEinsaetze() {
  try {
    const res = await fetch('/content/einsaetze.json?t=' + Date.now());
    if (!res.ok) throw new Error('not found');
    return await res.json();
  } catch {
    return [];
  }
}

async function loadNews() {
  try {
    const res = await fetch('/content/news.json?t=' + Date.now());
    if (!res.ok) throw new Error('not found');
    return await res.json();
  } catch {
    return [];
  }
}

// ── EINSATZ TABELLE ────────────────────────────────────────────────────────
function renderEinsatzTable(einsaetze, containerId, filters) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const filtered = einsaetze.filter(e => filters.has(e.typ));

  if (!filtered.length) {
    el.innerHTML = '<div class="einsatz-empty">Keine Einträge für die gewählten Filter.</div>';
    return;
  }

  // Gruppieren nach Monat/Jahr
  const groups = {};
  filtered.forEach(e => {
    const parts = String(e.datum || '').split('.');
    const key = parts.length >= 3 ? `${parts[1]}.${parts[2]}` : 'Unbekannt';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  // Neueste zuerst
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const toNum = k => {
      const [m, y] = k.split('.');
      return parseInt(y || 0) * 100 + parseInt(m || 0);
    };
    return toNum(b) - toNum(a);
  });

  let html = '';
  sortedKeys.forEach(key => {
    const [m, y] = key.split('.');
    const label = `${MONTHS[parseInt(m)] || key} ${y ? '20' + y.slice(-2) : ''}`;
    html += `<div class="einsatz-group-head">${label}</div>`;
    groups[key].forEach(e => {
      const b = BADGE[e.typ] || BADGE.sonstige;
      const title = e.link
        ? `<a href="${e.link}" target="_blank" rel="noopener">${e.title || '–'}</a>`
        : (e.title || '–');
      html += `
        <div class="einsatz-row">
          <div class="e-nr">${e.nummer || '–'}</div>
          <div class="e-date"><strong>${e.datum || '–'}</strong><span>${e.tag || ''}</span></div>
          <div class="e-time">${e.zeit || '–'} Uhr</div>
          <div class="e-title">${title}</div>
          <span class="badge ${b.cls}">${b.label}</span>
        </div>`;
    });
  });

  el.innerHTML = html;
}

// ── EINSATZ STATISTIKEN ────────────────────────────────────────────────────
function renderEinsatzStats(einsaetze, containerId, filters) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const filtered = einsaetze.filter(e => filters.has(e.typ));
  const counts = { brand: 0, hilfe: 0, ubung: 0, sonstige: 0 };
  einsaetze.forEach(e => { if (counts[e.typ] !== undefined) counts[e.typ]++; });

  el.innerHTML = `
    <div class="e-stat"><strong>${filtered.length}</strong><span>Einsätze</span></div>
    <div class="e-stat"><strong style="color:#CC0000">${counts.brand}</strong><span>Brände</span></div>
    <div class="e-stat"><strong style="color:#1a56db">${counts.hilfe}</strong><span>Hilfeleistungen</span></div>
    <div class="e-stat"><strong style="color:#2e7d32">${counts.ubung}</strong><span>Übungen</span></div>
    <div class="e-stat"><strong style="color:#555">${counts.sonstige}</strong><span>Sonstige</span></div>
  `;
}

// ── NEWS CARDS ─────────────────────────────────────────────────────────────
function renderNewsCards(news, containerId, limit) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const items = limit ? news.slice(0, limit) : news;

  if (!items.length) {
    el.innerHTML = '<div class="news-empty">Noch keine Beiträge vorhanden.</div>';
    return;
  }

  el.innerHTML = items.map(item => `
    <div class="news-card">
      ${item.bild ? `<img class="news-card-img" src="${item.bild}" alt="${item.title || ''}">` : ''}
      <div class="news-card-body">
        <span class="news-card-tag">${item.tag || 'Aktuelles'}</span>
        <div class="news-card-title">${item.title || '–'}</div>
        <div class="news-card-text">${(item.body || '').replace(/[#*`_]/g, '').substring(0, 150)}${(item.body || '').length > 150 ? '…' : ''}</div>
        <div class="news-card-date">${item.datum || ''}</div>
      </div>
    </div>
  `).join('');
}

// ── NAV AKTIV MARKIEREN ────────────────────────────────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

// ── HAMBURGER MENÜ ─────────────────────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    links.classList.toggle('open');
  });
  // Schließen bei Klick auf Link
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

// ── SCROLL REVEAL ──────────────────────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-l, .reveal-r');
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ── INIT ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initHamburger();
  initReveal();
});
