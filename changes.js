// changes.js

const GH_OWNER = "duffry";
const GH_REPO = "films";
// How many commits to show
const GH_PER_PAGE = 50;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.message) msg += ` – ${data.message}`;
    } catch (_) {
      // ignore parse errors
    }
    throw new Error(msg);
  }
  return res.json();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  // yyyy-mm-dd for group labels
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Convert GitHub API commit JSON into a simpler shape.
 */
function mapCommits(raw) {
  return raw.map((c) => {
    const commit = c.commit || {};
    const author = commit.author || {};
    const msg = commit.message || "";
    const firstLine = msg.split("\n")[0].trim();

    return {
      sha: c.sha,
      url: c.html_url,
      title: firstLine || "(no message)",
      fullMessage: msg,
      authorName: author.name || (c.author && c.author.login) || "Unknown",
      date: author.date || commit.committer?.date || c.created_at,
    };
  });
}

/**
 * Group commits into { [date]: [commits...] } and sort dates desc.
 */
function groupByDate(commits) {
  const groups = new Map();

  for (const c of commits) {
    const day = formatDate(c.date);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(c);
  }

  // Turn into [ [date, commits[]], ... ] sorted desc by date
  return Array.from(groups.entries()).sort(([a], [b]) =>
    a < b ? 1 : a > b ? -1 : 0
  );
}

function createCommitCard(commit) {
  const card = document.createElement("article");
  card.className = "card";

  const main = document.createElement("div");
  main.className = "card-main";

  const textWrap = document.createElement("div");

  const titleEl = document.createElement("div");
  titleEl.className = "card-title";
  titleEl.textContent = commit.title;
  textWrap.appendChild(titleEl);

  const subtitleEl = document.createElement("div");
  subtitleEl.className = "card-subtitle";

  const shortSha = commit.sha.slice(0, 7);
  subtitleEl.textContent = `${commit.authorName} • ${formatTime(
    commit.date
  )} • ${shortSha}`;
  textWrap.appendChild(subtitleEl);

  main.appendChild(textWrap);

  // Optional: make the whole card clickable to GitHub
  card.addEventListener("click", () => {
    window.open(commit.url, "_blank", "noopener");
  });
  card.style.cursor = "pointer";

  card.appendChild(main);

  // No progress bar for now, but we could add one later
  return card;
}

async function loadChanges() {
  const summaryEl = document.getElementById("changesSummary");
  const statusEl = document.getElementById("changesStatus");
  const listEl = document.getElementById("changesList");

  if (!summaryEl || !statusEl || !listEl) return;

  summaryEl.textContent = "Loading recent activity…";
  statusEl.textContent = "";
  listEl.innerHTML = "";

  const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/commits?per_page=${GH_PER_PAGE}`;

  let rawCommits;
  try {
    rawCommits = await fetchJson(apiUrl);
  } catch (err) {
    console.error(err);
    summaryEl.textContent = "Error loading recent changes.";
    statusEl.textContent = err.message;
    return;
  }

  if (!Array.isArray(rawCommits) || rawCommits.length === 0) {
    summaryEl.textContent = "No recent commits found.";
    return;
  }

  const commits = mapCommits(rawCommits);
  const groups = groupByDate(commits);

  summaryEl.textContent = `Showing ${commits.length} most recent commits from ${GH_OWNER}/${GH_REPO} (GitHub).`;

  for (const [day, dayCommits] of groups) {
    const heading = document.createElement("h2");
    heading.className = "changes-date-heading";
    heading.textContent = day;
    listEl.appendChild(heading);

    dayCommits.forEach((c) => {
      listEl.appendChild(createCommitCard(c));
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadChanges();
});
