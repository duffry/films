# Development Guide – Films to Watch

This guide explains how to set up, run, and work on the “Films to Watch” codebase.

For a structural overview of files and responsibilities, see `ARCHITECTURE.md`.
For API contracts and user-facing documentation, see `README.md`.

---

## 1. Project overview

A small personal web app to manage film/TV/radio watch lists:

- Browse lists (e.g. Alien, Star Wars, MCU).
- See items in a list with order, notes, and service.
- Mark items as watched.
- View statistics by service.
- See recent GitHub changes to the project.

Tech summary:

- **Frontend:** Static HTML, vanilla JS, shared CSS.
- **Backend:** PHP JSON endpoints (no framework).
- **Database:** MariaDB/MySQL (`films`, `lists`, `services`). 
- **Hosting:** Standard LAMP-style shared host.

---

## 2. Prerequisites

Minimum tools:

- Git
- PHP 7.4+ (8.x recommended)
- MariaDB/MySQL
- A web browser (for testing)
- (Optional) VS Code with:
  - PHP syntax highlighting
  - JS/HTML/CSS support

If using local development only (no remote DB), you will also need:

- A local MySQL/MariaDB server.
- Privileges to create databases and import dumps.

---

## 3. Getting the code

Clone the repo:

```bash
git clone <YOUR_REPO_URL> films
cd films
```

Recommended local structure:

```text
films/
  index.html
  stats.html
  changes.html
  app.js
  stats.js
  changes.js
  styles.css
  api/
  ARCHITECTURE.md
  DEVELOPMENT_GUIDE.md
  README.md
  .gitignore
  helpers/        # local-only tools, dumps, zips (ignored by git)
```

The `helpers/` directory is for local-only artefacts such as database dumps and zips. It should be listed in `.gitignore` so it is not committed.

---

## 4. Database setup

### 4.1 Schema

The database consists of three tables: fileciteturn0file0

- **lists**
  - `id` (PK, int, auto-increment)
  - `name` (varchar)
  - `description` (text, nullable)

- **services**
  - `id` (PK, unsigned int, auto-increment)
  - `name` (varchar)
  - `code` (varchar, unique) – used in the UI for icons/labels.

- **films**
  - `id` (PK, int, auto-increment)
  - `list_id` (FK → lists.id)
  - `display_order` (int, nullable) – controls ordering within list.
  - `title` (varchar)
  - `year` (int, nullable)
  - `notes` (text, nullable)
  - `watched_at` (date, nullable)
  - `service_id` (FK → services.id, nullable)

Foreign keys:

- `films.list_id` → `lists.id`
- `films.service_id` → `services.id`

### 4.2 Creating the database locally

1. Create a database (name it anything, e.g. `films_to_watch`).
2. Import the provided SQL dump:

   ```bash
   mysql -u <user> -p films_to_watch < db5019017679_hosting-data_io.sql
   ```

3. Confirm tables exist:

   ```sql
   SHOW TABLES;
   DESCRIBE films;
   DESCRIBE lists;
   DESCRIBE services;
   ```

### 4.3 Configuring `api/db.php`

`api/db.php` contains the DSN, username, and password for connecting to the database.

For local development you will typically set something like:

```php
$dsn = 'mysql:host=127.0.0.1;dbname=films_to_watch;charset=utf8mb4';
$user = 'your_local_user';
$pass = 'your_local_password';
```

**Important:**  
Never commit real production passwords. Prefer one of:

- A separate `db.local.php` that is required from `db.php` but is in `.gitignore`.
- Environment variables parsed in `db.php`.

---

## 5. Running the app locally

### 5.1 Simple PHP built-in server (recommended for quick dev)

From the repo root:

```bash
php -S localhost:8000
```

Then visit:

- `http://localhost:8000/index.html` – main app
- `http://localhost:8000/stats.html` – stats view
- `http://localhost:8000/changes.html` – GitHub changes

The built-in server will route requests to the `api/` directory when scripts are requested, e.g. `http://localhost:8000/api/lists.php`.

### 5.2 Using Apache / nginx

If you prefer a more “real” environment:

- Point Apache’s document root at the repo directory.
- Ensure PHP is enabled.
- Configure virtual host, e.g. `films.local.test` → repo folder.
- Make sure the database config in `api/db.php` matches your DB settings.

