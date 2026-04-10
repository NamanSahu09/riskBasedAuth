/* ═══════════════════════════════════════════
   SecureCheck — FINAL script.js
   (ML + Auth + UI Integrated)
   ═══════════════════════════════════════════ */

// ── SIDEBAR ─────────────────────────
const sidebar     = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const collapseBtn = document.getElementById('collapseBtn');

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

const savedCollapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
applyCollapse(savedCollapsed);

if (collapseBtn) {
  collapseBtn.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.contains('collapsed');
    applyCollapse(!isCollapsed);
    localStorage.setItem(COLLAPSED_KEY, String(!isCollapsed));
  });
}

// ── SCAN SYSTEM (ML API) ─────────────────────────
const scanBtn     = document.getElementById('scanBtn');
const urlInput    = document.getElementById('urlInput');
const urlBar      = document.getElementById('urlBar');
const scanCountEl = document.getElementById('scanCount');

let scanning = false;
let liveCounter = 4821;

function formatNum(n) { return n.toLocaleString(); }

function setScanCount(n) {
  liveCounter = n;
  if (scanCountEl) scanCountEl.textContent = formatNum(n);
}

// SHOW RESULT UI
function showResult(url, data) {
  const scanList = document.querySelector('.scan-list');
  if (!scanList) return;

  let riskClass = 'secure';
  if (data.risk_level === 'HIGH') riskClass = 'danger';
  else if (data.risk_level === 'MEDIUM') riskClass = 'moderate';

  const row = document.createElement('div');
  row.className = 'scan-row';

  row.innerHTML = `
    <div class="scan-shield ${riskClass}">🛡️</div>
    <span class="scan-url">${url}</span>
    <span class="scan-status ${riskClass}">${data.risk_level}</span>
    <span class="scan-score ${riskClass}">${Math.round(data.risk_score)}/100</span>
    <a class="scan-link" href="${url}" target="_blank">↗</a>
  `;

  scanList.prepend(row);
}

console.log("INPUT VALUE:", urlInput);
console.log("URL VALUE:", url);
// MAIN SCAN FUNCTION
async function runScan() {
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
  scanBtn.innerHTML = '⏳ Scanning...';

  try {
    const res = await fetch('https://risk-ml.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })   // ✅ ONLY URL
    });

    const data = await res.json();
    console.log("ML DATA:", data);

    // Error handling
    if (!data.risk_level) {
      alert("❌ ML Error: " + JSON.stringify(data));
      return;
    }

    // Show result
    showResult(url, data);

    // Alert for dangerous
    if (data.risk_level === "HIGH") {
      alert(
        "⚠ Unsafe Website!\n\n" +
        "Risk Level: " + data.risk_level +
        "\nRisk Score: " + Math.round(data.risk_score)
      );
    }

    scanBtn.innerHTML = '✅ Done!';

  } catch (err) {
    console.error(err);
    alert("❌ API Error / ML Service Down");
    scanBtn.innerHTML = 'Error';
  }

  setTimeout(() => {
    scanBtn.innerHTML = '🔍 Scan Now';
    scanning = false;
  }, 2000);
}

if (scanBtn) scanBtn.addEventListener('click', runScan);

if (urlInput) {
  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') runScan();
    if (urlBar) urlBar.classList.remove('error');
  });
}

// ── LIVE COUNTER ─────────────────────────
setInterval(() => {
  if (!scanning && Math.random() > 0.5) {
    setScanCount(liveCounter + 1);
  }
}, 8000);


// ═══════════════════════════════════════════
// 🔐 AUTH SYSTEM (PHP BACKEND)
// ═══════════════════════════════════════════

const API_BASE = '../backend/public/';

// SESSION
function getSession() {
  return localStorage.getItem('securecheck_session');
}
function setSession(user) {
  localStorage.setItem('securecheck_session', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('securecheck_session');
}

// UI
const loginBtn   = document.getElementById('loginBtn');
const userPill   = document.getElementById('userPill');
const userNameEl = document.getElementById('userName');
const signOutBtn = document.getElementById('signOutBtn');

function renderAuthState() {
  const session = getSession();

  if (session) {
    const user = JSON.parse(session);
    if (loginBtn) loginBtn.style.display = 'none';
    if (userPill) userPill.style.display = 'flex';
    if (userNameEl) userNameEl.textContent = user.username;
  } else {
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userPill) userPill.style.display = 'none';
  }
}

// LOGOUT
if (signOutBtn) {
  signOutBtn.addEventListener('click', async () => {
    try {
      await fetch(API_BASE + 'logout.php', { method: 'POST' });
    } catch (e) {}

    clearSession();
    renderAuthState();
    alert("Logged out");
  });
}

// LOGIN
const loginSubmit = document.getElementById('loginSubmit');
const loginEmail  = document.getElementById('loginEmail');
const loginPass   = document.getElementById('loginPassword');

if (loginSubmit) {
  loginSubmit.addEventListener('click', async () => {

    const username = loginEmail.value;
    const password = loginPass.value;

    try {
      const res = await fetch(API_BASE + 'login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Login failed");
        return;
      }

      setSession(data.user);
      renderAuthState();
      alert("Welcome " + data.user.username);

    } catch (err) {
      alert("Server error");
    }
  });
}

// INIT
renderAuthState();