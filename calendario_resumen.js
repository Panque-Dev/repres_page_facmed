(function () {
  "use strict";
  const TZ = "America/Mexico_City";
  const cfg = window.CALENDAR_PAGE_CONFIG || {};
  if (!cfg || !Array.isArray(cfg.exams) || !cfg.proposals) return;

  function getPartsFromMs(ms, timeZone = TZ) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(ms));
    const out = {};
    for (const p of parts) if (p.type !== "literal") out[p.type] = p.value;
    return {
      year: Number(out.year),
      month: Number(out.month),
      day: Number(out.day),
      hour: Number(out.hour),
      minute: Number(out.minute),
      second: Number(out.second)
    };
  }

  function zonedLocalToUtcMs(year, month, day, hour = 0, minute = 0, second = 0, timeZone = TZ) {
    let guess = Date.UTC(year, month - 1, day, hour, minute, second);
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    for (let i = 0; i < 4; i += 1) {
      const p = getPartsFromMs(guess, timeZone);
      const zonedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      const diff = desiredAsUtc - zonedAsUtc;
      guess += diff;
      if (Math.abs(diff) < 1000) break;
    }
    return guess;
  }

  function parseTargetMs(dateStr, timeStr) {
    const [year, month, day] = String(dateStr).split("-").map(Number);
    let hour = 8;
    let minute = 0;
    if (typeof timeStr === "string" && /^\d{2}:\d{2}$/.test(timeStr)) {
      [hour, minute] = timeStr.split(":").map(Number);
    }
    return zonedLocalToUtcMs(year, month, day, hour, minute, 0, TZ);
  }

  function shortType(typeText) {
    const s = String(typeText || "");
    const lower = s.toLowerCase();
    const modMatch = s.match(/\(([^)]+)\)/);
    const mod = modMatch ? ` (${modMatch[1].trim()})` : "";
    const n1 = /primer/i.test(s) ? "1" : /segundo/i.test(s) ? "2" : /tercer/i.test(s) ? "3" : /cuarto/i.test(s) ? "4" : "";
    if (lower.includes("ordinario")) return { badge: "ORD" + (n1 ? " " + n1 : "") };
    if (lower.includes("extra")) return { badge: "EXT" };
    if (lower.includes("parcial")) return { badge: "PAR" + (n1 ? " " + n1 : "") + mod };
    return { badge: s || "—" };
  }

  function getSigla(subject) {
    return (cfg.subjectSiglas && cfg.subjectSiglas[subject] && cfg.subjectSiglas[subject].display) || subject;
  }

  function pluralize(n, one, many) {
    return `${n} ${n === 1 ? one : many}`;
  }

  function formatRemaining(ms) {
    const totalHours = Math.max(0, Math.floor(ms / 3600000));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${pluralize(days, "día", "días")} y ${pluralize(hours, "hora", "horas")}`;
  }

  function formatNowMexicoCity() {
    const text = new Intl.DateTimeFormat("es-MX", {
      timeZone: TZ,
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function renderUpcomingSummary() {
    const box = document.getElementById("upcoming-exams-summary");
    const nowEl = document.getElementById("calendar-current-date");
    if (!box) return;

    const nowMs = Date.now();
    const labels = ["siguiente examen", "segundo examen próximo", "tercer examen próximo"];

    const upcoming = cfg.exams
      .map((exam) => ({ ...exam, proposalDate: cfg.proposals[exam.id] || null }))
      .filter((exam) => exam.proposalDate)
      .map((exam) => ({ ...exam, targetMs: parseTargetMs(exam.proposalDate, exam.officialTime) }))
      .filter((exam) => exam.targetMs > nowMs)
      .sort((a, b) => a.targetMs - b.targetMs)
      .slice(0, 3);

    if (!upcoming.length) {
      box.innerHTML = '<div class="next-exam-line">No hay exámenes futuros en esta propuesta.</div>';
    } else {
      box.innerHTML = upcoming.map((exam, index) => {
        const badge = shortType(exam.type).badge;
        const sigla = getSigla(exam.subject);
        const delta = formatRemaining(exam.targetMs - nowMs);
        return `<div class="next-exam-line"><span class="next-exam-prefix">Días de hoy para el ${labels[index]}:</span> <span class="next-exam-core">[${sigla} - ${badge}]</span> <span class="next-exam-delta">${delta}</span></div>`;
      }).join("");
    }

    if (nowEl) nowEl.textContent = `Hora actual de Ciudad de México: ${formatNowMexicoCity()}`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderUpcomingSummary();
    window.setInterval(renderUpcomingSummary, 60000);
  });
})();
