// stats.js

let serviceRows = [];
let totals = { items: 0, watched: 0, unwatched: 0 };
let currentView = "watched";

// table sort state
let tableSort = {
  field: "percentTotal",
  direction: "desc",
};

// remember what view we were on before drilling into a service
let previousView = "watched";

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

function createServicePill(row) {
  const span = document.createElement("span");
  span.className = "service-pill";

  const serviceName = row.service_name || "Unknown";
  const code = row.service_code;

//   if (code && code !== "unknown") {
  if (code) {
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

function getColumnTotalForView(view) {
  if (view === "watched") return totals.watched;
  if (view === "unwatched") return totals.unwatched;
  return totals.items;
}

function getValueForRowView(row, view) {
  const watched = Number(row.watched_count) || 0;
  const unwatched = Number(row.unwatched_count) || 0;
  const total = Number(row.total_count) || 0;

  if (view === "watched") return watched;
  if (view === "unwatched") return unwatched;
  return total;
}

// ---------- table view ----------

function buildTable() {
  const body = document.getElementById("serviceStatsBody");
  if (!body) return;

  body.innerHTML = "";

  // pre-compute the percentages for sorting
  const rowsWithPct = serviceRows.map((r) => {
    const watched = Number(r.watched_count) || 0;
    const unwatched = Number(r.unwatched_count) || 0;
    const total = Number(r.total_count) || 0;

    const percentWatched = totals.watched
      ? (watched / totals.watched) * 100
      : NaN;
    const percentUnwatched = totals.unwatched
      ? (unwatched / totals.unwatched) * 100
      : NaN;
    const percentTotal = totals.items ? (total / totals.items) * 100 : NaN;

    return {
      ...r,
      watched,
      unwatched,
      total,
      percentWatched,
      percentUnwatched,
      percentTotal,
    };
  });

  // sort according to tableSort
  rowsWithPct.sort((a, b) => {
    const field = tableSort.field;

    let av = a[field];
    let bv = b[field];

    // NaNs to bottom
    if (!isFinite(av)) av = -Infinity;
    if (!isFinite(bv)) bv = -Infinity;

    if (av === bv) return 0;

    const dir = tableSort.direction === "asc" ? 1 : -1;
    return av > bv ? dir : -dir;
  });

  for (const r of rowsWithPct) {
    const serviceName = r.service_name || "Unknown";

    const watchedPct = r.percentWatched;
    const unwatchedPct = r.percentUnwatched;
    const totalPct = r.percentTotal;

    const tr = document.createElement("tr");

    const tdService = document.createElement("td");
    tdService.textContent = serviceName;
    if (!r.service_id || r.service_id === 0) {
      tdService.classList.add("badge-unknown");
    }
    tr.appendChild(tdService);

    const tdWatched = document.createElement("td");
    tdWatched.textContent = r.watched.toString();
    tr.appendChild(tdWatched);

    const tdWatchedPct = document.createElement("td");
    tdWatchedPct.textContent = formatPct(watchedPct);
    tr.appendChild(tdWatchedPct);

    const tdUnwatched = document.createElement("td");
    tdUnwatched.textContent = r.unwatched.toString();
    tr.appendChild(tdUnwatched);

    const tdUnwatchedPct = document.createElement("td");
    tdUnwatchedPct.textContent = formatPct(unwatchedPct);
    tr.appendChild(tdUnwatchedPct);

    const tdTotal = document.createElement("td");
    tdTotal.textContent = r.total.toString();
    tr.appendChild(tdTotal);

    const tdTotalPct = document.createElement("td");
    tdTotalPct.textContent = formatPct(totalPct);
    tr.appendChild(tdTotalPct);

    body.appendChild(tr);
  }
}

// ---------- cards view ----------

function renderCards(view) {
  const listEl = document.getElementById("serviceCardList");
  if (!listEl) return;

  listEl.innerHTML = "";

  const label =
    view === "watched"
      ? "watched"
      : view === "unwatched"
      ? "unwatched"
      : "items";

  const columnTotal = getColumnTotalForView(view);

  // build array with value & pct for sorting and display
  const rowsWithPct = serviceRows.map((r) => {
    const value = getValueForRowView(r, view);
    const pct = columnTotal && value ? (value / columnTotal) * 100 : 0;
    return { row: r, value, pct };
  });

  // sort by share of column, desc
  rowsWithPct.sort((a, b) => b.pct - a.pct);

  for (const { row: r, value, pct } of rowsWithPct) {
    const serviceName = r.service_name || "Unknown";
    const watched = Number(r.watched_count) || 0;
    const unwatched = Number(r.unwatched_count) || 0;
    const total = Number(r.total_count) || 0;

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
      subtitleEl.textContent = `${watched} watched of ${total} ${serviceName}, ${formatPct(
        pct
      )} of all watched items`;
    } else if (view === "unwatched") {
      subtitleEl.textContent = `${unwatched} out of ${total} unwatched, ${formatPct(
        pct
      )} of all unwatched items`;
    } else {
      subtitleEl.textContent = `${total} items, ${formatPct(
        pct
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
    inner.style.width = `${Math.max(0, Math.min(100, pct))}%`;

    progressBar.appendChild(inner);
    card.appendChild(progressBar);

    // clicking the card opens the "items on this service" view
    card.addEventListener("click", () => openServiceItems(r));

    listEl.appendChild(card);
  }
}

// ---------- service items view ----------

async function openServiceItems(serviceRow) {
  const serviceId = serviceRow.service_id;
  const serviceName = serviceRow.service_name || "Unknown";

  const cardsSection = document.getElementById("statsCardsSection");
  const tableSection = document.getElementById("statsTableSection");
  const viewToggle = document.getElementById("statsViewToggle");
  const serviceSection = document.getElementById("serviceItemsSection");
  const titleEl = document.getElementById("serviceItemsTitle");
  const summaryEl = document.getElementById("serviceItemsSummary");
  const containerEl = document.getElementById("serviceItemsContainer");

  if (!serviceSection || !summaryEl || !containerEl) return;

  previousView = currentView;

  // hide main stats views
  if (cardsSection) cardsSection.style.display = "none";
  if (tableSection) tableSection.style.display = "none";
  if (viewToggle) viewToggle.style.display = "none";

  // show items section
  serviceSection.style.display = "";

  if (titleEl) {
    titleEl.textContent = `Items on ${serviceName}`;
  }
  summaryEl.textContent = "Loading…";
  containerEl.innerHTML = "";

  try {
    const items = await fetchJson(
      `api/stats_service_items.php?service_id=${encodeURIComponent(
        serviceId
      )}`
    );

    if (!Array.isArray(items) || items.length === 0) {
      summaryEl.textContent = "No items found for this service.";
      return;
    }

    // build cards like the main films list
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "card-row";

      const main = document.createElement("div");
      main.className = "card-main";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = item.title || "Untitled";
      main.appendChild(title);

      const sub = document.createElement("div");
      sub.className = "card-sub";
      const listName = item.list_name || "Unknown list";
      const year = item.year ? ` · ${item.year}` : "";
      sub.textContent = `${listName}${year}`;
      main.appendChild(sub);

      row.appendChild(main);

      const meta = document.createElement("div");
      meta.className = "card-meta";

      meta.appendChild(createServicePill(item));
      row.appendChild(meta);

      // watched progress bar (0% or 100%)
      const outer = document.createElement("div");
      outer.className = "list-progress-outer";

      const inner = document.createElement("div");
      inner.className = "list-progress-inner";
      const watched = item.watched_at != null;
      inner.style.width = watched ? "100%" : "0%";

      outer.appendChild(inner);
      row.appendChild(outer);

      containerEl.appendChild(row);
    }

    summaryEl.textContent = `${items.length} item${
      items.length === 1 ? "" : "s"
    } on this service.`;
  } catch (err) {
    console.error(err);
    summaryEl.textContent = "Error loading items for this service.";
  }
}

function goBackToStatsMain() {
  const cardsSection = document.getElementById("statsCardsSection");
  const tableSection = document.getElementById("statsTableSection");
  const viewToggle = document.getElementById("statsViewToggle");
  const serviceSection = document.getElementById("serviceItemsSection");

  if (serviceSection) serviceSection.style.display = "none";
  if (viewToggle) viewToggle.style.display = "";

  // restore whichever main view we were on
  setView(previousView || "watched");
}

// ---------- view switching ----------

function setView(view) {
  currentView = view;

  const cardsSection = document.getElementById("statsCardsSection");
  const tableSection = document.getElementById("statsTableSection");
  const serviceSection = document.getElementById("serviceItemsSection");
  const viewToggle = document.getElementById("statsViewToggle");

  // if we were in service-detail view, hide it and bring back the toggle row
  if (serviceSection && serviceSection.style.display !== "none") {
    serviceSection.style.display = "none";
    if (viewToggle) viewToggle.style.display = "";
  }

  // toggle button active state
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
    buildTable();
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

  // default table sort is by % T desc
  tableSort = { field: "percentTotal", direction: "desc" };

  setView("watched");
}

// ---------- wiring ----------

document.addEventListener("DOMContentLoaded", () => {
  // main view toggle buttons
  document.querySelectorAll(".toggle-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view || view === currentView) return;
      setView(view);
    });
  });

  // table header sort
  document
    .querySelectorAll(".stats-table th[data-sort]")
    .forEach((th) => {
      th.addEventListener("click", () => {
        const field = th.dataset.sort;
        if (!field) return;

        // simple toggle asc/desc on repeat click
        if (tableSort.field === field) {
          tableSort.direction = tableSort.direction === "asc" ? "desc" : "asc";
        } else {
          tableSort.field = field;
          tableSort.direction = "desc";
        }
        buildTable();
      });
    });

  // back from service items view
  const backBtn = document.getElementById("serviceItemsBack");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      goBackToStatsMain();
    });
  }

  loadServiceStats();
});
