# Habitual

A personal PWA to track a fixed weekly fitness and language learning schedule. Dark, premium UI. Runs as a single Docker Compose stack — deployable on Dokploy with a Cloudflare Tunnel for HTTPS.

## Stack

| Layer | Tech |
|-------|------|
| Database | PostgreSQL 16 |
| API | Node.js / Express |
| Frontend | Vanilla HTML / CSS / JS + Tailwind CDN |
| Deployment | Dokploy + Cloudflare Tunnel |
| Mobile | iPhone PWA (Add to Home Screen) |

## Repo structure

```
api/            Express server + Dockerfile
db/             schema.sql (auto-applied on first run)
frontend/       index.html + manifest.json
widget/         Scriptable iPhone widget
docker-compose.yml
```

---

## Deploying on Dokploy

### 1. Push the repo

Push this repo to a Git provider (GitHub, Gitea, etc.) that your Dokploy server can reach.

### 2. Create a new Dokploy application

1. In Dokploy → **Projects** → **New Application** → choose **Docker Compose**.
2. Point it at your repo and set the compose file to `docker-compose.yml`.
3. Deploy — Dokploy will build the `api` image and pull Postgres automatically.

### 3. Configure the Cloudflare Tunnel

In the Cloudflare Zero Trust dashboard add a public hostname that routes to `localhost:8001` (or the internal address Dokploy exposes). HTTPS is handled automatically.

### 4. Add the PWA to your iPhone

1. Open the app URL in Safari.
2. Tap **Share → Add to Home Screen**.
3. The app installs as a full-screen PWA.

### 5. (Optional) Add PWA icons

Place two PNG files in `frontend/`:
- `icon-192.png` — 192 × 192 px
- `icon-512.png` — 512 × 512 px

Without these, the default browser icon is used.

---

## Scriptable widget

1. Install [Scriptable](https://scriptable.app/) on your iPhone.
2. Copy the contents of `widget/weekly-plan.js` into a new Scriptable script.
3. Set `BASE_URL` at the top of the script to your server URL.
4. Add a Scriptable widget to your home screen and select the script.

---

## Local development

```bash
docker compose up --build
```

App is available at `http://localhost:8001`.

To reset the database (drops all data):

```bash
docker compose down -v && docker compose up --build
```
