// ----- DOM refs -----
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

// Films view
const filmsContainer = document.getElementById('filmsContainer');
const filmsListName = document.getElementById('filmsListName');
const filmsListStats = document.getElementById('filmsListStats');
const filmsStatus = document.getElementById('filmsStatus');

// Detail view
const detailTitle = document.getElementById('detailTitle');
const detailYear = document.getElementById('detailYear');
const detailNotes = document.getElementById('detailNotes');

// ----- state -----
let currentView = 'lists';
let viewStack = ['lists'];
let currentList = null;
let currentFilms = []; // cache films for current list

// ----- helpers -----
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch error', url, res.status, text);
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
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
      totalFilms += Number(list.total_films || 0);
      totalWatched += Number(list.watched_films || 0);

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
      meta.textContent = `${list.watched_films}/${list.total_films}`;

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
function openFilmDetail(film) {
  detailTitle.textContent = film.title;
  detailYear.textContent = film.year ? `Year: ${film.year}` : '';
  detailNotes.textContent = film.notes || 'No notes yet.';

  navigateTo('filmDetail');
}

// ----- init -----
document.addEventListener('DOMContentLoaded', () => {
  showView('lists'); // initial
  loadLists();
});
