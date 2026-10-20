// ==========================================================================
// 1. KONFIGURASI LOCAL STORAGE & DATA CONTOH AWAL
// ==========================================================================
const STORAGE_KEY_TRADES = "tradepulse_trades_v1";
const STORAGE_KEY_BALANCE = "tradepulse_initial_balance_v1";
const STORAGE_KEY_INIT = "tradepulse_initialized_v1";

const SAMPLE_TRADES = [
  {
    id: "trd-101",
    datetime: "2026-10-18T14:30",
    pair: "XAUUSD",
    type: "BUY",
    entry: 2642.5,
    exit: 2658.0,
    lot: 0.2,
    pnl: 310.0,
    status: "PROFIT",
    notes:
      "[Disiplin Sesuai Plan] Entry saat breakout struktur H1 setelah rilis data sesi London. Sabar menahan posisi hingga TP.",
  },
  {
    id: "trd-102",
    datetime: "2026-10-19T09:15",
    pair: "EURUSD",
    type: "SELL",
    entry: 1.0865,
    exit: 1.089,
    lot: 0.5,
    pnl: -125.0,
    status: "LOSS",
    notes:
      "[FOMO Entry] Terlalu cepat masuk sebelum candle konfirmasi tutup sempurna. Stop loss tersentuh sesuai batas risiko 1%.",
  },
  {
    id: "trd-103",
    datetime: "2026-10-19T20:00",
    pair: "BTCUSDT",
    type: "BUY",
    entry: 67400.0,
    exit: 68850.0,
    lot: 0.3,
    pnl: 435.0,
    status: "PROFIT",
    notes:
      "[Tenang & Sabar] Re-test area support kunci D1 dengan konfirmasi volume tinggi pada pembukaan sesi New York.",
  },
  {
    id: "trd-104",
    datetime: "2026-10-20T10:45",
    pair: "USDJPY",
    type: "SELL",
    entry: 149.8,
    exit: 149.8,
    lot: 0.3,
    pnl: 0.0,
    status: "BREAKEVEN",
    notes:
      "[Disiplin Sesuai Plan] Harga bergerak 25 pips lalu berbalik arah, terkena SL+ (Breakeven) yang sudah digeser untuk mengamankan modal.",
  },
];

// State Utama Aplikasi
let trades = [];
let initialBalance = 10000;

// ==========================================================================
// 2. REFERENSI ELEMEN DOM
// ==========================================================================
const tradeForm = document.getElementById("trade-form");
const dateInput = document.getElementById("trade-date");
const pairInput = document.getElementById("trade-pair");
const typeSelect = document.getElementById("trade-type");
const entryInput = document.getElementById("entry-price");
const exitInput = document.getElementById("exit-price");
const lotInput = document.getElementById("lot-size");
const pnlInput = document.getElementById("pnl-amount");
const notesInput = document.getElementById("trade-notes");
const autoCalcBtn = document.getElementById("auto-calc-btn");

const initialBalanceInput = document.getElementById("initial-balance-input");
const loadSampleBtn = document.getElementById("load-sample-btn");
const clearAllBtn = document.getElementById("clear-all-btn");

const searchInput = document.getElementById("search-input");
const filterStatusSelect = document.getElementById("filter-status");
const tableBody = document.getElementById("trade-table-body");
const emptyState = document.getElementById("empty-state");
const tableCountBadge = document.getElementById("table-count-badge");

// Elemen Kartu Statistik
const statTotalBalance = document.getElementById("stat-total-balance");
const statNetPnl = document.getElementById("stat-net-pnl");
const statWinRate = document.getElementById("stat-win-rate");
const statWlRatio = document.getElementById("stat-wl-ratio");
const winrateBarFill = document.getElementById("winrate-bar-fill");
const statTotalTrades = document.getElementById("stat-total-trades");
const statLongCount = document.getElementById("stat-long-count");
const statShortCount = document.getElementById("stat-short-count");
const statProfitFactor = document.getElementById("stat-profit-factor");
const statPfBadge = document.getElementById("stat-pf-badge");
const statGrossProfit = document.getElementById("stat-gross-profit");
const statGrossLoss = document.getElementById("stat-gross-loss");

