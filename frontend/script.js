/* ═══════════════════════════════════════════
   SecureCheck — script.js  (shared all pages)
   ═══════════════════════════════════════════ */

// ── SIDEBAR COLLAPSE ─────────────────────────
const sidebar     = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const collapseBtn = document.getElementById('collapseBtn');

// Restore collapse state from localStorage
const COLLAPSED_KEY = 'securecheck_sidebar_collapsed';

function applyCollapse(collapsed) {
  if (!sidebar) return;
  if (collapsed) {
    sidebar.classList.add('collapsed');
    mainContent && mainContent.classList.add('shifted');
  } else {
    sidebar.classList.remove('collapsed');
    mainContent && mainContent.classList.remove('shifted');
  }
}

// On load — restore saved state
const savedCollapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
applyCollapse(savedCollapsed);

if (collapseBtn) {
  collapseBtn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.contains('collapsed');
    applyCollapse(!isCollapsed);
    localStorage.setItem(COLLAPSED_KEY, String(!isCollapsed));
  });
}

// ── SCAN BUTTON (index.html) ─────────────────
const scanBtn  = document.getElementById('scanBtn');
const urlInput = document.getElementById('urlInput');
const urlBar   = document.getElementById('urlBar');
const scanCountEl = document.getElementById('scanCount');

let scanning    = false;
let liveCounter = 4821;

function formatNum(n) { return n.toLocaleString(); }

function setScanCount(n) {
  liveCounter = n;
  if (scanCountEl) scanCountEl.textContent = formatNum(n);
}

function runScan() {
  if (!scanBtn || scanning) return;

  const url = urlInput ? urlInput.value.trim() : '';

  if (!url) {
    if (urlInput) urlInput.focus();
    if (urlBar) {
      urlBar.classList.add('error');
      setTimeout(() => urlBar.classList.remove('error'), 1500);
    }
    return;
  }

  scanning = true;
  scanBtn.innerHTML = '<span class="scan-icon">⏳</span><span class="btn-text"> Scanning...</span>';
  scanBtn.classList.add('scanning');

  // Animate counter
  const orig = liveCounter;
  let tick = 0;
  const iv = setInterval(() => {
    tick++;
    setScanCount(orig + tick);
  }, 350);

  setTimeout(() => {
    clearInterval(iv);
    setScanCount(orig + 1);

    scanBtn.innerHTML = '<span class="scan-icon">✅</span><span class="btn-text"> Done!</span>';
    scanBtn.classList.remove('scanning');
    scanBtn.classList.add('done');

    setTimeout(() => {
      scanBtn.innerHTML = '<span class="scan-icon">🔍</span><span class="btn-text"> Scan Now</span>';
      scanBtn.classList.remove('done');
      scanning = false;
    }, 2200);
  }, 2500);
}

if (scanBtn) {
  scanBtn.addEventListener('click', runScan);
}

if (urlInput) {
  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') runScan();
    if (urlBar) urlBar.classList.remove('error');
  });
}

// ── LIVE COUNTER TICK ────────────────────────
setInterval(() => {
  if (!scanning && Math.random() > 0.55) {
    setScanCount(liveCounter + 1);
  }
}, 9000);
