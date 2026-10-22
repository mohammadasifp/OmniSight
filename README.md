<<<<<<< HEAD
# OmniSight

OmniSight is an AI-powered UI inspection and self-healing platform. The current
implementation provides a FastAPI backend that opens a website with Playwright,
captures screenshots at desktop, tablet, and mobile sizes, and reports
horizontal-overflow findings. Inspection results are stored in a local SQLite
database.

> **Project status:** The backend inspection API is implemented. The `frontend/`
> directory is currently an empty scaffold; there is no frontend application to
> run yet.

## Features

- Inspect a website using headless Chromium.
- Capture full-page screenshots at three viewport sizes:
  - Desktop: 1440 × 900
  - Tablet: 768 × 1024
  - Mobile: 390 × 844
- Detect horizontal page overflow at each viewport.
- Persist inspection results and expose inspection history and details.
- Provide interactive API documentation through FastAPI.

## Requirements

- Python
- Chromium support for Playwright

## Run the backend

From the repository root, create and activate a virtual environment, install
the backend requirements, and install Playwright's Chromium browser:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m playwright install chromium
```

Start the API server from the `backend/` directory:

```powershell
python -m uvicorn app.main:app --reload
```

The API is available at <http://127.0.0.1:8000>. Open
<http://127.0.0.1:8000/docs> for the interactive API reference.

## API

### Health check

```http
GET /health
```

Returns the service status, project name, and API version.

### Create an inspection

```http
POST /api/inspections
Content-Type: application/json
```

Request:

```json
{
  "url": "https://example.com"
}
```

The URL must be valid. A successful response includes an inspection ID, page
title, screenshot paths, and any findings. The current implementation always
checks the three viewport sizes listed above.

Example using `curl`:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/inspections `
  -H "Content-Type: application/json" `
  -d '{"url":"https://example.com"}'
```

### List inspection history

```http
GET /api/inspections
```

Returns saved inspections, newest first.

### Get inspection details

```http
GET /api/inspections/{inspection_id}
```

Returns the stored result, including findings and screenshot paths. Returns
`404` if the inspection ID does not exist.

## Stored data

The backend creates these files as needed:

- `backend/artifacts/omnisight.db` — SQLite inspection history.
- `backend/artifacts/screenshots/` — generated desktop, tablet, and mobile
  screenshots.

Screenshot paths are returned in API responses as local filesystem paths; the
API does not currently provide a route for serving the image files.

## Project layout

```text
backend/
  app/
    api/          Inspection endpoints
    db/           SQLite connection and initialization
    schemas/      Request models
    services/     Browser inspection and history persistence
    main.py       FastAPI application and health endpoint
  requirements.txt
frontend/         Empty frontend scaffold (not yet implemented)
demo-site/        Reserved for a demo site
```

## Browser smoke check

The optional `backend/test_playwright.py` script opens `https://example.com`
with Playwright and prints the page title. Run it from `backend/` after
installing requirements and Chromium:

```powershell
python test_playwright.py
```
=======
# OmniSight

OmniSight is an AI-powered UI inspection and self-healing platform. The current
implementation provides a FastAPI backend that opens a website with Playwright,
captures screenshots at desktop, tablet, and mobile sizes, and reports
horizontal-overflow findings. Inspection results are stored in a local SQLite
database.

> **Project status:** The backend inspection API is implemented. The `frontend/`
> directory is currently an empty scaffold; there is no frontend application to
> run yet.

## Features

- Inspect a website using headless Chromium.
- Capture full-page screenshots at three viewport sizes:
  - Desktop: 1440 × 900
  - Tablet: 768 × 1024
  - Mobile: 390 × 844
- Detect horizontal page overflow at each viewport.
- Persist inspection results and expose inspection history and details.
- Provide interactive API documentation through FastAPI.

## Requirements

- Python
- Chromium support for Playwright

## Run the backend

From the repository root, create and activate a virtual environment, install
the backend requirements, and install Playwright's Chromium browser:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m playwright install chromium
```

Start the API server from the `backend/` directory:

```powershell
python -m uvicorn app.main:app --reload
```

The API is available at <http://127.0.0.1:8000>. Open
<http://127.0.0.1:8000/docs> for the interactive API reference.

## API

### Health check

```http
GET /health
```

Returns the service status, project name, and API version.

### Create an inspection

```http
POST /api/inspections
Content-Type: application/json
```

Request:

```json
{
  "url": "https://example.com"
}
```

The URL must be valid. A successful response includes an inspection ID, page
title, screenshot paths, and any findings. The current implementation always
checks the three viewport sizes listed above.

Example using `curl`:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/inspections `
  -H "Content-Type: application/json" `
  -d '{"url":"https://example.com"}'
```

### List inspection history

```http
GET /api/inspections
```

Returns saved inspections, newest first.

### Get inspection details

```http
GET /api/inspections/{inspection_id}
```

Returns the stored result, including findings and screenshot paths. Returns
`404` if the inspection ID does not exist.

## Stored data

The backend creates these files as needed:

- `backend/artifacts/omnisight.db` — SQLite inspection history.
- `backend/artifacts/screenshots/` — generated desktop, tablet, and mobile
  screenshots.

Screenshot paths are returned in API responses as local filesystem paths; the
API does not currently provide a route for serving the image files.

## Project layout

```text
backend/
  app/
    api/          Inspection endpoints
    db/           SQLite connection and initialization
    schemas/      Request models
    services/     Browser inspection and history persistence
    main.py       FastAPI application and health endpoint
  requirements.txt
frontend/         Empty frontend scaffold (not yet implemented)
demo-site/        Reserved for a demo site
```

## Browser smoke check

The optional `backend/test_playwright.py` script opens `https://example.com`
with Playwright and prints the page title. Run it from `backend/` after
installing requirements and Chromium:

```powershell
python test_playwright.py
```
>>>>>>> 02785561198e511e626dfea43ccb0ea082526e93
