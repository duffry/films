# Films to Watch

A small personal web app for managing film/TV/radio watch lists and tracking what has been watched, where it is available, and high-level stats by service.

- Browse themed lists (Alien, Star Wars, MCU, etc.).
- View ordered items in each list with notes and streaming service.
- Mark items as watched and see history.
- View statistics by service (how much is on Disney+, Netflix, Prime, etc.).
- See recent GitHub changes to the project.

---

## 1. Tech stack

- **Frontend:** Static HTML (`index.html`, `stats.html`, `changes.html`), vanilla JS (`app.js`, `stats.js`, `changes.js`), single shared CSS file (`styles.css`).
- **Backend:** PHP-based JSON endpoints in `api/` using PDO.
- **Database:** MariaDB/MySQL with three core tables: `films`, `lists`, `services`. fileciteturn0file0
- **Hosting:** Standard LAMP-style shared hosting.

For more structural detail, see `ARCHITECTURE.md`.  
For setup and workflow, see `DEVELOPMENT_GUIDE.md`.

---

## 2. Features

- **Lists view (main app):**
  - Shows all lists with description and summary counts (total, watched, last watched).
  - Click a list to see its items.

- **Films view:**
  - Shows items in a list in a specified display order.
  - Shows title, year, notes snippet, and service pill.
  - Click an item to open the detail view.

- **Film detail view:**
  - Full notes, year, service, and watched status.
  - Mark item as watched (sets `watched_at`).
  - Edit title/year/notes/watched.

- **Stats view (`stats.html`):**
  - Aggregated counts by service (watched/unwatched, totals, percentages).
  - Drill into all items on a particular service.

- **Changes view (`changes.html`):**
  - Displays recent GitHub commits for this repo via the GitHub API.

---

## 3. Database schema (summary)

**lists**

| Column      | Type        | Notes                        |
|------------|-------------|------------------------------|
| `id`       | int, PK     | Auto-increment               |
| `name`     | varchar     | List name                    |
| `description` | text     | Optional description         |

**services**

| Column | Type                 | Notes                         |
|--------|----------------------|-------------------------------|
| `id`   | unsigned int, PK     | Auto-increment                |
| `name` | varchar              | Human-readable name           |
| `code` | varchar, unique      | Short code used in the UI     |

**films**

| Column         | Type        | Notes                                       |
|----------------|-------------|---------------------------------------------|
| `id`           | int, PK     | Auto-increment                              |
| `list_id`      | int, FK     | References `lists.id`                       |
| `display_order`| int         | Controls ordering within a list             |
| `title`        | varchar     | Title of film/episode/etc.                  |
| `year`         | int         | Release year (optional)                     |
| `notes`        | text        | Free-text notes (optional)                  |
| `watched_at`   | date        | Date watched (optional)                     |
| `service_id`   | int, FK     | References `services.id` (optional)        |

Foreign key constraints:

- `films.list_id` → `lists.id`
- `films.service_id` → `services.id`

See the SQL dump in `helpers/` (not committed) for full DDL and seed data.

---

## 4. API overview

All endpoints live under `/api/` and return JSON.

### Lists

- `GET /api/lists.php`  
  Returns all lists with basic aggregate stats per list (film counts, watched counts, last watched date).

- `POST /api/lists_add.php`  
  Body: `{"name": string, "description": string|null}`  
  Creates a new list.

### Films

- `GET /api/films.php?list_id={id}`  
  Returns all films for a given list, including service information.

- `GET /api/film.php?id={id}`  
  Returns a single film’s details.

- `POST /api/films_add.php`  
  Body typically includes `list_id`, `title`, `year?`, `notes?`, `service_id?`.

- `POST /api/film_update.php`  
  Updates fields such as `title`, `year`, `notes`, `watched_at`, `service_id` for a film.

- `POST /api/film_watch.php`  
  Marks a film as watched (or clears watched status).

### Services

- `GET /api/services.php`  
  Returns all services (id, name, code).

### Stats

- `GET /api/stats_services.php`  
  Returns per-service aggregates (totals, watched/unwatched, percentages).

- `GET /api/stats_service_items.php?service_id={id}`  
  Returns items attached to a given service.

> **Note:** This is a descriptive summary. For the exact request/response shapes, refer to the implementations in `api/` and the calling code in `app.js`/`stats.js`.

---

## 5. Local development (quick start)

1. **Clone the repo:**

   ```bash
   git clone <YOUR_REPO_URL> films
   cd films
   ```

2. **Set up the database:**
   - Create a database locally (e.g. `films_to_watch`).
   - Import the SQL dump from `helpers/`:

     ```bash
     mysql -u <user> -p films_to_watch < helpers/db5019017679_hosting-data_io.sql
     ```

3. **Configure DB connection:**  
   Edit `api/db.php` and point it at your local database with username/password.

4. **Run a PHP dev server:**

   ```bash
   php -S localhost:8000
   ```

5. **Open in a browser:**

   - Main app: `http://localhost:8000/index.html`
   - Stats: `http://localhost:8000/stats.html`
   - Changes: `http://localhost:8000/changes.html`

See `DEVELOPMENT_GUIDE.md` for more detailed instructions and workflow.

---

## 6. Project structure

See `ARCHITECTURE.md` for a more detailed map. In short:

```text
/
├── index.html          # Main app (lists + films)
├── stats.html          # Service statistics
├── changes.html        # Recent GitHub commits
├── app.js              # Main SPA logic
├── stats.js            # Stats page logic
├── changes.js          # Changes page logic
├── styles.css          # Shared styles
├── api/                # PHP JSON endpoints
├── ARCHITECTURE.md     # Structural overview
├── DEVELOPMENT_GUIDE.md# This file: development workflow and setup
├── README.md           # You are here
├── .gitignore          # Git ignore rules
└── helpers/            # Local-only helpers (dumps, zips, notes; ignored by git)
```

---

## 7. Contributing / future you

This is primarily a personal project, but if you (or someone else) contribute in future:

- Keep commits focused and descriptive.
- Update both:
  - `ARCHITECTURE.md` when structure/responsibilities change.
  - `DEVELOPMENT_GUIDE.md` if setup or workflow changes.
- If adding non-trivial features or changing API shapes, document them in this `README`.

You can add a dedicated `CONTRIBUTING.md` later if the project becomes multi-contributor.

---

*Last updated: 2025-11-21*
