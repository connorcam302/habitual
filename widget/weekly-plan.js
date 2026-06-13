// Habitual — Scriptable Widget
// Shows today's sessions and weekly completion.
// Setup: set BASE_URL and your personal API_TOKEN below.

const BASE_URL = "http://localhost:8001"
const API_TOKEN = "paste-your-widget-token-here"

// ─── Palette ─────────────────────────────────────────────────────────────────
// Warm-grey dark system, matches the web app.
const C = {
  bg:        new Color("#1a1918"),
  surface:   new Color("#262523"),
  track:     new Color("#3a3836"),
  border:    new Color("#4f4d4a"),
  text:      new Color("#fdf0d5"),
  muted:     new Color("#a8a6a0"),
  dim:       new Color("#857e78"),
  done:      new Color("#48a870"),
  injured:   new Color("#c99b32"),
  cancelled: new Color("#b33d2a"),
  skipped:   new Color("#979390"),
  fill:      new Color("#c1121f"),  // progress fill — brick red
}

const TYPE_COLOR = {
  strength: new Color("#f5ae22"),
  cardio:   new Color("#48a870"),
  sport:    new Color("#c1121f"),
  mobility: new Color("#d97630"),
  recovery: new Color("#c99b32"),
  learning: new Color("#669bbc"),
  lifestyle:new Color("#a8a6a0"),
  other:    new Color("#4f4d4a"),
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function formatISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getDayName(date) {
  return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][date.getDay()]
}

// Draws a rounded progress bar at the correct proportional width using
// DrawContext — avoids the fixed-pixel hack in the original.
function drawProgressBar(pct, family) {
  const contentWidths = { small: 127, medium: 301, large: 301 }
  const w = contentWidths[family] ?? 127
  const h = 4
  const r = h / 2

  const ctx = new DrawContext()
  ctx.size = new Size(w, h)
  ctx.opaque = false
  ctx.respectScreenScale = true

  // Track
  ctx.setFillColor(C.track)
  const trackPath = new Path()
  trackPath.addRoundedRect(new Rect(0, 0, w, h), r, r)
  ctx.addPath(trackPath)
  ctx.fillPath()

  // Fill
  if (pct > 0) {
    const fw = Math.max(h, Math.round(w * pct / 100))
    ctx.setFillColor(pct >= 100 ? C.done : C.fill)
    const fillPath = new Path()
    fillPath.addRoundedRect(new Rect(0, 0, fw, h), r, r)
    ctx.addPath(fillPath)
    ctx.fillPath()
  }

  return ctx.getImage()
}

function statusMark(status) {
  if (status === "done")      return { sym: "✓", color: C.done }
  if (status === "injured")   return { sym: "!", color: C.injured }
  if (status === "cancelled") return { sym: "✕", color: C.cancelled }
  if (status === "skipped")   return { sym: "–", color: C.skipped }
  return null
}

function formatTime(slot) {
  if (!slot) return null
  return slot.split("–")[0].trim().replace(/^0/, "")
}

