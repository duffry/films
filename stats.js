// stats.js

let serviceRows = [];
let totals = { items: 0, watched: 0, unwatched: 0 };

let currentView = "watched";
let currentTableSort = "pctTotal"; // default table sort = % T

// ---------- helpers ----------

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let details = "";
    try {
      const data = await res.json();
      details = data.error || JSON.stringify(data);
    } catch (_) {
      // ignore parse errors
    }
    throw new Error(`HTTP ${res.status} ${res.statusText} ${details}`);
  }
  return res.json();
}

function formatPct(value) {
  if (!isFinite(value) || isNaN(value)) return "–";
  return `${value.toFixed(1)}%`;
}

/**
 * Take raw serviceRows and totals and return a list with
 * numeric counts + percentage metrics we can reuse in
 * both cards and table.
 */
function getServiceMetrics() {
  const totalWatched = totals.watched;
  const totalUnwatched = totals.unwatched;
  const totalItems = totals.items;

  return serviceRows.map((r) => {
    const service_name = r.service_name || "Unknown / not set";
    const watched = Number(r.watched_count) || 0;
    const unwatched = Number(r.unwatched_count) || 0;
    const total = Number(r.total_count) || 0;

    const pctWatched = totalWatched
      ? (watched / totalWatched) * 100
      : NaN;
    const pctUnwatched = totalUnwatched
      ? (unwatched / totalUnwatched) * 100
      : NaN;
    const pctTotal = totalItems ? (total / totalItems) * 100 : NaN;

    return {
      raw: r, // original row for service_code, id, etc.
      service_name,
      watched,
      unwatched,
      total,
      pctWatched,
      pctUnwatched,
      pctTotal,
    };
  });
}

function createServicePill(row) {
  const span = document.createElement("span");
  span.className = "service-pill";

  const serviceName = row.service_name || "Unknown / not set";
  const code = row.service_code;

  if (code && code !== "unknown") {
    const img = document.createElement("img");
    img.className = "service-icon-img";
    img.src = `img/${code}.png`;
    img.alt = serviceName;

    img.onerror = () => {
      img.remove();
      const label = (serviceName || code || "?").charAt(0).toUpperCase();
      span.textContent = label;
      if (!row.service_id || row.service_id === 0) {
        span.classList.add("service-unknown");
      }
    };

    span.appendChild(img);
  } else {
    const label = (serviceName || "?").charAt(0).toUpperCase();
    span.textContent = label;
    if (!row.service_id || row.service_id === 0) {
      span.classList.add("service-unknown");
    }
  }

  return span;
}

// ---------- table view ----------

function buildTable(sortKey = currentTableSort) {
  currentTableSort = sortKey;

  const body = document.getElementById("serviceStatsBody");
  if (!body) return;
  body.innerHTML = "";

  const metrics = getServiceMetrics();

  // Decide which property to sort on
  const mapSortKey = (key) => {
    switch (key) {
      case "service":
        return "service_name";
      case "watched":
        return "watched";
      case "percentWatched":
        return "pctWatched";
      case "unwatched":
        return "unwatched";
      case "percentUnwatched":
        return "pctUnwatched";
      case "total":
        return "total";
      case "percentTotal":
      default:
        return "pctTotal";
    }
  };

  const internalKey = mapSortKey(sortKey);

  const sorted = [...metrics].sort((a, b) => {
    if (internalKey === "service_name") {
      return a.service_name.localeCompare(b.service_name);
    }
    const aval = a[internalKey];
    const bval = b[internalKey];
    const an = isFinite(aval) ? aval : -Infinity;
    const bn = isFinite(bval) ? bval : -Infinity;
    return bn - an; // numeric, descending
  });

  for (const m of sorted) {
    const tr = document.createElement("tr");

    const tdService = document.createElement("td");
    tdService.textContent = m.service_name;
    if (!m.raw.service_id || m.raw.service_id === 0) {
      tdService.classList.add("badge-unknown");
    }
    tr.appendChild(tdService);

    const tdWatched = document.createElement("td");
    tdWatched.textContent = m.watched.toString();
    tr.appendChild(tdWatched);

    const tdWatchedPct = document.createElement("td");
    tdWatchedPct.textContent = formatPct(m.pctWatched);
    tr.appendChild(tdWatchedPct);

    const tdUnwatched = document.createElement("td");
    tdUnwatched.textContent = m.unwatched.toString();
    tr.appendChild(tdUnwatched);

    const tdUnwatchedPct = document.createElement("td");
    tdUnwatchedPct.textContent = formatPct(m.pctUnwatched);
    tr.appendChild(tdUnwatchedPct);

    const tdTotal = document.createElement("td");
    tdTotal.textContent = m.total.toString();
    tr.appendChild(tdTotal);

    const tdTotalPct = document.createElement("td");
    tdTotalPct.textContent = formatPct(m.pctTotal);
    tr.appendChild(tdTotalPct);

    body.appendChild(tr);
  }
}

