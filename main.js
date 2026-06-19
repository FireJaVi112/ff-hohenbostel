// ── SHARED JS für alle Seiten ────────────────────────────────────────────

// Aktiven Nav-Link markieren
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

// Hamburger Menü
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;
  btn.addEventListener('click', () => links.classList.toggle('open'));
}

// Scroll Reveal
function initReveal() {
  const els = document.querySelectorAll('.reveal,.reveal-l,.reveal-r');
  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// Front Matter Parser
function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  m[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^"|"$/g, '');
    if (key) meta[key] = val;
  });
  return { meta, body: text.slice(m[0].length).trim() };
}

// Einsatz Badge
const BADGE = {
  brand:    { cls:'badge-brand',    label:'Brand' },
  hilfe:    { cls:'badge-hilfe',    label:'Hilfe' },
  ubung:    { cls:'badge-ubung',    label:'Übung' },
  sonstige: { cls:'badge-sonstige', label:'Sonst.' },
};
const MONTHS = ['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

// Einsätze Dateien – hier neue .md Dateien eintragen
const EINSATZ_FILES = [
  '/content/einsaetze/2026-06-19-verkehrsunfall-b65.md',
];

// News Dateien – hier neue .md Dateien eintragen
const NEWS_FILES = [
  '/content/news/2026-06-19-willkommen.md',
];

// Einsätze laden
async function loadEinsaetze() {
  const results = await Promise.all(
    EINSATZ_FILES.map(f => fetch(f).then(r => r.ok ? r.text() : null).catch(() => null))
  );
  return results.filter(Boolean).map(t => parseFrontMatter(t).meta)
    .sort((a, b) => parseInt(b.nummer || 0) - parseInt(a.nummer || 0));
}

// News laden
async function loadNews() {
  const results = await Promise.all(
    NEWS_FILES.map(f => fetch(f).then(r => r.ok ? r.text() : null).catch(() => null))
  );
  return results.filter(Boolean).map(t => parseFrontMatter(t));
}

// Einsatz Tabelle rendern
function renderEinsatzTable(einsaetze, containerId, filters) {
  const filtered = einsaetze.filter(e => filters.has(e.typ));
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!filtered.length) {
    el.innerHTML = '<div class="einsatz-empty">Keine Einträge für die gewählten Filter.</div>';
    return;
  }

  const groups = {};
  filtered.forEach(e => {
    const parts = (e.datum || '').split('.');
    const key = parts.length >= 3 ? `${parts[1]}.${parts[2]}` : '–';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });

  let html = '';
  Object.keys(groups).forEach(key => {
    const [m, y] = key.split('.');
    html += `<div class="einsatz-group-head">${MONTHS[parseInt(m)] || key} ${y || ''}</div>`;
    groups[key].forEach(e => {
      const b = BADGE[e.typ] || BADGE.sonstige;
      const title = e.link
        ? `<a href="${e.link}" target="_blank">${e.title || '–'}</a>`
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

// Stats rendern
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
  `;
}

// News Cards rendern
function renderNewsCards(news, containerId, limit) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const items = limit ? news.slice(0, limit) : news;
  if (!items.length) {
    el.innerHTML = '<div class="news-empty">Keine Beiträge vorhanden.</div>';
    return;
  }
  el.innerHTML = items.map(({ meta, body }) => `
    <div class="news-card">
      ${meta.bild ? `<img class="news-card-img" src="${meta.bild}" alt="${meta.title || ''}">` : ''}
      <div class="news-card-body">
        <span class="news-card-tag">${meta.tag || 'Aktuelles'}</span>
        <div class="news-card-title">${meta.title || '–'}</div>
        <div class="news-card-text">${body.replace(/[#*`]/g, '').substring(0, 140)}${body.length > 140 ? '…' : ''}</div>
        <div class="news-card-date">${meta.datum || ''}</div>
      </div>
    </div>
  `).join('');
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initHamburger();
  initReveal();
});
