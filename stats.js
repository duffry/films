// stats.js

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let details = '';
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
  if (!isFinite(value) || isNaN(value)) return '–';
  return `${value.toFixed(1)}%`;
}

async function loadServiceStats() {
  const body = document.getElementById('serviceStatsBody');
  const summaryEl = document.getElementById('statsSummary');
  const statusEl = document.getElementById('statsStatus');

  body.innerHTML = '';
  summaryEl.textContent = 'Loading…';
  statusEl.textContent = '';

  let rows;
  try {
    rows = await fetchJson('api/stats_services.php');
  } catch (err) {
    console.error(err);
    summaryEl.textContent = 'Error loading stats.';
    statusEl.textContent = err.message;
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    summaryEl.textContent = 'No films found.';
    return;
  }

  // Calculate column totals
  let totalItems = 0;
  let totalWatched = 0;
  let totalUnwatched = 0;

  for (const r of rows) {
    totalItems += Number(r.total_count) || 0;
    totalWatched += Number(r.watched_count) || 0;
    totalUnwatched += Number(r.unwatched_count) || 0;
  }

  summaryEl.textContent =
    `Total items: ${totalItems} | watched: ${totalWatched}, ` +
    `unwatched: ${totalUnwatched}`;

  // Build table rows
  for (const r of rows) {
    const serviceName = r.service_name || 'Unknown / not set';
    const watched = Number(r.watched_count) || 0;
    const unwatched = Number(r.unwatched_count) || 0;
    const total = Number(r.total_count) || 0;

    const watchedPct = totalWatched ? (watched / totalWatched) * 100 : NaN;
    const unwatchedPct = totalUnwatched ? (unwatched / totalUnwatched) * 100 : NaN;
    const totalPct = totalItems ? (total / totalItems) * 100 : NaN;

    const tr = document.createElement('tr');

    const tdService = document.createElement('td');
    tdService.textContent = serviceName;
    if (!r.service_id || r.service_id === 0) {
      tdService.classList.add('badge-unknown');
    }
    tr.appendChild(tdService);

    const tdWatched = document.createElement('td');
    tdWatched.textContent = watched.toString();
    tr.appendChild(tdWatched);

    const tdWatchedPct = document.createElement('td');
    tdWatchedPct.textContent = formatPct(watchedPct);
    tr.appendChild(tdWatchedPct);

    const tdUnwatched = document.createElement('td');
    tdUnwatched.textContent = unwatched.toString();
    tr.appendChild(tdUnwatched);

    const tdUnwatchedPct = document.createElement('td');
    tdUnwatchedPct.textContent = formatPct(unwatchedPct);
    tr.appendChild(tdUnwatchedPct);

    const tdTotal = document.createElement('td');
    tdTotal.textContent = total.toString();
    tr.appendChild(tdTotal);

    const tdTotalPct = document.createElement('td');
    tdTotalPct.textContent = formatPct(totalPct);
    tr.appendChild(tdTotalPct);

    body.appendChild(tr);
  }
}

document.addEventListener('DOMContentLoaded', loadServiceStats);
