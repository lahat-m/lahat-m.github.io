const EMAIL = 'lahatm.apach@gmail.com';
const GH_USER = 'lahat-m';

/* Repos already shown as featured cards, left out of the open source list. */
const HIDDEN_REPOS = new Set([GH_USER, `${GH_USER}.github.io`, 'konexio-online-bank']);

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

/* ---------- Nav: highlight the section in view ---------- */
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href')));
function setActive(id) {
  for (const a of navLinks) {
    const on = a.getAttribute('href') === '#' + id;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  }
}
// The active section is the last one whose top has scrolled up to just below the sticky nav.
// At the very bottom of the page the last section wins, since it may be too short to get there.
function updateActive() {
  const line = document.querySelector('.nav').offsetHeight + 24;
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  let current = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s;
  setActive((atBottom ? sections.at(-1) : current).id);
}
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateActive(); ticking = false; });
}, { passive: true });
addEventListener('resize', updateActive);
updateActive();

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
