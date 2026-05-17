// Habitual — Scriptable Widget
// Shows today's sessions and weekly completion percentage.
//
// Setup: set BASE_URL to your server address below.

const BASE_URL = "http://localhost:8001";

// ─── Colours ─────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  football: "#3b82f6",
  strength: "#a855f7",
  speed: "#f97316",
  cardio: "#22c55e",
  chinese: "#06b6d4",
};
const STATUS_DONE_COLOR = "#22c55e";
const BG_COLOR = new Color("#080810");
const SURFACE_COLOR = new Color("#0f0f1c");
const TEXT_COLOR = new Color("#eeeeff");
const MUTED_COLOR = new Color("#6b7280");
const DIM_COLOR = new Color("#374151");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayName(date) {
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][date.getDay()];
}

// ─── Widget ──────────────────────────────────────────────────────────────────
async function run() {
  const widget = new ListWidget();
  widget.backgroundColor = BG_COLOR;
  widget.setPadding(14, 14, 14, 14);
  widget.url = BASE_URL;

  try {
    const now = new Date();
    const weekStart = formatISO(getMonday(now));
    const today = getDayName(now);

    const req = new Request(`${BASE_URL}/api/sessions?week=${weekStart}`);
    req.timeoutInterval = 10;
    const data = await req.loadJSON();

    if (data.week_exists === false) {
      throw new Error(`Week ${weekStart} not set up — open the app`);
    }
    const sessions = data.sessions || [];

    const todaySessions = sessions.filter((s) => s.day === today);
    const done = sessions.filter((s) => s.status === "done").length;
    const total = sessions.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // ── Header row ──────────────────────────────────────────────────────────
    const headerStack = widget.addStack();
    headerStack.layoutHorizontally();
    headerStack.centerAlignContent();

    const wordmark = headerStack.addText("HABITUAL");
    wordmark.font = Font.boldMonospacedSystemFont(10);
    wordmark.textColor = MUTED_COLOR;

    headerStack.addSpacer();

    const pctText = headerStack.addText(`${pct}%`);
    pctText.font = Font.boldMonospacedSystemFont(11);
    pctText.textColor = TEXT_COLOR;

    widget.addSpacer(6);

    // ── Mini progress bar ────────────────────────────────────────────────────
    const barStack = widget.addStack();
    barStack.layoutHorizontally();
    barStack.size = new Size(0, 3);

    const fillWidth = total > 0 ? Math.round((done / total) * 100) : 0;
    // Scriptable doesn't have a native progress bar; simulate with stacks
    if (fillWidth > 0) {
      const fill = barStack.addStack();
      fill.backgroundColor = new Color("#3b82f6");
      fill.cornerRadius = 2;
      fill.size = new Size(fillWidth, 3);
    }
    barStack.addSpacer();
    const track = barStack.addStack();
    track.backgroundColor = new Color("#2a2a45");
    track.cornerRadius = 2;
    track.size = new Size(100 - fillWidth, 3);

    widget.addSpacer(10);

    // ── Today label ─────────────────────────────────────────────────────────
    const dayLabel = widget.addText(today.toUpperCase());
    dayLabel.font = Font.boldSystemFont(9);
    dayLabel.textColor = MUTED_COLOR;

    widget.addSpacer(5);

    // ── Sessions ─────────────────────────────────────────────────────────────
    if (todaySessions.length === 0) {
      const rest = widget.addText("Rest day ·");
      rest.font = Font.systemFont(13);
      rest.textColor = MUTED_COLOR;
    } else {
      const limit = Math.min(
        todaySessions.length,
        config.widgetFamily === "large" ? 8 : 4,
      );
      for (let i = 0; i < limit; i++) {
        const s = todaySessions[i];
        const isDone = s.status === "done";

        const row = widget.addStack();
        row.layoutHorizontally();
        row.centerAlignContent();
        row.spacing = 6;

        // Colour dot
        const dot = row.addText("●");
        dot.font = Font.systemFont(9);
        dot.textColor = new Color(TYPE_COLORS[s.type] || "#444");

        // Session name
        const name = row.addText(s.name);
        name.font = Font.systemFont(12);
        name.textColor = isDone ? MUTED_COLOR : TEXT_COLOR;
        name.lineLimit = 1;

        row.addSpacer();

        if (isDone) {
          const check = row.addText("✓");
          check.font = Font.boldSystemFont(11);
          check.textColor = new Color(STATUS_DONE_COLOR);
        } else if (
          s.time_slot &&
          !s.time_slot.includes("Commute") &&
          !s.time_slot.includes("work")
        ) {
          const time = row.addText(s.time_slot.split("–")[0].trim());
          time.font = Font.regularMonospacedSystemFont(10);
          time.textColor = DIM_COLOR;
        }

        if (i < limit - 1) widget.addSpacer(3);
      }

      if (todaySessions.length > limit) {
        widget.addSpacer(2);
        const more = widget.addText(`+${todaySessions.length - limit} more`);
        more.font = Font.systemFont(11);
        more.textColor = MUTED_COLOR;
      }
    }

    // ── Done count ───────────────────────────────────────────────────────────
    widget.addSpacer();
    const footer = widget.addText(`${done} of ${total} this week`);
    footer.font = Font.regularMonospacedSystemFont(10);
    footer.textColor = DIM_COLOR;
  } catch (e) {
    const errText = widget.addText("Could not load data");
    errText.textColor = new Color("#ef4444");
    errText.font = Font.systemFont(12);

    widget.addSpacer(4);
    const detail = widget.addText(String(e && e.message ? e.message : e));
    detail.textColor = MUTED_COLOR;
    detail.font = Font.systemFont(9);
    detail.lineLimit = 3;

    widget.addSpacer(4);
    const hint = widget.addText(BASE_URL);
    hint.textColor = DIM_COLOR;
    hint.font = Font.systemFont(8);
    hint.lineLimit = 1;
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    widget.presentSmall();
  }

  Script.complete();
}

run();
