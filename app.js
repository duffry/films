const listSelect = document.getElementById('listSelect');
const filmsTableBody = document.querySelector('#filmsTable tbody');
const statusEl = document.getElementById('status');

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadLists() {
  statusEl.textContent = 'Loading lists...';
  try {
    const lists = await fetchJson('./api/lists.php');
    listSelect.innerHTML = '';

    lists.forEach(list => {
      const opt = document.createElement('option');
      opt.value = list.id;
      opt.textContent = list.name;
      listSelect.appendChild(opt);
    });

    statusEl.textContent = lists.length ? '' : 'No lists found.';
    if (lists.length) {
      await loadFilmsForList(lists[0].id);
    }
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error loading lists.';
  }
}

async function loadFilmsForList(listId) {
  statusEl.textContent = 'Loading films...';
  filmsTableBody.innerHTML = '';

  try {
    const films = await fetchJson(`./api/films.php?list_id=${encodeURIComponent(listId)}`);

    if (!films.length) {
      statusEl.textContent = 'No films on this list yet.';
      return;
    }

    films.forEach(film => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${film.title}</td>
        <td>${film.year ?? ''}</td>
        <td>${film.notes ?? ''}</td>
        <td>${film.watched_at ? film.watched_at : ''}</td>
      `;

      filmsTableBody.appendChild(tr);
    });

    statusEl.textContent = '';
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error loading films.';
  }
}

listSelect.addEventListener('change', () => {
  const listId = listSelect.value;
  if (listId) {
    loadFilmsForList(listId);
  }
});

document.addEventListener('DOMContentLoaded', loadLists);
