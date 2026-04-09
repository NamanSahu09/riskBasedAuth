/* ═══════════════════════════════════════════
   SecureCheck — script.js
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

// ── SCAN SYSTEM ─────────────────────────
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
    <span class="scan-score ${riskClass}">${Math.max(1, Math.round(data.risk_score))}/100</span>
    <a class="scan-link" href="${url}" target="_blank">↗</a>
  `;
  scanList.prepend(row);
}

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
  scanBtn.classList.add('scanning');

  const orig = liveCounter;
  let tick = 0;
  const iv = setInterval(() => {
    tick++;
    setScanCount(orig + tick);
  }, 300);

  try {
    const https_status = url.startsWith('https') ? 1 : 0;

    const res = await fetch('https://risk-ml.onrender.com/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_device: 0, new_location: 0, odd_time: 0, https_status })
    });

    if (!res.ok) throw new Error('API response failed');

    const data = await res.json();
    console.log('ML DATA:', data);

    showResult(url, data);

    if (data.risk_level === 'HIGH') {
      alert(
        '⚠ Unsafe Website!\n\n' +
        'Risk Level: ' + data.risk_level +
        '\nRisk Score: ' + Math.round(data.risk_score)
      );
    }

    scanBtn.innerHTML = '✅ Done!';
    scanBtn.classList.remove('scanning');
    scanBtn.classList.add('done');

  } catch (err) {
    console.error('ERROR:', err);
    alert('❌ API Error / ML Service Down');
    scanBtn.innerHTML = 'Error';
  }

  clearInterval(iv);

  setTimeout(() => {
    scanBtn.innerHTML = '🔍 Scan Now';
    scanBtn.classList.remove('done');
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

setInterval(() => {
  if (!scanning && Math.random() > 0.55) setScanCount(liveCounter + 1);
}, 9000);


/* ═══════════════════════════════════════════
   AUTH SYSTEM
   Storage: localStorage  (demo — no real backend)
   Keys:
     securecheck_users  → JSON array of {name, email, password}
     securecheck_session → email of current user
   ═══════════════════════════════════════════ */

const AUTH_USERS_KEY   = 'securecheck_users';
const AUTH_SESSION_KEY = 'securecheck_session';

// ── Helpers ──────────────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}
function getSession() {
  return localStorage.getItem(AUTH_SESSION_KEY) || null;
}
function setSession(email) {
  localStorage.setItem(AUTH_SESSION_KEY, email);
}
function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}
function getUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── UI elements ──────────────────
const authModal   = document.getElementById('authModal');
const modalClose  = document.getElementById('modalClose');
const loginBtn    = document.getElementById('loginBtn');
const userPill    = document.getElementById('userPill');
const userAvatar  = document.getElementById('userAvatar');
const userNameEl  = document.getElementById('userName');
const signOutBtn  = document.getElementById('signOutBtn');

const tabLogin    = document.getElementById('tabLogin');
const tabSignup   = document.getElementById('tabSignup');
const formLogin   = document.getElementById('formLogin');
const formSignup  = document.getElementById('formSignup');

const loginEmail    = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError    = document.getElementById('loginError');
const loginSubmit   = document.getElementById('loginSubmit');

const signupName     = document.getElementById('signupName');
const signupEmail    = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupError    = document.getElementById('signupError');
const signupSubmit   = document.getElementById('signupSubmit');

const toast = document.getElementById('toast');

// ── Toast ──────────────────────
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Modal open / close ──────────────────────
function openModal(tab = 'login') {
  if (!authModal) return;
  authModal.classList.add('open');
  switchTab(tab);
  // Clear fields
  if (loginEmail) loginEmail.value = '';
  if (loginPassword) loginPassword.value = '';
  if (signupName) signupName.value = '';
  if (signupEmail) signupEmail.value = '';
  if (signupPassword) signupPassword.value = '';
  if (loginError) loginError.textContent = '';
  if (signupError) signupError.textContent = '';
}
function closeModal() {
  if (authModal) authModal.classList.remove('open');
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  if (tabLogin) tabLogin.classList.toggle('active', isLogin);
  if (tabSignup) tabSignup.classList.toggle('active', !isLogin);
  if (formLogin) formLogin.style.display = isLogin ? 'flex' : 'none';
  if (formSignup) formSignup.style.display = isLogin ? 'none' : 'flex';
}

if (loginBtn)   loginBtn.addEventListener('click', () => openModal('login'));
if (modalClose) modalClose.addEventListener('click', closeModal);
if (authModal)  authModal.addEventListener('click', e => { if (e.target === authModal) closeModal(); });

if (tabLogin)  tabLogin.addEventListener('click', () => switchTab('login'));
if (tabSignup) tabSignup.addEventListener('click', () => switchTab('signup'));

// ── Render auth state ──────────────────────
function renderAuthState() {
  const session = getSession();
  if (session) {
    const user = getUserByEmail(session);
    if (user) {
      // signed in
      if (loginBtn) loginBtn.style.display = 'none';
      if (userPill) userPill.style.display = 'flex';
      if (userAvatar) userAvatar.textContent = initials(user.name || user.email);
      if (userNameEl) userNameEl.textContent = user.name || user.email;
      return;
    }
  }
  // signed out
  if (loginBtn) loginBtn.style.display = 'flex';
  if (userPill) userPill.style.display = 'none';
}

// ── Sign out ──────────────────────
if (signOutBtn) {
  signOutBtn.addEventListener('click', () => {
    clearSession();
    renderAuthState();
    showToast('👋 Signed out successfully');
  });
}

// ── Login submit ──────────────────────
if (loginSubmit) {
  loginSubmit.addEventListener('click', () => {
    const email = loginEmail ? loginEmail.value.trim() : '';
    const pass  = loginPassword ? loginPassword.value : '';

    if (!email || !pass) {
      if (loginError) loginError.textContent = 'Please fill in all fields.';
      return;
    }

    const user = getUserByEmail(email);
    if (!user || user.password !== pass) {
      if (loginError) loginError.textContent = 'Invalid email or password.';
      return;
    }

    setSession(email);
    closeModal();
    renderAuthState();
    showToast('✅ Welcome back, ' + (user.name || 'User') + '!');
  });
}

// ── Signup submit ──────────────────────
if (signupSubmit) {
  signupSubmit.addEventListener('click', () => {
    const name  = signupName ? signupName.value.trim() : '';
    const email = signupEmail ? signupEmail.value.trim() : '';
    const pass  = signupPassword ? signupPassword.value : '';

    if (!name || !email || !pass) {
      if (signupError) signupError.textContent = 'Please fill in all fields.';
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      if (signupError) signupError.textContent = 'Please enter a valid email.';
      return;
    }
    if (pass.length < 6) {
      if (signupError) signupError.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (getUserByEmail(email)) {
      if (signupError) signupError.textContent = 'An account with this email already exists.';
      return;
    }

    const users = getUsers();
    users.push({ name, email, password: pass });
    saveUsers(users);
    setSession(email);
    closeModal();
    renderAuthState();
    showToast('🎉 Account created! Welcome, ' + name + '!');
  });
}

// Enter key support in forms
[loginEmail, loginPassword].forEach(el => {
  if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') loginSubmit && loginSubmit.click(); });
});
[signupName, signupEmail, signupPassword].forEach(el => {
  if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') signupSubmit && signupSubmit.click(); });
});

// ── Init ──────────────────────
renderAuthState();