// ==========================================================================
// 3. FUNGSI PENYIMPANAN & PEMUATAN LOCAL STORAGE
// ==========================================================================
function loadFromLocalStorage() {
  const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
  if (savedBalance !== null && !isNaN(parseFloat(savedBalance))) {
    initialBalance = parseFloat(savedBalance);
    initialBalanceInput.value = initialBalance;
  }

  const isInitialized = localStorage.getItem(STORAGE_KEY_INIT);
  const savedTrades = localStorage.getItem(STORAGE_KEY_TRADES);

  if (!isInitialized && !savedTrades) {
    // Muat data contoh saat pertama kali aplikasi dibuka agar tampilan langsung informatif
    trades = [...SAMPLE_TRADES];
    localStorage.setItem(STORAGE_KEY_INIT, "true");
    saveTradesToLocalStorage();
  } else if (savedTrades) {
    try {
      trades = JSON.parse(savedTrades);
    } catch (err) {
      console.error("Gagal membaca data jurnal dari localStorage:", err);
      trades = [];
    }
  }
}

function saveTradesToLocalStorage() {
  localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(trades));
}

function saveBalanceToLocalStorage() {
  localStorage.setItem(STORAGE_KEY_BALANCE, String(initialBalance));
}

// ==========================================================================
// 4. KALKULASI STATISTIK DASHBOARD (NET P&L, WIN RATE, PROFIT FACTOR)
// ==========================================================================
function formatCurrency(amount, showPlus = false) {
  const absVal = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (amount > 0) return `${showPlus ? "+" : ""}$${absVal}`;
  if (amount < 0) return `-$${absVal}`;
  return `$${absVal}`;
}

function updateDashboardStats() {
  const total = trades.length;
  let netPnl = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let beCount = 0;
  let longCount = 0;
  let shortCount = 0;

  trades.forEach((t) => {
    const pnl = parseFloat(t.pnl) || 0;
    netPnl += pnl;

    if (t.status === "PROFIT" || pnl > 0) {
      winCount++;
      grossProfit += Math.max(0, pnl);
    } else if (t.status === "LOSS" || pnl < 0) {
      lossCount++;
      grossLoss += Math.abs(Math.min(0, pnl));
    } else {
      beCount++;
    }

    if (t.type === "BUY") longCount++;
    else shortCount++;
  });

  // 1. Update Total Saldo & Net P&L
  const currentEquity = initialBalance + netPnl;
  const growthPct = initialBalance > 0 ? (netPnl / initialBalance) * 100 : 0;
  statTotalBalance.textContent = formatCurrency(currentEquity);

  const signPct = growthPct > 0 ? "+" : "";
  statNetPnl.textContent = `${formatCurrency(netPnl, true)} (${signPct}${growthPct.toFixed(2)}%)`;

  statNetPnl.className = "font-mono font-semibold ";
  if (netPnl > 0) {
    statNetPnl.classList.add("text-emerald-400");
  } else if (netPnl < 0) {
    statNetPnl.classList.add("text-rose-400");
  } else {
    statNetPnl.classList.add("text-slate-400");
  }

  // 2. Update Win Rate (%)
  const winRate = total > 0 ? (winCount / total) * 100 : 0;
  statWinRate.textContent = `${winRate.toFixed(1)}%`;
  statWlRatio.textContent = `${winCount}W / ${lossCount}L / ${beCount}BE`;
  winrateBarFill.style.width = `${Math.min(100, Math.max(0, winRate))}%`;

  // 3. Update Total Trade
  statTotalTrades.textContent = String(total);
  statLongCount.textContent = `▲ ${longCount} Buy/Long`;
  statShortCount.textContent = `▼ ${shortCount} Sell/Short`;

  // 4. Update Profit Factor (Gross Profit / Gross Loss)
  statGrossProfit.textContent = `GP: ${formatCurrency(grossProfit, true)}`;
  statGrossLoss.textContent = `GL: -${formatCurrency(grossLoss)}`;

  let pfText = "0.00";
  let badgeText = "Netral";
  let badgeClass = "text-[11px] font-mono px-2 py-0.5 rounded-full ";

  if (grossLoss === 0 && grossProfit > 0) {
    pfText = "∞";
    badgeText = "Sempurna";
    badgeClass +=
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  } else if (grossLoss > 0) {
    const pf = grossProfit / grossLoss;
    pfText = pf.toFixed(2);
    if (pf >= 2.0) {
      badgeText = "Sangat Baik";
      badgeClass +=
        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    } else if (pf >= 1.0) {
      badgeText = "Profitable";
      badgeClass += "bg-sky-500/15 text-sky-400 border border-sky-500/30";
    } else {
      badgeText = "Di Bawah 1.0";
      badgeClass += "bg-rose-500/15 text-rose-400 border border-rose-500/30";
    }
  } else {
    badgeClass += "bg-slate-800 text-slate-400";
  }

  statProfitFactor.textContent = pfText;
  statPfBadge.textContent = badgeText;
  statPfBadge.className = badgeClass;
}

