/* ═══════════════════════════════════════════
   SecureCheck — script.js (FINAL CLEAN VERSION)
   ═══════════════════════════════════════════ */

// ── SIDEBAR COLLAPSE ─────────────────────────
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

// restore state
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
const scanBtn  = document.getElementById('scanBtn');
const urlInput = document.getElementById('urlInput');
const urlBar   = document.getElementById('urlBar');
const scanCountEl = document.getElementById('scanCount');

let scanning    = false;
let liveCounter = 4821;

function formatNum(n) {
  return n.toLocaleString();
}

function setScanCount(n) {
  liveCounter = n;
  if (scanCountEl) scanCountEl.textContent = formatNum(n);
}

// ── SHOW RESULT IN UI ─────────────────────────
function showResult(url, data) {

  const scanList = document.querySelector(".scan-list");
  if (!scanList) return;

  let riskClass = "secure";

  if (data.risk_level === "HIGH") riskClass = "danger";
  else if (data.risk_level === "MEDIUM") riskClass = "moderate";

  const row = document.createElement("div");
  row.className = "scan-row";

  row.innerHTML = `
    <div class="scan-shield ${riskClass}">🛡️</div>
    <span class="scan-url">${url}</span>
    <span class="scan-status ${riskClass}">${data.risk_level}</span>
    <span class="scan-score ${riskClass}">${Math.round(data.risk_score)}/100</span>
    <a class="scan-link" href="${url}" target="_blank">↗</a>
  `;

  scanList.prepend(row);
}

// ── MAIN SCAN FUNCTION ─────────────────────────
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

  // UI loading
  scanBtn.innerHTML = '⏳ Scanning...';
  scanBtn.classList.add('scanning');

  // animate counter
  const orig = liveCounter;
  let tick = 0;

  const iv = setInterval(() => {
    tick++;
    setScanCount(orig + tick);
  }, 300);

  try {

    const https_status = url.startsWith("https") ? 1 : 0;

    const res = await fetch("https://riskauth.infinityfreeapp.com/backend/public/scan.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ https_status })
    });


    console.log("Sending request...");
    console.log("URL:", url);
    console.log("Response:", data);
    
    const data = await res.json();

    console.log("ML RESULT:", data);

    // show in UI
    showResult(url, data);

    // optional alert for HIGH risk
    if (data.risk_level === "HIGH") {
      alert(
        "⚠ WARNING!\n\n" +
        "This website may be unsafe.\n\n" +
        "Risk Level: " + data.risk_level +
        "\nRisk Score: " + Math.round(data.risk_score)
      );
    }

    // success UI
    scanBtn.innerHTML = '✅ Done!';
    scanBtn.classList.remove('scanning');
    scanBtn.classList.add('done');

  } catch (err) {
    console.error(err);

    alert("❌ API Error / ML Service Down");

    scanBtn.innerHTML = 'Error';
  }

  // reset button
  setTimeout(() => {
    scanBtn.innerHTML = '🔍 Scan Now';
    scanBtn.classList.remove('done');
    scanning = false;
  }, 2000);
}

// ── EVENTS ─────────────────────────
if (scanBtn) {
  scanBtn.addEventListener('click', runScan);
}

if (urlInput) {
  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') runScan();
    if (urlBar) urlBar.classList.remove('error');
  });
}

// ── LIVE COUNTER ─────────────────────────
setInterval(() => {
  if (!scanning && Math.random() > 0.55) {
    setScanCount(liveCounter + 1);
  }
}, 9000);