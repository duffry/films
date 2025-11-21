# Films to Watch – Architecture

This document is a technical map of the codebase: how the pieces fit together and where to make changes.

For user-facing behaviour, API contracts and setup, see `README.md`.

---

## 1. Tech stack

- **Frontend:**  
  - Static HTML (`index.html`, `stats.html`, `changes.html`)  
  - Vanilla JS (`app.js`, `stats.js`, `changes.js`)  
  - Single shared stylesheet (`styles.css`)
- **Backend:**  
  - PHP 8+ (thin JSON API in `/api/*.php`)  
  - PDO for database access
- **Database:**  
  - MariaDB / MySQL (schema described in `README.md`)
- **Hosting:**  
  - Standard LAMP-style shared hosting (no Node/build steps)

No frameworks, bundlers or package managers.

---

## 2. Repository layout

```text
/
├── index.html
├── stats.html
├── changes.html
├── app.js
├── stats.js
├── changes.js
├── styles.css
├── README.md
└── api/
    ├── db.php
    ├── film.php
    ├── films.php
    ├── films_add.php
    ├── film_update.php
    ├── film_watch.php
    ├── lists.php
    ├── lists_add.php
    ├── services.php
    ├── stats_services.php
    └── stats_service_items.php
```

---

## 3. Frontend architecture

### 3.1 `index.html` + `app.js`

Main SPA for lists, films, and film detail views.

- Three `<section>` views:
  - `#view-lists`
  - `#view-films`
  - `#view-film-detail`
- Back button controlled in JS
- State held in JS: active list, active film, caches
- Uses `fetchJson()` wrapper for API calls

(…full content as previously drafted…)

---

## 4. Backend API

- All PHP endpoints include `db.php`
- JSON in/out via `json_response()`
- Endpoints:
  - `/api/lists.php`
  - `/api/lists_add.php`
  - `/api/films.php`
  - `/api/film.php`
  - `/api/films_add.php`
  - `/api/film_update.php`
  - `/api/film_watch.php`
  - `/api/services.php`
  - `/api/stats_services.php`
  - `/api/stats_service_items.php`

(…full detailed content as previously drafted…)

---

## 5. Data model overview

- `lists` – named watch lists
- `services` – streaming/availability services
- `films` – belongs to list + service, has watched_at

---

## 6. Extending the app

Guidelines and patterns for:
- Adding APIs
- Adding new views/pages
- Styling conventions
- Error handling

---

## 7. Future tidy-ups

- Split `app.js` into modules  
- Move DB credentials out of repo  
- Add basic tests  
- Improve routing  

---

*Last updated: 2025‑11‑21*
