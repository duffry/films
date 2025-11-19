// ===== DOM REFERENCES =====
const views = {
  lists: document.getElementById("view-lists"),
  films: document.getElementById("view-films"),
  filmDetail: document.getElementById("view-film-detail"),
};

const backButton = document.getElementById("backButton");

// Lists view
const listsContainer = document.getElementById("listsContainer");
const listsSummary = document.getElementById("listsSummary");
const listsStatus = document.getElementById("listsStatus");
const addListButton = document.getElementById("addListButton");

// Films view
const filmsContainer = document.getElementById("filmsContainer");
const filmsListName = document.getElementById("filmsListName");
const filmsListStats = document.getElementById("filmsListStats");
const filmsStatus = document.getElementById("filmsStatus");
const addFilmButton = document.getElementById("addFilmButton");

// Film detail view
const detailTitle = document.getElementById("detailTitle");
const detailYear = document.getElementById("detailYear");
const detailWatched = document.getElementById("detailWatched");
const detailNotes = document.getElementById("detailNotes");
const detailMarkWatched = document.getElementById("detailMarkWatched");

// Edit form controls
const detailEditButton = document.getElementById("detailEditButton");
const detailEditForm = document.getElementById("detailEditForm");
const editTitleInput = document.getElementById("editTitle");
const editYearInput = document.getElementById("editYear");
const editWatchedInput = document.getElementById("editWatchedAt");
const editClearWatchedButton = document.getElementById("editClearWatched");
const editNotesInput = document.getElementById("editNotes");
const editCancelButton = document.getElementById("editCancel");
const editSaveButton = document.getElementById("editSave");

// ===== GLOBAL STATE =====
const basePath = window.location.pathname.replace(/index\.html$/, "");

let currentView = "lists";
let currentLists = [];
let currentList = null;
let currentFilms = [];
let currentFilm = null;

// ===== HELPER FUNCTIONS =====
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    console.error("Fetch error", url, res.status, text);
    throw new Error(`HTTP ${res.status}`);
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON parse error for", url, "body:", text);
    throw e;
  }
}

function setView(name) {
  Object.entries(views).forEach(([key, el]) => {
    if (el) el.hidden = key !== name;
  });
  currentView = name;
  updateBackButton();
}

function updateBackButton() {
  if (!backButton) return;
  const params = new URLSearchParams(window.location.search);
  const atRoot = currentView === "lists" && !params.get("l") && !params.get("f");
  backButton.disabled = atRoot;
  backButton.classList.toggle("back-disabled", atRoot);
}

// ===== BACK BUTTON =====
if (backButton) {
  backButton.addEventListener("click", () => {
    history.back();
  });
}

