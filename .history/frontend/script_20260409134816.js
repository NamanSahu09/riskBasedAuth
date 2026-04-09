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
      body: JSON.stringify({
        new_device: 0,
        new_location: 0,
        odd_time: 0,
        https_status: url.startsWith("https") ? 1 : 0,
        url: url    
      })
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
   Backend: PHP MySQL
   Endpoints:
     POST /backend/public/login.php
     POST /backend/public/signup.php
     POST /backend/public/logout.php
     GET  /backend/public/session.php
   ═══════════════════════════════════════════ */

const API_BASE = '../backend/public/';

// ── Helpers ──────────────────────
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Session management with localStorage (mirrors PHP session)
function getSession() {
  return localStorage.getItem('securecheck_session');
}
function setSession(user) {
  localStorage.setItem('securecheck_session', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('securecheck_session');
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
    const user = JSON.parse(session);
    if (user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (userPill) userPill.style.display = 'flex';
      if (userAvatar) userAvatar.textContent = initials(user.username || user.name || 'U');
      if (userNameEl) userNameEl.textContent = user.username || user.name || 'User';
      return;
    }
  }
  if (loginBtn) loginBtn.style.display = 'flex';
  if (userPill) userPill.style.display = 'none';
}

// ── Sign out ──────────────────────
if (signOutBtn) {
  signOutBtn.addEventListener('click', async () => {
    try {
      await fetch(API_BASE + 'logout.php', { method: 'POST' });
    } catch (e) { console.error('Logout error:', e); }
    clearSession();
    renderAuthState();
    showToast('👋 Signed out successfully');
  });
}

// ── Login submit ──────────────────────
if (loginSubmit) {
  loginSubmit.addEventListener('click', async () => {
    const username = loginEmail ? loginEmail.value.trim() : '';
    const pass  = loginPassword ? loginPassword.value : '';

    if (!username || !pass) {
      if (loginError) loginError.textContent = 'Please fill in all fields.';
      return;
    }

    loginSubmit.disabled = true;
    loginSubmit.textContent = 'Signing in...';

    try {
      const res = await fetch(API_BASE + 'login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass })
      });

      const data = await res.json();

      if (!data.success) {
        if (loginError) loginError.textContent = data.error || 'Login failed';
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Sign In';
        return;
      }

      if (data.requires_otp) {
        if (loginError) loginError.textContent = 'OTP verification required. Please check your email.';
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Sign In';
        return;
      }

      setSession(data.user);
      closeModal();
      renderAuthState();
      showToast('✅ Welcome back, ' + (data.user.username || 'User') + '!');
    } catch (err) {
      console.error('Login error:', err);
      if (loginError) loginError.textContent = 'Server error. Please try again.';
    }

    loginSubmit.disabled = false;
    loginSubmit.textContent = 'Sign In';
  });
}

// ── Signup submit ──────────────────────
if (signupSubmit) {
  signupSubmit.addEventListener('click', async () => {
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

    signupSubmit.disabled = true;
    signupSubmit.textContent = 'Creating account...';

    try {
      const res = await fetch(API_BASE + 'signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email, password: pass })
      });

      const data = await res.json();

      if (!data.success) {
        if (signupError) signupError.textContent = data.error || 'Signup failed';
        signupSubmit.disabled = false;
        signupSubmit.textContent = 'Sign Up';
        return;
      }

      setSession({ username: name, email });
      closeModal();
      renderAuthState();
      showToast('🎉 Account created! Welcome, ' + name + '!');
    } catch (err) {
      console.error('Signup error:', err);
      if (signupError) signupError.textContent = 'Server error. Please try again.';
    }

    signupSubmit.disabled = false;
    signupSubmit.textContent = 'Sign Up';
  });
}

// Enter key support in forms
if (loginEmail) loginEmail.addEventListener('keydown', e => { if (e.key === 'Enter') loginSubmit && loginSubmit.click(); });
if (loginPassword) loginPassword.addEventListener('keydown', e => { if (e.key === 'Enter') loginSubmit && loginSubmit.click(); });
if (signupName) signupName.addEventListener('keydown', e => { if (e.key === 'Enter') signupSubmit && signupSubmit.click(); });
if (signupEmail) signupEmail.addEventListener('keydown', e => { if (e.key === 'Enter') signupSubmit && signupSubmit.click(); });
if (signupPassword) signupPassword.addEventListener('keydown', e => { if (e.key === 'Enter') signupSubmit && signupSubmit.click(); });

// ── Init ──────────────────────
renderAuthState();
