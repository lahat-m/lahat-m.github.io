const EMAIL = 'lahatm.apach@gmail.com';
const GH_USER = 'lahat-m';

/* Repos already shown as featured cards, left out of the open source list. */
const HIDDEN_REPOS = new Set([GH_USER, 'konexio-online-bank']);

/* Fallback repo list, used if the GitHub API is unreachable. */
const FALLBACK_REPOS = [
  { name: 'serv-kun', description: 'Linux provisioning tool for Spring Boot deployments', language: 'Go', stargazers_count: 1, html_url: 'https://github.com/lahat-m/serv-kun', pushed_at: '2026-08-17' },
  { name: 'digital-muolana', description: 'AI chatbot for civic education on the laws of South Sudan', language: 'Java', stargazers_count: 0, html_url: 'https://github.com/lahat-m/digital-muolana', pushed_at: '2026-08-16' },
  { name: 'Zombie-Survival-Platformer', description: 'A 2D survival platformer game', language: 'Python', stargazers_count: 0, html_url: 'https://github.com/lahat-m/Zombie-Survival-Platformer', pushed_at: '2026-01-24' },
  { name: 'spring-modulith-demo-app', description: 'Exploring modular monoliths with Spring Modulith', language: 'Java', stargazers_count: 0, html_url: 'https://github.com/lahat-m/spring-modulith-demo-app', pushed_at: '2025-12-27' },
];
/* Nicer descriptions for repos that have none on GitHub. */
const DESCRIPTIONS = Object.fromEntries(FALLBACK_REPOS.map(r => [r.name, r.description]));

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

$('year').textContent = new Date().getFullYear();

/* ---------- Toast + copy email ---------- */
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}
$('copy-email').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(EMAIL); toast('Copied ' + EMAIL); }
  catch { location.href = 'mailto:' + EMAIL; }
});

/* ---------- Theme toggle ---------- */
const root = document.documentElement;
try { const saved = localStorage.getItem('theme'); if (saved) root.dataset.theme = saved; } catch {}
$('theme-toggle').addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
});

/* ---------- Dithered portrait ---------- */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const PALETTE = [[30, 42, 12], [72, 94, 32], [138, 166, 84], [206, 225, 160]];
const srcImg = new Image();
srcImg.crossOrigin = 'anonymous';
srcImg.onload = drawAvatar;
srcImg.src = 'https://avatars.githubusercontent.com/u/67752087?v=4&s=460';

function drawAvatar() {
  const canvas = $('avatar');
  const W = 200, H = 125;                       // matches the 16:10 frame
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const s = Math.max(W / srcImg.naturalWidth, H / srcImg.naturalHeight);
  const dw = srcImg.naturalWidth * s, dh = srcImg.naturalHeight * s;
  ctx.drawImage(srcImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
  let data;
  try { data = ctx.getImageData(0, 0, W, H); } catch { return; } // tainted: keep CSS-tinted fallback
  const px = data.data, n = PALETTE.length - 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    const threshold = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
    const [r, g, b] = PALETTE[Math.min(n, Math.floor(lum * n + threshold))];
    px[i] = r; px[i + 1] = g; px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  canvas.parentElement.classList.add('dithered');
}

/* ---------- Repos ---------- */
function renderRepos(list) {
  $('repos').innerHTML = list.map(r => {
    const date = new Date(r.pushed_at).toLocaleDateString('en', { month: 'short', year: 'numeric' });
    const lang = r.language ? `<span><i class="dot" data-lang="${esc(r.language)}"></i>${esc(r.language)}</span>` : '';
    const desc = r.description || DESCRIPTIONS[r.name] || '';
    return `<li><a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
      <span class="name">${esc(r.name)}</span>
      <span class="info">${lang}<span>★ ${r.stargazers_count}</span><span>${date}</span></span>
      ${desc ? `<span class="desc">${esc(desc)}</span>` : ''}
    </a></li>`;
  }).join('');
}
renderRepos(FALLBACK_REPOS);
fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`)
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(list => {
    const own = list.filter(r => !r.fork && !HIDDEN_REPOS.has(r.name)).slice(0, 6);
    if (own.length) renderRepos(own);
  })
  .catch(() => {});