// ─── Widget ──────────────────────────────────────────────────────────────────
async function run() {
  const widget = new ListWidget()
  widget.backgroundColor = C.bg
  widget.setPadding(14, 14, 14, 14)
  widget.url = BASE_URL

  const family = config.widgetFamily ?? "small"

  try {
    const now       = new Date()
    const weekStart = formatISO(getMonday(now))
    const today     = getDayName(now)

    const req = new Request(`${BASE_URL}/api/sessions?week=${weekStart}`)
    req.headers = { Authorization: `Bearer ${API_TOKEN}` }
    req.timeoutInterval = 10
    const data = await req.loadJSON()

    if (!data.week_exists) {
      throw new Error("Week not set up — open Habitual to plan")
    }

    const sessions      = data.sessions ?? []
    const todaySessions = sessions.filter(s => s.day === today)
    const done          = sessions.filter(s => s.status === "done").length
    const total         = sessions.length
    const pct           = total > 0 ? Math.round((done / total) * 100) : 0
    const allDone       = done > 0 && done === total

    // ── Header ───────────────────────────────────────────────────────────────
    const header = widget.addStack()
    header.layoutHorizontally()
    header.centerAlignContent()

    const wordmark = header.addText("HABITUAL")
    wordmark.font = Font.boldMonospacedSystemFont(9)
    wordmark.textColor = C.dim

    header.addSpacer()

    const pctLabel = header.addText(`${pct}%`)
    pctLabel.font = Font.boldMonospacedSystemFont(12)
    pctLabel.textColor = allDone ? C.done : C.muted

    widget.addSpacer(7)

    // ── Progress bar ─────────────────────────────────────────────────────────
    const barImg = widget.addImage(drawProgressBar(pct, family))
    barImg.applyFittingContentMode()

    widget.addSpacer(11)

    // ── Day + done count ─────────────────────────────────────────────────────
    const dayRow = widget.addStack()
    dayRow.layoutHorizontally()
    dayRow.centerAlignContent()

    const dayLabel = dayRow.addText(today.toUpperCase())
    dayLabel.font = Font.boldSystemFont(8)
    dayLabel.textColor = C.dim

    dayRow.addSpacer()

    const countLabel = dayRow.addText(`${done} / ${total}`)
    countLabel.font = Font.regularMonospacedSystemFont(8)
    countLabel.textColor = allDone ? C.done : C.dim

    widget.addSpacer(6)

    // ── Sessions ─────────────────────────────────────────────────────────────
    if (todaySessions.length === 0) {
      const rest = widget.addText("Rest day")
      rest.font = Font.mediumSystemFont(13)
      rest.textColor = C.dim
    } else {
      const limit = family === "large" ? 10 : family === "medium" ? 6 : 4
      const shown = Math.min(todaySessions.length, limit)

      for (let i = 0; i < shown; i++) {
        const s      = todaySessions[i]
        const mark   = statusMark(s.status)
        const active = !mark

        const row = widget.addStack()
        row.layoutHorizontally()
        row.centerAlignContent()
        row.spacing = 7

        // Type dot
        const dot = row.addText("●")
        dot.font = Font.systemFont(7)
        dot.textColor = TYPE_COLOR[s.category] ?? C.border

        // Name
        const nameText = row.addText(s.name)
        nameText.font = active ? Font.mediumSystemFont(12) : Font.systemFont(12)
        nameText.textColor = active ? C.text : C.dim
        nameText.lineLimit = 1

        row.addSpacer()

        // Status mark or scheduled time
        if (mark) {
          const sym = row.addText(mark.sym)
          sym.font = Font.boldSystemFont(11)
          sym.textColor = mark.color
        } else {
          const t = formatTime(s.time_slot)
          if (t) {
            const timeText = row.addText(t)
            timeText.font = Font.regularMonospacedSystemFont(9)
            timeText.textColor = C.dim
          }
        }

        if (i < shown - 1) widget.addSpacer(4)
      }

      if (todaySessions.length > limit) {
        widget.addSpacer(3)
        const more = widget.addText(`+${todaySessions.length - limit} more`)
        more.font = Font.systemFont(10)
        more.textColor = C.dim
      }
    }

    widget.addSpacer()

  } catch (e) {
    widget.addSpacer()

    const errText = widget.addText("⚠ Could not load")
    errText.textColor = C.cancelled
    errText.font = Font.mediumSystemFont(12)

    widget.addSpacer(5)

    const detail = widget.addText(String(e?.message ?? e))
    detail.textColor = C.muted
    detail.font = Font.systemFont(10)
    detail.lineLimit = 3

    widget.addSpacer(5)

    const hint = widget.addText(BASE_URL)
    hint.textColor = C.dim
    hint.font = Font.regularMonospacedSystemFont(8)
    hint.lineLimit = 1

    widget.addSpacer()
  }

  if (config.runsInWidget) {
    Script.setWidget(widget)
  } else {
    widget.presentSmall()
  }

  Script.complete()
}

run()
