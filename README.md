# Habitual

A personal PWA to track a fixed weekly fitness and language learning schedule. Dark, premium UI. Runs as a single Docker Compose stack, deployed on a self-hosted server via Dokploy and exposed over HTTPS with Cloudflare Tunnels. Installable as a full-screen app on iPhone and works in any desktop browser.

---

## Prerequisites

- A server running [Dokploy](https://dokploy.com/) (Docker must be available on it)
- A [Cloudflare](https://cloudflare.com/) account with a domain and Zero Trust enabled
- Git access to push this repo somewhere Dokploy can pull from (GitHub, Gitea, etc.)
- An iPhone with Safari for the PWA install (optional)
- [Scriptable](https://scriptable.app/) for the home screen widget (optional)

---

## 1. Local development

The fastest way to verify everything works before deploying.

**Requirements:** Docker and Docker Compose installed on your machine.

```bash
git clone <your-repo-url> habitual
cd habitual
docker compose up --build
```

Open `http://localhost:8001` in your browser. The database schema is applied automatically on first boot.

To wipe all data and start fresh:

```bash
docker compose down -v
docker compose up --build
```

---

## 2. Deploy on Dokploy

### 2a. Push the repo

Push this repo to any Git provider your Dokploy server can reach — GitHub, a private Gitea instance, etc.

### 2b. Create the application in Dokploy

1. Log into your Dokploy dashboard.
2. Go to **Projects** → **New Project** → give it a name (e.g. `habitual`).
3. Inside the project, click **New Service** → **Application**.
4. Under **Source**, choose **Git** and connect your repo.
5. Set **Build type** to **Docker Compose** and point the compose file path to `docker-compose.yml`.
6. Click **Deploy**. Dokploy will build the `api` image and pull the Postgres image automatically.

Once deployed the app is running internally on port `8001`.

### 2c. Set up the Cloudflare Tunnel

A Cloudflare Tunnel gives you HTTPS without opening any ports on your server.

1. In the [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/), go to **Networks → Tunnels**.
2. Create a new tunnel and follow the connector install instructions for your server (runs as a Docker container or system service).
3. Under **Public Hostnames**, add a hostname:
   - **Subdomain / domain:** e.g. `habitual.yourdomain.com`
   - **Service type:** `HTTP`
   - **URL:** `localhost:8001`
4. Save. Cloudflare handles TLS automatically — your app is now reachable at `https://habitual.yourdomain.com`.

---

## 3. Add the PWA to your iPhone

1. Open `https://habitual.yourdomain.com` in **Safari** (must be Safari, not Chrome).
2. Tap the **Share** icon (box with arrow) at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Give it a name and tap **Add**.

The app will appear on your home screen and opens full-screen with no browser chrome, like a native app.

### Optional: add a custom icon

By default the iPhone will use a screenshot of the page as the icon. To use a proper icon instead, add two PNG files to `frontend/` before deploying:

| File | Size |
|------|------|
| `frontend/icon-192.png` | 192 × 192 px |
| `frontend/icon-512.png` | 512 × 512 px |

Use a square image with no transparency for best results on iPhone (iOS masks it to a rounded square automatically).

---

## 4. Scriptable home screen widget

The widget shows today's sessions and your weekly completion percentage directly on your iPhone home screen.

1. Install [Scriptable](https://scriptable.app/) from the App Store (free).
2. Open Scriptable and tap **+** to create a new script.
3. Copy the entire contents of `widget/weekly-plan.js` and paste it in.
4. At the very top of the script, set your server URL:
   ```js
   const BASE_URL = 'https://habitual.yourdomain.com';
   ```
5. Tap the play button to test — it should show today's sessions in a preview.
6. Go to your iPhone home screen, long-press to enter jiggle mode, tap **+**, search for **Scriptable**, and add a small or medium widget.
7. Long-press the widget → **Edit Widget** → set **Script** to your new script.

---

## 5. First use

When you open the app for the first time each week, a setup sheet will appear asking which days you're in the office that week. Your selection controls whether Pimsleur commute sessions appear for Wednesday, Thursday, and Friday — office days get a commute session, WFH days don't.

You can update your office day selection at any time by tapping **office days** in the top-right corner of the week view.

---

## Maintenance

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f api` |
| Restart the API | `docker compose restart api` |
| Pull latest code and redeploy | Trigger a redeploy in Dokploy (or `docker compose up --build -d`) |
| Wipe database and start over | `docker compose down -v && docker compose up --build -d` |