// ---------- card view ----------

function renderCards(view) {
  currentView = view;

  const listEl = document.getElementById("serviceCardList");
  if (!listEl) return;
  listEl.innerHTML = "";

  const metrics = getServiceMetrics();

  let pctKey;
  if (view === "watched") pctKey = "pctWatched";
  else if (view === "unwatched") pctKey = "pctUnwatched";
  else pctKey = "pctTotal";

  const sorted = [...metrics].sort((a, b) => {
    const aval = a[pctKey];
    const bval = b[pctKey];
    const an = isFinite(aval) ? aval : -Infinity;
    const bn = isFinite(bval) ? bval : -Infinity;
    return bn - an; // highest percentage first
  });

  for (const m of sorted) {
    const r = m.raw;
    const serviceName = m.service_name;
    const watched = m.watched;
    const unwatched = m.unwatched;
    const total = m.total;
    const pctOfColumn = m[pctKey];
    const safePct = isFinite(pctOfColumn)
      ? Math.max(0, Math.min(100, pctOfColumn))
      : 0;

    const card = document.createElement("article");
    card.className = "card service-card";

    const mainRow = document.createElement("div");
    mainRow.className = "card-main";

    const textWrap = document.createElement("div");

    const titleEl = document.createElement("div");
    titleEl.className = "card-title";
    titleEl.textContent = serviceName;
    textWrap.appendChild(titleEl);

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "card-subtitle";

    if (view === "watched") {
      subtitleEl.textContent = `${watched} :  ${formatPct(
        pctOfColumn
      )} of all watched items`;
    } else if (view === "unwatched") {
      subtitleEl.textContent = `${unwatched} :  ${formatPct(
        pctOfColumn
      )} of all unwatched items`;
    } else {
      subtitleEl.textContent = `${total} :  ${formatPct(
        pctOfColumn
      )} of all items`;
    }

    textWrap.appendChild(subtitleEl);
    mainRow.appendChild(textWrap);

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.appendChild(createServicePill(r));
    mainRow.appendChild(meta);

    card.appendChild(mainRow);

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const inner = document.createElement("div");
    inner.className = "progress-inner";
    inner.style.width = `${safePct}%`;

    progressBar.appendChild(inner);
    card.appendChild(progressBar);

    listEl.appendChild(card);
  }
}

// ---------- view switching ----------

function setView(view) {
  currentView = view;

  const cardsSection = document.getElementById("statsCardsSection");
  const tableSection = document.getElementById("statsTableSection");

  document
    .querySelectorAll(".toggle-button")
    .forEach((btn) => btn.classList.remove("active"));

  const activeBtn = document.querySelector(
    `.toggle-button[data-view="${view}"]`
  );
  if (activeBtn) activeBtn.classList.add("active");

  if (view === "table") {
    if (cardsSection) cardsSection.style.display = "none";
    if (tableSection) tableSection.style.display = "";

    buildTable(currentTableSort);
  } else {
    if (tableSection) tableSection.style.display = "none";
    if (cardsSection) cardsSection.style.display = "";
    renderCards(view);
  }
}

// ---------- data load ----------

async function loadServiceStats() {
  const summaryEl = document.getElementById("statsSummary");
  const statusEl = document.getElementById("statsStatus");

  if (summaryEl) summaryEl.textContent = "Loading…";
  if (statusEl) statusEl.textContent = "";

  let rows;
  try {
    rows = await fetchJson("api/stats_services.php");
  } catch (err) {
    console.error(err);
    if (summaryEl) summaryEl.textContent = "Error loading stats.";
    if (statusEl) statusEl.textContent = err.message;
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    if (summaryEl) summaryEl.textContent = "No films found.";
    return;
  }

  serviceRows = rows;

  totals = { items: 0, watched: 0, unwatched: 0 };
  for (const r of serviceRows) {
    totals.items += Number(r.total_count) || 0;
    totals.watched += Number(r.watched_count) || 0;
    totals.unwatched += Number(r.unwatched_count) || 0;
  }

  if (summaryEl) {
    summaryEl.textContent =
      `Total items: ${totals.items} | watched: ${totals.watched}, ` +
      `unwatched: ${totals.unwatched}`;
  }

  buildTable(currentTableSort); // prepares the table (default %T)
  setView("watched"); // shows cards by default
}

// ---------- init ----------

document.addEventListener("DOMContentLoaded", () => {
  // View toggle buttons
  document.querySelectorAll(".toggle-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view || view === currentView) return;
      setView(view);
    });
  });

  // Table header sort handlers (based on data-sort attributes)
  const bodyEl = document.getElementById("serviceStatsBody");
  const table = bodyEl ? bodyEl.closest("table") : null;
  if (table) {
    table.querySelectorAll("thead th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (!key) return;
        buildTable(key);
      });
    });
  }

  loadServiceStats();
});
