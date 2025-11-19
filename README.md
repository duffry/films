# Films to Watch

A small web app for tracking film/TV watch lists.

The app is deliberately lightweight:

- Static front-end (`index.html`, `styles.css`, `app.js`)
- Thin PHP API layer (`/api/*.php`)
- MariaDB / MySQL database

Everything is designed to be understandable and tweakable without a big framework.

---

## Features

- **Lists of films/series**
  - Create named lists (e.g. *Kevin Smith*, *Lord of the Rings*, *Fallout*).
  - See overall progress per list (watched / total) with a subtle progress bar.
  - Global progress summary across all lists.

- **Films within a list**
  - Add films or episodes with title, year and notes.
  - Visual progress bar for each film (unwatched vs watched).
  - Optional *service* badge on the right (e.g. Disney+, DVD, YouTube).

- **Film detail page**
  - Shows title, year, service, watched date and notes.
  - “Mark watched today” button to quickly set the watched date.
  - Edit form to update title, year, notes, watched date and service.

- **Data-driven services**
  - Separate `services` table (Netflix, Disney+, Cinema, DVD, YouTube, etc.).
  - Service is stored by id in `films.service_id`.
  - Front-end shows either a small icon from `/img/<code>.png` or falls back to an initial (“D”, “N”, “Y”, or `?`).

- **URL routing**
  - `?l=<list_id>` opens a specific list.
  - `?f=<film_id>` opens a specific film detail.
  - Uses `history.pushState` + `popstate` for SPA-style navigation (back button works as expected).

---

## Tech stack

- **Front-end:** HTML, CSS, vanilla JavaScript  
- **Back-end:** PHP 8.x, PDO  
- **Database:** MariaDB / MySQL  
- **Hosting:** any basic LAMP-style shared hosting (tested on IONOS)

No frameworks, build steps or package managers are required.

---

## Database schema

Minimal overview (column types can be adjusted to your taste).

```sql
-- Lists of films/series
CREATE TABLE lists (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Streaming / viewing services
CREATE TABLE services (
  id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20)  NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Films / episodes
CREATE TABLE films (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  list_id       INT UNSIGNED NOT NULL,
  display_order INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  year          INT NULL,
  notes         TEXT NULL,
  watched_at    DATE NULL,
  service_id    INT UNSIGNED NULL,
  CONSTRAINT fk_films_list
    FOREIGN KEY (list_id) REFERENCES lists(id),
  CONSTRAINT fk_films_service
    FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

You can seed `services` with whatever you use most, for example:

```sql
INSERT INTO services (name, code) VALUES
('Disney+',            'disney'),
('Netflix',            'netflix'),
('Amazon Prime Video', 'prime'),
('Apple TV+',          'appletv'),
('BBC iPlayer',        'iplayer'),
('NOW',                'now'),
('Cinema',             'cinema'),
('DVD / Blu-ray',      'disc'),
('YouTube',            'youtube'),
('Radio / Audio',      'audio'),
('Other / Unknown',    'other');
```

---

## API endpoints

All responses are JSON. Errors return a JSON `{ "error": "...", ... }` with an appropriate HTTP status.

- `GET /api/lists.php`  
  Returns all lists with aggregate stats:

  ```json
  [
    {
      "id": 1,
      "name": "Kevin Smith",
      "description": "All Kevin Smith films",
      "total_films": 16,
      "watched_films": 2,
      "last_watched_at": "2025-10-24"
    }
  ]
  ```

- `POST /api/lists_add.php`  
  Body: `{ "name": "...", "description": "..." }`  
  Creates a new list.

- `GET /api/films.php?list_id=1`  
  Returns all films for a list, including service data.

- `POST /api/films_add.php`  
  Body: `{ "list_id": 1, "title": "...", "year": 2024, "notes": "...", "service_id": 3 }`  
  Adds a film/episode to a list (service_id optional).

- `POST /api/film_watch.php`  
  Body: `{ "film_id": 42 }`  
  Sets `watched_at` to *today* for the given film.

- `GET /api/film.php?film_id=42`  
  Returns a single film plus its parent list info.

- `POST /api/film_update.php`  
  Body:

  ```json
  {
    "film_id": 42,
    "title": "New title",
    "year": 2024,
    "notes": "Updated notes",
    "watched_at": "2025-01-01",
    "service_id": 3
  }
  ```

  Updates core film fields and returns the updated record.

- `GET /api/services.php`  
  Returns all services for populating the edit dropdown.

---

## Configuration

Edit `api/db.php` with your own database credentials:

```php
<?php
$dsn  = 'mysql:host=YOUR_HOST;dbname=YOUR_DB_NAME;charset=utf8mb4';
$user = 'YOUR_DB_USER';
$pass = 'YOUR_DB_PASSWORD';

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

$pdo = new PDO($dsn, $user, $pass, $options);

function json_response($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
```

---

## Running locally

1. Create the database and run the schema SQL.
2. Configure `api/db.php`.
3. Place the repo in your PHP web root, e.g.:

   ```text
   /var/www/html/films/...
   ```

4. Access `http://localhost/films/` in your browser.

On shared hosting, just upload the files to the desired directory and point the domain/subdomain at it.

---

## Future ideas

- Drag-and-drop reordering of films within a list.
- Filters (e.g. show only unwatched items, or only items on a specific service).
- Per-user authentication and personalised lists.
- Export/import lists as JSON or CSV.

---

## Licence

This project is licensed under the MIT License.

```text
MIT License

Copyright (c) 2025 Dom Hobbs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