---

## 6. Development workflow

### 6.1 General flow

1. **Create a branch** for each meaningful change (even if you are solo):

   ```bash
   git checkout -b feature/<short-description>
   ```

2. **Make changes**:

   - Update HTML/JS/CSS in small, logical chunks.
   - Keep APIs and DB changes tightly scoped.

3. **Test locally**:

   - Use the browser console and network tab.
   - Hit API endpoints directly (`/api/*.php`) if needed.

4. **Commit** with descriptive messages:

   ```bash
   git commit -am "Add stats by service view"
   ```

5. **Merge** back to main (via GitHub PR or local merge), then deploy.

### 6.2 Coding conventions

#### JavaScript

- All API calls should go through the shared helper (`fetchJson` or equivalent).
- Use `const`/`let` rather than `var`.
- Group code by view where possible (lists, films, stats, changes).
- Prefer small pure functions for formatting and rendering (e.g. service pills, dates).

#### PHP

- Use prepared statements for any queries that take user input.
- Check HTTP method explicitly (`$_SERVER['REQUEST_METHOD']`).
- Return consistent JSON shapes with `json_response()`.
- Handle errors by:
  - Logging (or at least `error_log`) server-side details.
  - Returning a simple `{ "error": "Message" }` to the client with a non-200 status code.

#### HTML/CSS

- Reuse components defined in `styles.css` (e.g. card lists, buttons, pills).
- Put new content into logical sections (`<section id="view-...">`) and wire them to JS views as needed.
- Try to keep global styles minimal and favour class-based styling.

---

## 7. Adding features safely

### 7.1 New API endpoint

1. Create a script under `api/`, e.g. `api/films_delete.php`.
2. Follow the standard pattern:
   - `require 'db.php';`
   - Check method / inputs.
   - Perform DB work in a `try/catch`.
   - Return `json_response([...])` on success or `json_response(['error' => ...], 400/500)` on error.
3. Update `README.md` with the new endpoint and payload schema.
4. Update the frontend JS to call the endpoint using `fetchJson`.
5. Test both success and expected error cases.

### 7.2 New view or page

- **New page (e.g. `upcoming.html`)**
  - Create HTML file with the same header/footer pattern.
  - Link `styles.css` and a new JS file, e.g. `upcoming.js`.
  - Implement page-specific JS there.

- **New view within `index.html`**
  - Add new `<section id="view-...">`.
  - Add an entry in the `views` map in `app.js`.
  - Update view-switching logic and back button behaviour.
  - Implement the rendering and event handlers in `app.js` for that view.

### 7.3 Database changes

1. Write a migration script or a short SQL file for the change (kept in `helpers/migrations/` or similar, ignored by git if private).
2. Apply it to local DB.
3. Update any dependent API queries.
4. Update `README.md` (schema) and `ARCHITECTURE.md` if relationships change.
5. Deploy DB change before or at the same time as code that depends on it.

---

## 8. Deployment

Exact steps depend on your hosting, but the general pattern is:

1. Commit and push to GitHub.
2. Build any artefacts if needed (currently none – static + PHP only).
3. Upload files to hosting (e.g. via FTP, SFTP, or provider’s deploy tool).
4. Ensure `api/db.php` on the server is configured with production DB credentials.
5. If DB schema changed, run migrations on production DB.

**Tip:** keep a text file or checklist in `helpers/deploy-notes.md` to record the last production deploy date, commit hash, and any DB changes applied.

---

## 9. Backups and data safety

- Keep regular database dumps in the local `helpers/` directory (ignored by git).
- Name them with dates, e.g. `helpers/db-dump-2025-11-21.sql`.
- Optionally mirror important dumps to cloud storage (encrypted, if sensitive).

Example dump command:

```bash
mysqldump -u <user> -p films_to_watch > helpers/db-dump-$(date +%F).sql
```

---

## 10. Useful commands (cheat sheet)

```bash
# Run local PHP server
php -S localhost:8000

# Import a DB dump
mysql -u <user> -p films_to_watch < db5019017679_hosting-data_io.sql

# Create a new branch
git checkout -b feature/new-thing

# See what changed since last commit
git status
git diff

# Discard local changes to a file
git checkout -- path/to/file
```

---

*Last updated: 2025-11-21*