// ==========================================================================
// 5. RENDER TABEL RIWAYAT TRADING & FILTER PENCARIAN
// ==========================================================================
function formatDateTimeDisplay(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderTradeTable() {
  const query = searchInput.value.trim().toLowerCase();
  const statusFilter = filterStatusSelect.value;

  // Urutkan transaksi dari yang terbaru ke terlama
  const filtered = [...trades]
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    .filter((t) => {
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      const matchQuery =
        !query ||
        t.pair.toLowerCase().includes(query) ||
        (t.notes && t.notes.toLowerCase().includes(query));
      return matchStatus && matchQuery;
    });

  tableCountBadge.textContent = `${filtered.length} Trade`;
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach((trade) => {
    const tr = document.createElement("tr");
    tr.className =
      "hover:bg-terminal-cardHover/60 transition animate-row group";

    // Gaya badge tipe posisi (BUY vs SELL)
    const isBuy = trade.type === "BUY";
    const typeBadge = isBuy
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">▲ BUY</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">▼ SELL</span>`;

    // Gaya teks P&L dan Status Badge
    const pnlVal = parseFloat(trade.pnl) || 0;
    let pnlColorClass = "text-slate-300";
    let statusBadge = `<span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">BREAKEVEN</span>`;

    if (trade.status === "PROFIT") {
      pnlColorClass = "text-emerald-400";
      statusBadge = `<span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">PROFIT</span>`;
    } else if (trade.status === "LOSS") {
      pnlColorClass = "text-rose-400";
      statusBadge = `<span class="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">LOSS</span>`;
    }

    tr.innerHTML = `
            <td class="py-3.5 pr-4 whitespace-nowrap">
                <div class="font-mono font-bold text-white text-sm">${escapeHtml(trade.pair)}</div>
                <div class="text-[11px] font-mono text-slate-400">${formatDateTimeDisplay(trade.datetime)}</div>
            </td>
            <td class="py-3.5 px-3 whitespace-nowrap">
                <div>${typeBadge}</div>
                <div class="text-xs font-mono text-slate-400 mt-1">${Number(trade.lot).toFixed(2)} Lot</div>
            </td>
            <td class="py-3.5 px-3 whitespace-nowrap font-mono text-xs">
                <div class="text-slate-300"><span class="text-slate-500">In:</span> ${trade.entry}</div>
                <div class="text-slate-300 mt-0.5"><span class="text-slate-500">Out:</span> ${trade.exit}</div>
            </td>
            <td class="py-3.5 px-3 whitespace-nowrap text-right font-mono font-bold text-sm ${pnlColorClass}">
                ${formatCurrency(pnlVal, true)}
            </td>
            <td class="py-3.5 px-3 whitespace-nowrap text-center">
                ${statusBadge}
            </td>
            <td class="py-3.5 px-3 max-w-xs">
                <p class="text-xs text-slate-300 line-clamp-2 leading-relaxed" title="${escapeHtml(trade.notes || "-")}">
                    ${escapeHtml(trade.notes || "-")}
                </p>
            </td>
            <td class="py-3.5 pl-3 whitespace-nowrap text-right">
                <button
                    type="button"
                    data-delete-id="${trade.id}"
                    class="delete-trade-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    title="Hapus transaksi ini"
                >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hapus</span>
                </button>
            </td>
        `;
    tableBody.appendChild(tr);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ==========================================================================
// 6. KALKULATOR OTOMATIS P&L & SINKRONISASI STATUS FORM
// ==========================================================================
function getSelectedStatus() {
  const checked = document.querySelector('input[name="trade-status"]:checked');
  return checked ? checked.value : "PROFIT";
}

function setSelectedStatus(statusVal) {
  const radio = document.querySelector(
    `input[name="trade-status"][value="${statusVal}"]`,
  );
  if (radio) radio.checked = true;
}

function estimatePnlFromInputs() {
  const entry = parseFloat(entryInput.value);
  const exit = parseFloat(exitInput.value);
  const lot = parseFloat(lotInput.value);
  const type = typeSelect.value;
  const pair = (pairInput.value || "").toUpperCase().trim();

  if (isNaN(entry) || isNaN(exit) || isNaN(lot) || lot <= 0) return;

  const rawDiff = type === "BUY" ? exit - entry : entry - exit;

  // Penyesuaian ukuran kontrak standar berdasarkan instrumen populer
  let contractMultiplier = 1;
  if (pair.includes("XAU") || pair.includes("GOLD")) {
    contractMultiplier = 100; // 1 lot Gold = 100 troy oz
  } else if (
    pair.endsWith("USD") &&
    !pair.includes("BTC") &&
    !pair.includes("ETH") &&
    entry < 10
  ) {
    contractMultiplier = 100000; // 1 standard lot Forex Major = 100.000 unit
  } else if (pair.endsWith("JPY")) {
    contractMultiplier = 1000; // Aproksimasi cepat nilai pip JPY dalam USD
  }

  const estimated = rawDiff * lot * contractMultiplier;
  const rounded = Math.round(estimated * 100) / 100;
  pnlInput.value = rounded.toFixed(2);

  if (rounded > 0) setSelectedStatus("PROFIT");
  else if (rounded < 0) setSelectedStatus("LOSS");
  else setSelectedStatus("BREAKEVEN");
}

// Sinkronisasi warna dropdown Tipe Posisi (BUY = Hijau, SELL = Merah)
typeSelect.addEventListener("change", () => {
  if (typeSelect.value === "BUY") {
    typeSelect.classList.remove("text-rose-400");
    typeSelect.classList.add("text-emerald-400");
  } else {
    typeSelect.classList.remove("text-emerald-400");
    typeSelect.classList.add("text-rose-400");
  }
  estimatePnlFromInputs();
});

[entryInput, exitInput, lotInput].forEach((el) => {
  el.addEventListener("input", estimatePnlFromInputs);
});

autoCalcBtn.addEventListener("click", estimatePnlFromInputs);

// Saat nilai P&L diketik manual, sesuaikan radio button Status
pnlInput.addEventListener("input", () => {
  const val = parseFloat(pnlInput.value);
  if (isNaN(val)) return;
  if (val > 0) setSelectedStatus("PROFIT");
  else if (val < 0) setSelectedStatus("LOSS");
  else setSelectedStatus("BREAKEVEN");
});

// Saat radio button Status diklik manual, pastikan tanda +/- pada P&L sesuai
document.querySelectorAll('input[name="trade-status"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const status = getSelectedStatus();
    const currentPnl = parseFloat(pnlInput.value) || 0;
    if (status === "PROFIT" && currentPnl < 0) {
      pnlInput.value = Math.abs(currentPnl).toFixed(2);
    } else if (status === "LOSS" && currentPnl > 0) {
      pnlInput.value = (-Math.abs(currentPnl)).toFixed(2);
    } else if (status === "BREAKEVEN") {
      pnlInput.value = "0.00";
    }
  });
});

// Tombol Tag Cepat Psikologi Trading
document.querySelectorAll(".psych-tag").forEach((btn) => {
  btn.addEventListener("click", () => {
    const tag = btn.getAttribute("data-tag");
    if (!notesInput.value.includes(tag.trim())) {
      notesInput.value = tag + notesInput.value;
    }
    notesInput.focus();
  });
});

// ==========================================================================
// 7. TAMBAH DATA, HAPUS DATA, & NOTIFIKASI TOAST
// ==========================================================================
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  const colorClasses =
    type === "danger"
      ? "border-rose-500/40 bg-slate-900/95 text-rose-300"
      : "border-emerald-500/40 bg-slate-900/95 text-emerald-300";

  toast.className = `animate-row px-4 py-2.5 rounded-xl border ${colorClasses} shadow-xl backdrop-blur-md text-xs font-mono flex items-center gap-2`;
  toast.innerHTML = `<span>●</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

function setDefaultDateTimeNow() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  dateInput.value = now.toISOString().slice(0, 16);
}

// Submit Form Tambah Transaksi Baru
tradeForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const status = getSelectedStatus();
  let pnl = parseFloat(pnlInput.value) || 0;
  if (status === "LOSS" && pnl > 0) pnl = -pnl;
  if (status === "PROFIT" && pnl < 0) pnl = Math.abs(pnl);
  if (status === "BREAKEVEN") pnl = 0;

  const newTrade = {
    id: "trd-" + Date.now(),
    datetime: dateInput.value,
    pair: pairInput.value.trim().toUpperCase(),
    type: typeSelect.value,
    entry: parseFloat(entryInput.value),
    exit: parseFloat(exitInput.value),
    lot: parseFloat(lotInput.value),
    pnl: pnl,
    status: status,
    notes: notesInput.value.trim(),
  };

  trades.unshift(newTrade);
  saveTradesToLocalStorage();
  updateDashboardStats();
  renderTradeTable();

  // Reset form dan pasang kembali waktu saat ini
  tradeForm.reset();
  setDefaultDateTimeNow();
  setSelectedStatus("PROFIT");
  typeSelect.classList.remove("text-rose-400");
  typeSelect.classList.add("text-emerald-400");

  showToast(
    `Transaksi ${newTrade.pair} (${newTrade.status}) berhasil disimpan!`,
  );
});

// Event Delegation untuk Tombol Hapus pada Baris Tabel
tableBody.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".delete-trade-btn");
  if (!deleteBtn) return;

  const tradeId = deleteBtn.getAttribute("data-delete-id");
  const targetTrade = trades.find((t) => t.id === tradeId);
  if (!targetTrade) return;

  trades = trades.filter((t) => t.id !== tradeId);
  saveTradesToLocalStorage();
  updateDashboardStats();
  renderTradeTable();
  showToast(`Data trade ${targetTrade.pair} telah dihapus.`, "danger");
});

// Perubahan Modal Awal Akun
initialBalanceInput.addEventListener("input", () => {
  const val = parseFloat(initialBalanceInput.value);
  initialBalance = isNaN(val) || val < 0 ? 0 : val;
  saveBalanceToLocalStorage();
  updateDashboardStats();
});

// Filter & Pencarian Real-Time
searchInput.addEventListener("input", renderTradeTable);
filterStatusSelect.addEventListener("change", renderTradeTable);

// Tombol Muat Data Contoh
loadSampleBtn.addEventListener("click", () => {
  const existingIds = new Set(trades.map((t) => t.id));
  let added = 0;
  SAMPLE_TRADES.forEach((sample) => {
    if (!existingIds.has(sample.id)) {
      trades.push({ ...sample });
      added++;
    }
  });
  if (added === 0) {
    // Buat salinan baru jika sampel sudah ada
    const randomSample =
      SAMPLE_TRADES[Math.floor(Math.random() * SAMPLE_TRADES.length)];
    trades.unshift({
      ...randomSample,
      id: "trd-" + Date.now(),
      datetime: new Date().toISOString().slice(0, 16),
    });
  }
  saveTradesToLocalStorage();
  updateDashboardStats();
  renderTradeTable();
  showToast("Data contoh transaksi berhasil ditambahkan!");
});

// Tombol Reset Seluruh Jurnal
clearAllBtn.addEventListener("click", () => {
  if (trades.length === 0) return;
  const confirmed = window.confirm(
    "Apakah Anda yakin ingin menghapus seluruh riwayat trading?",
  );
  if (!confirmed) return;

  trades = [];
  saveTradesToLocalStorage();
  updateDashboardStats();
  renderTradeTable();
  showToast("Seluruh riwayat jurnal telah di-reset.", "danger");
});

// ==========================================================================
// 8. INISIALISASI APLIKASI SAAT HALAMAN DIMUAT
// ==========================================================================
setDefaultDateTimeNow();
loadFromLocalStorage();
updateDashboardStats();
renderTradeTable();
