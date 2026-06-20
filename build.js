// build.js – läuft auf Netlify bei jedem Deploy automatisch
// Liest alle .md Dateien aus content/ und erstellt JSON-Dateien für die Webseite

const fs = require('fs');
const path = require('path');

// Front Matter Parser
function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: text.trim() };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // Anführungszeichen entfernen
    val = val.replace(/^["']|["']$/g, '');
    // Zahlen konvertieren
    if (!isNaN(val) && val !== '') val = Number(val);
    if (key) meta[key] = val;
  });

  const body = text.slice(match[0].length).trim();
  return { meta, body };
}

// Alle .md Dateien in einem Ordner lesen
function readMarkdownDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      const { meta, body } = parseFrontMatter(text);
      return { ...meta, body, _file: f };
    });
}

// Einsätze einlesen & sortieren
const einsaetze = readMarkdownDir('./content/einsaetze')
  .sort((a, b) => (Number(b.nummer) || 0) - (Number(a.nummer) || 0));

// News einlesen & nach Datum sortieren (neueste zuerst)
const news = readMarkdownDir('./content/news')
  .sort((a, b) => {
    // Datum Format DD.MM.YYYY → sortierbar machen
    const parseDate = d => {
      if (!d) return 0;
      const parts = String(d).split('.');
      if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      return 0;
    };
    return parseDate(b.datum) - parseDate(a.datum);
  });

// JSON Dateien schreiben
fs.writeFileSync('./content/einsaetze.json', JSON.stringify(einsaetze, null, 2));
fs.writeFileSync('./content/news.json', JSON.stringify(news, null, 2));

console.log(`✅ Build fertig:`);
console.log(`   ${einsaetze.length} Einsätze → content/einsaetze.json`);
console.log(`   ${news.length} News → content/news.json`);
