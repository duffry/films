// ----- DOM references -----
const views = {
  lists: document.getElementById('view-lists'),
  films: document.getElementById('view-films'),
  filmDetail: document.getElementById('view-film-detail')
};

const backButton = document.getElementById('backButton');

// Lists view
const listsContainer = document.getElementById('listsContainer');
const listsSummary = document.getElementById('listsSummary');
const listsStatus = document.getElementById('listsStatus');
const addListButton = document.getElementById('addListButton');

// Films view
const filmsContainer = document.getElementById('filmsContainer');
const filmsListName = document.getElementById('filmsListName');
const filmsListStats = document.getElementById('filmsListStats');
const filmsStatus = document.getElementById('filmsStatus');

// Detail view
const detailTitle = document.getElementById('detailTitle');
const detailYear = document.getElementById('detailYear');
const detailWatched = document.getElementById('detailWatched');
const detailNotes = document.getElementById('detailNotes');
const detailMarkWatched = document.getElementById('detailMarkWatched');

// ----- state -----
let currentView = 'lists';
let viewStack = ['lists'];
let currentList = null;
let currentFilms = [];  // cache for current list
let currentFilm = null; // currently selected film

// ----- helpers -----
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    console.error('Fetch error', url, res.status, text);
    throw new Error(`HTTP ${res.status}`);
  }
  return JSON.parse(text);
}

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
  currentView = name;
  backButton.disabled = viewStack.length <= 1;
}

function navigateTo(name) {
  if (name === currentView) return;
  viewStack.push(name);
  showView(name);
}

function goBack() {
  if (viewStack.length <= 1) return;
  viewStack.pop();
  const target = viewStack[viewStack.length - 1];

  // Refresh on back so counts/orderings are current
  if (target === 'films' && currentList) {
    loadFilmsForList(currentList);
  } else if (target === 'lists') {
    loadLists();
  }

  showView(target);
}

backButton.addEventListener('click', goBack);

// ----- Lists -----
async function loadLists() {
  listsStatus.textContent = 'Loading lists...';
  listsContainer.innerHTML = '';
  listsSummary.textContent = '';

  try {
    const lists = await fetchJson('api/lists.php');
    if (!lists.length) {
      listsStatus.textContent = 'No lists found.';
      return;
    }

    let totalFilms = 0;
    let totalWatched = 0;

    lists.forEach(list => {
      const total = Number(list.total_films || 0);
      const watched = Number(list.watched_films || 0);
      totalFilms += total;
      totalWatched += watched;

      const row = document.createElement('div');
      row.className = 'card-row';

      const main = document.createElement('div');
      main.className = 'card-main';

      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = list.name;

      const sub = document.createElement('div');
      sub.className = 'card-sub';
      sub.textContent = list.description || '';

      main.appendChild(title);
      if (sub.textContent) main.appendChild(sub);

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.textContent = `${watched}/${total}`;

      row.appendChild(main);
      row.appendChild(meta);

      row.addEventListener('click', () => openList(list));

      listsContainer.appendChild(row);
    });

    listsSummary.textContent = `${totalWatched}/${totalFilms} watched overall`;
    listsStatus.textContent = '';
  } catch (err) {
    console.error(err);
    listsStatus.textContent = 'Error loading lists.';
  }
}

// Add list
addListButton.addEventListener('click', async () => {
  const name = prompt('List name:');
  if (!name || !name.trim()) return;

  const description = prompt('Description (optional):') || '';

  addListButton.disabled = true;
  const originalText = addListButton.textContent;
  addListButton.textContent = 'Adding...';

  try {
    await fetchJson('api/lists_add.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim()
      })
    });

    await loadLists();
  } catch (err) {
    console.error(err);
    alert('Error adding list.');
  } finally {
    addListButton.disabled = false;
    addListButton.textContent = originalText;
  }
});

// ----- Films for a list -----
async function loadFilmsForList(list) {
  filmsStatus.textContent = 'Loading films...';
  filmsContainer.innerHTML = '';
  filmsListName.textContent = list.name;
  filmsListStats.textContent = '';

  try {
    const films = await fetchJson(`api/films.php?list_id=${encodeURIComponent(list.id)}`);
    currentFilms = films;

    if (!films.length) {
      filmsStatus.textContent = 'No films on this list yet.';
      return;
    }

    let watched = 0;

    films.forEach(film => {
      if (film.watched_at) watched++;

      const row = document.createElement('div');
      row.className = 'card-row';

      const main = document.createElement('div');
      main.className = 'card-main';

      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = film.title;

      const sub = document.createElement('div');
      sub.className = 'card-sub';
      const bits = [];
      if (film.year) bits.push(film.year);
      if (film.notes) bits.push(film.notes);
      sub.textContent = bits.join(' • ');

      main.appendChild(title);
      if (sub.textContent) main.appendChild(sub);

      const meta = document.createElement('div');
      meta.className = 'card-meta';
      const span = document.createElement('span');
      if (film.watched_at) {
        span.textContent = '✓';
        span.className = 'watched-yes';
      } else {
        span.textContent = '✗';
        span.className = 'watched-no';
      }
      meta.appendChild(span);

      row.appendChild(main);
      row.appendChild(meta);

      row.addEventListener('click', () => openFilmDetail(film));

      filmsContainer.appendChild(row);
    });

    filmsListStats.textContent = `${watched}/${films.length} watched`;
    filmsStatus.textContent = '';
  } catch (err) {
    console.error(err);
    filmsStatus.textContent = 'Error loading films.';
  }
}

function openList(list) {
  currentList = list;
  navigateTo('films');
  loadFilmsForList(list);
}

// ----- Film detail -----
function updateDetailWatchedUI() {
  if (!currentFilm) return;

  if (currentFilm.watched_at) {
    detailWatched.textContent = `Watched on ${currentFilm.watched_at}`;
    detailMarkWatched.textContent = 'Watched';
    detailMarkWatched.disabled = true;
  } else {
    detailWatched.textContent = 'Not watched yet.';
    detailMarkWatched.textContent = 'Mark watched today';
    detailMarkWatched.disabled = false;
  }
}

function openFilmDetail(film) {
  currentFilm = film;

  detailTitle.textContent = film.title;
  detailYear.textContent = film.year ? `Year: ${film.year}` : '';
  detailNotes.textContent = film.notes || 'No notes yet.';

  updateDetailWatchedUI();
  navigateTo('filmDetail');
}

// Mark watched today
detailMarkWatched.addEventListener('click', async () => {
  if (!currentFilm) return;

  detailMarkWatched.disabled = true;
  detailMarkWatched.textContent = 'Saving...';

  try {
    const updated = await fetchJson('api/film_watch.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ film_id: currentFilm.id })
    });

    // Update local state
    currentFilm = { ...currentFilm, ...updated };
    const idx = currentFilms.findIndex(f => f.id === currentFilm.id);
    if (idx !== -1) {
      currentFilms[idx] = { ...currentFilms[idx], ...updated };
    }

    updateDetailWatchedUI();

    // Refresh lists and films so counts/orderings update
    if (currentList) {
      await loadFilmsForList(currentList);
    }
    await loadLists();
  } catch (err) {
    console.error(err);
    alert('Error marking as watched.');
    detailMarkWatched.disabled = false;
    detailMarkWatched.textContent = 'Mark watched today';
  }
});

// ----- init -----
document.addEventListener('DOMContentLoaded', () => {
  showView('lists');
  loadLists();
});