// ===== LISTS =====
async function loadLists() {
  if (listsStatus) listsStatus.textContent = "Loading lists...";
  if (listsContainer) listsContainer.innerHTML = "";
  if (listsSummary) listsSummary.textContent = "";

  try {
    const lists = await fetchJson("api/lists.php");
    currentLists = lists;

    if (!lists.length) {
      if (listsStatus) listsStatus.textContent = "No lists found.";
      return;
    }

    let totalFilms = 0;
    let totalWatched = 0;

    lists.forEach((list) => {
      const total = Number(list.total_films || 0);
      const watched = Number(list.watched_films || 0);
      totalFilms += total;
      totalWatched += watched;

      const row = document.createElement("div");
      row.className = "card-row";

      const main = document.createElement("div");
      main.className = "card-main";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = list.name;

      const sub = document.createElement("div");
      sub.className = "card-sub";
      sub.textContent = list.description || "";

      main.appendChild(title);
      if (sub.textContent) main.appendChild(sub);

      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${watched}/${total}`;

      row.appendChild(main);
      row.appendChild(meta);

      // progress bar
      const progressOuter = document.createElement("div");
      progressOuter.className = "list-progress-outer";

      const progressInner = document.createElement("div");
      progressInner.className = "list-progress-inner";
      const pct = total > 0 ? (watched / total) * 100 : 0;
      progressInner.style.width = `${pct}%`;

      progressOuter.appendChild(progressInner);
      row.appendChild(progressOuter);

      row.addEventListener("click", () => openList(list));

      if (listsContainer) listsContainer.appendChild(row);
    });

    if (listsSummary)
      listsSummary.textContent = `${totalWatched}/${totalFilms} watched overall`;
    if (listsStatus) listsStatus.textContent = "";
  } catch (err) {
    console.error(err);
    if (listsStatus) listsStatus.textContent = "Error loading lists.";
  }
}

if (addListButton) {
  addListButton.addEventListener("click", async () => {
    const name = prompt("List name:");
    if (!name || !name.trim()) return;

    const description = prompt("Description (optional):") || "";

    addListButton.disabled = true;
    const originalText = addListButton.textContent;
    addListButton.textContent = "Adding...";

    try {
      await fetchJson("api/lists_add.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      await loadLists();
    } catch (err) {
      console.error(err);
      alert("Error adding list.");
    } finally {
      addListButton.disabled = false;
      addListButton.textContent = originalText;
    }
  });
}

// ===== FILMS (LIST VIEW) =====
async function loadFilmsForList(list) {
  if (filmsStatus) filmsStatus.textContent = "Loading films...";
  if (filmsContainer) filmsContainer.innerHTML = "";
  if (filmsListName) filmsListName.textContent = list.name;
  if (filmsListStats) filmsListStats.textContent = "";

  try {
    const films = await fetchJson(
      `api/films.php?list_id=${encodeURIComponent(list.id)}`
    );
    currentFilms = films;

    if (!films.length) {
      if (filmsStatus) filmsStatus.textContent = "No films on this list yet.";
      return;
    }

    let watched = 0;

    films.forEach((film) => {
      if (film.watched_at) watched++;

      const row = document.createElement("div");
      row.className = "card-row";

      const main = document.createElement("div");
      main.className = "card-main";

      const title = document.createElement("div");
      title.className = "card-title";
      title.textContent = film.title;

      const sub = document.createElement("div");
      sub.className = "card-sub";
      const bits = [];
      if (film.year) bits.push(film.year);
      if (film.notes) bits.push(film.notes);
      sub.textContent = bits.join(" • ");

      main.appendChild(title);
      if (sub.textContent) main.appendChild(sub);

      const meta = document.createElement("div");
      meta.className = "card-meta";
      const span = document.createElement("span");
      if (film.watched_at) {
        span.textContent = "✓";
        span.className = "watched-yes";
      } else {
        span.textContent = "✗";
        span.className = "watched-no";
      }
      meta.appendChild(span);

      row.appendChild(main);
      row.appendChild(meta);

      row.addEventListener("click", () => openFilmDetail(film));

      if (filmsContainer) filmsContainer.appendChild(row);
    });

    if (filmsListStats)
      filmsListStats.textContent = `${watched}/${films.length} watched`;
    if (filmsStatus) filmsStatus.textContent = "";
  } catch (err) {
    console.error(err);
    if (filmsStatus) filmsStatus.textContent = "Error loading films.";
  }
}

function openList(list, options = {}) {
  currentList = list;

  if (options.updateUrl !== false) {
    history.pushState(null, "", `${basePath}?l=${encodeURIComponent(list.id)}`);
  }

  exitEditMode();
  setView("films");
  loadFilmsForList(list);
}

if (addFilmButton) {
  addFilmButton.addEventListener("click", async () => {
    if (!currentList) {
      alert("No list selected.");
      return;
    }

    const title = prompt("Film title:");
    if (!title || !title.trim()) return;

    const yearInput = prompt("Year (optional):") || "";
    const notes = prompt("Notes (optional):") || "";

    let year = null;
    if (yearInput.trim() !== "") {
      const y = parseInt(yearInput.trim(), 10);
      if (!Number.isNaN(y) && y > 0) {
        year = y;
      }
    }

    addFilmButton.disabled = true;
    const originalText = addFilmButton.textContent;
    addFilmButton.textContent = "Adding...";

    try {
      await fetchJson("api/films_add.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list_id: currentList.id,
          title: title.trim(),
          year,
          notes: notes.trim(),
        }),
      });

      await loadFilmsForList(currentList);
      await loadLists();
    } catch (err) {
      console.error(err);
      alert("Error adding film.");
    } finally {
      addFilmButton.disabled = false;
      addFilmButton.textContent = originalText;
    }
  });
}

// ===== FILM DETAIL + EDIT =====
function updateDetailWatchedUI() {
  if (!currentFilm) return;

  if (detailWatched) {
    if (currentFilm.watched_at) {
      detailWatched.textContent = `Watched on ${currentFilm.watched_at}`;
    } else {
      detailWatched.textContent = "Not watched yet.";
    }
  }

  if (detailMarkWatched) {
    if (currentFilm.watched_at) {
      detailMarkWatched.textContent = "Watched";
      detailMarkWatched.disabled = true;
    } else {
      detailMarkWatched.textContent = "Mark watched today";
      detailMarkWatched.disabled = false;
    }
  }
}

function renderCurrentFilm() {
  if (!currentFilm) return;

  if (detailTitle) detailTitle.textContent = currentFilm.title;
  if (detailYear) {
    detailYear.textContent = currentFilm.year
      ? `Year: ${currentFilm.year}`
      : "";
  }
  if (detailNotes) detailNotes.textContent = currentFilm.notes || "No notes yet.";
  updateDetailWatchedUI();
}

function openFilmDetail(film, options = {}) {
  currentFilm = film;
  renderCurrentFilm();

  if (options.updateUrl !== false) {
    history.pushState(
      null,
      "",
      `${basePath}?f=${encodeURIComponent(film.id)}`
    );
  }

  exitEditMode();
  setView("filmDetail");
}

if (detailMarkWatched) {
  detailMarkWatched.addEventListener("click", async () => {
    if (!currentFilm) return;

    detailMarkWatched.disabled = true;
    detailMarkWatched.textContent = "Saving...";

    try {
      const updated = await fetchJson("api/film_watch.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ film_id: currentFilm.id }),
      });

      currentFilm = { ...currentFilm, ...updated };

      const idx = currentFilms.findIndex((f) => f.id === currentFilm.id);
      if (idx !== -1) {
        currentFilms[idx] = { ...currentFilms[idx], ...updated };
      }

      renderCurrentFilm();
      if (currentList) {
        await loadFilmsForList(currentList);
      }
      await loadLists();
    } catch (err) {
      console.error(err);
      alert("Error marking as watched.");
      detailMarkWatched.disabled = false;
      detailMarkWatched.textContent = "Mark watched today";
    }
  });
}

// --- edit mode helpers ---
function enterEditMode() {
  if (!currentFilm || !detailEditForm) return;

  if (editTitleInput) editTitleInput.value = currentFilm.title || "";
  if (editYearInput) {
    editYearInput.value =
      currentFilm.year !== null && currentFilm.year !== undefined
        ? String(currentFilm.year)
        : "";
  }
  if (editNotesInput) editNotesInput.value = currentFilm.notes || "";
  if (editWatchedInput)
    editWatchedInput.value = currentFilm.watched_at || "";

  detailEditForm.hidden = false;
  if (detailEditButton) detailEditButton.disabled = true;
}

function exitEditMode() {
  if (detailEditForm) detailEditForm.hidden = true;
  if (detailEditButton) detailEditButton.disabled = false;
}

async function handleEditSubmit(event) {
  event.preventDefault();
  if (!currentFilm) return;

  const title = editTitleInput ? editTitleInput.value.trim() : "";
  if (!title) {
    alert("Title is required.");
    return;
  }

  const yearStr = editYearInput ? editYearInput.value.trim() : "";
  let year = null;
  if (yearStr !== "") {
    const y = parseInt(yearStr, 10);
    if (Number.isNaN(y) || y <= 0 || y > 9999) {
      alert("Please enter a valid year (1–9999) or leave blank.");
      return;
    }
    year = y;
  }

  const notes = editNotesInput ? editNotesInput.value.trim() : "";
  const watchedAt =
    editWatchedInput && editWatchedInput.value
      ? editWatchedInput.value
      : null;

  if (editSaveButton) {
    editSaveButton.disabled = true;
    var originalText = editSaveButton.textContent;
    editSaveButton.textContent = "Saving...";
  }

  try {
    const updated = await fetchJson("api/film_update.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        film_id: currentFilm.id,
        title,
        year,
        notes,
        watched_at: watchedAt,
      }),
    });

    currentFilm = { ...currentFilm, ...updated };

    const idx = currentFilms.findIndex((f) => f.id === currentFilm.id);
    if (idx !== -1) {
      currentFilms[idx] = { ...currentFilms[idx], ...updated };
    }

    renderCurrentFilm();
    if (currentList) {
      await loadFilmsForList(currentList);
    }
    await loadLists();

    exitEditMode();
  } catch (err) {
    console.error(err);
    alert("Error saving changes.");
  } finally {
    if (editSaveButton) {
      editSaveButton.disabled = false;
      editSaveButton.textContent = originalText;
    }
  }
}

// Hook up edit form events (all guarded)
if (detailEditButton) {
  detailEditButton.addEventListener("click", () => {
    enterEditMode();
  });
}

if (editCancelButton) {
  editCancelButton.addEventListener("click", (e) => {
    e.preventDefault();
    exitEditMode();
  });
}

if (editClearWatchedButton) {
  editClearWatchedButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (editWatchedInput) editWatchedInput.value = "";
  });
}

if (detailEditForm) {
  detailEditForm.addEventListener("submit", handleEditSubmit);
}

// ===== ROUTING =====
async function initFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const filmId = params.get("f");
  const listId = params.get("l");

  if (filmId) {
    try {
      const film = await fetchJson(
        `api/film.php?film_id=${encodeURIComponent(filmId)}`
      );

      await loadLists();

      currentList =
        currentLists.find((l) => String(l.id) === String(film.list_id)) || {
          id: film.list_id,
          name: film.list_name,
          description: film.list_description,
        };

      await loadFilmsForList(currentList);
      openFilmDetail(film, { updateUrl: false });
    } catch (err) {
      console.error(err);
      setView("lists");
      await loadLists();
    }
  } else if (listId) {
    setView("films");
    await loadLists();
    const list = currentLists.find((l) => String(l.id) === String(listId));
    if (list) {
      openList(list, { updateUrl: false });
    } else {
      setView("lists");
    }
  } else {
    setView("lists");
    await loadLists();
  }
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  initFromUrl();

  window.addEventListener("popstate", () => {
    initFromUrl();
  });
});
