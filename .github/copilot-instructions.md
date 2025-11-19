# Copilot Instructions for AI Agents

## Project Overview
- **Films to Watch** is a lightweight web app for tracking film/TV watch lists.
- **Architecture:**
  - Static front-end: `index.html`, `styles.css`, `app.js`
  - Thin PHP API: `/api/*.php` (stateless, JSON responses)
  - MariaDB/MySQL database (see schema below)
- No frameworks or build steps; everything is designed for clarity and easy modification.

## Key Patterns & Conventions
- **Front-end:**
  - Pure HTML/CSS/vanilla JS; no frameworks or transpilers.
  - SPA-style navigation via `history.pushState` and `popstate`.
  - Data is fetched from `/api/*.php` endpoints using `fetch` and handled as JSON.
  - Progress bars and service icons are rendered dynamically based on API data.
- **Back-end:**
  - Each PHP file in `/api/` is a single-purpose endpoint (e.g., `films.php`, `film_watch.php`).
  - All API responses are JSON; errors return `{ "error": "..." }` with appropriate HTTP status.
  - Database access via PDO; credentials in `api/db.php`.
- **Database:**
  - Three main tables: `lists`, `films`, `services` (see `README.md` for schema).
  - `films` references `lists` and `services` by foreign key.

## Developer Workflows
- **Local setup:**
  1. Create the database and run the schema from `README.md`.
  2. Edit `api/db.php` with your credentials.
  3. Place files in your PHP web root and access via browser.
- **No build or test scripts**; changes are live on refresh.
- **Debugging:**
  - Use browser dev tools for front-end.
  - For API, inspect JSON responses and PHP errors (enable error reporting in dev).

## Integration Points
- **API endpoints:**
  - `GET /api/lists.php` — all lists with stats
  - `POST /api/lists_add.php` — add a list
  - `GET /api/films.php?list_id=...` — films for a list
  - `POST /api/films_add.php` — add a film
  - `POST /api/film_watch.php` — mark film watched
  - `GET /api/film.php?film_id=...` — film details
  - `POST /api/film_update.php` — update film
  - `GET /api/services.php` — all services
- **Service icons:** `/img/<code>.png` or fallback to initial letter

## Project-Specific Advice
- Keep code simple and readable; avoid over-engineering.
- When adding features, follow the single-file-per-endpoint pattern in `/api/`.
- Use the existing JSON structure for new API responses.
- Reference `README.md` for schema and endpoint details.

## References
- See `README.md` for schema, API, and setup details.
- See `/api/` for endpoint implementations.
- See `app.js` for front-end data flow and SPA logic.
