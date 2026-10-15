/* Avio Soft: the time of day, the season and a living sky.
 *
 * The CSS theme is complete without this file. The effect only tells it what time and season
 * it is (data attributes on <html>, the stylesheet dresses the lock accordingly), lets the
 * lock's eyes follow the pointer and drops seasonal particles into the background layer.
 *
 * Preview any moment with URL parameters: ?avio_daypart=night&avio_season=winter&avio_holiday=newyear
 */

const DAYPARTS = ["morning", "day", "evening", "night"];
const SEASONS = ["winter", "spring", "summer", "autumn"];
const HOLIDAYS = ["newyear", "valentine", "halloween"];

export function daypartOf(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 18) return "day";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

export function seasonOf(date) {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return "winter";
  if (month <= 4) return "spring";
  if (month <= 7) return "summer";
  return "autumn";
}

export function holidayOf(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if ((month === 12 && day >= 20) || (month === 1 && day <= 10)) return "newyear";
  if (month === 2 && day >= 13 && day <= 15) return "valentine";
  if ((month === 10 && day >= 29) || (month === 11 && day === 1)) return "halloween";
  return "";
}

function forced(name, allowed) {
  try {
    const value = new URLSearchParams(location.search).get(name);
    return allowed.includes(value) ? value : null;
  } catch {
    return null;
  }
}

function moment() {
  const now = new Date();
  return {
    daypart: forced("avio_daypart", DAYPARTS) || daypartOf(now),
    season: forced("avio_season", SEASONS) || seasonOf(now),
    holiday: forced("avio_holiday", [...HOLIDAYS, "none"]) ?? holidayOf(now),
  };
}

/* Which particles fly in the sky right now. */
export function skyKinds(state, variant) {
  const kinds = [];
  const night = variant === "dark" || state.daypart === "night";
  if (night) kinds.push("star");
  if (variant === "light" && state.daypart !== "night") kinds.push("cloud");
  if (state.holiday === "newyear" || (state.season === "winter" && state.holiday !== "valentine")) kinds.push("snow");
  else if (state.holiday === "valentine") kinds.push("heart");
  else if (state.holiday === "halloween") kinds.push("leaf", "bat");
  else if (state.season === "autumn") kinds.push("leaf");
  else if (state.season === "spring") kinds.push("petal");
  else if (state.season === "summer" && night) kinds.push("firefly");
  return kinds;
}

const COUNTS = { star: 26, cloud: 3, snow: 34, heart: 12, leaf: 14, bat: 3, petal: 16, firefly: 14 };

function random(min, max) {
  return min + Math.random() * (max - min);
}

function particle(kind, index, total) {
  const node = document.createElement("i");
  node.className = `avio-p avio-p-${kind}`;
  const style = node.style;
  // Spread along the width in slots so nothing clumps, then jitter inside the slot.
  const slot = (index + random(0.1, 0.9)) / total;
  style.setProperty("--x", `${(slot * 100).toFixed(2)}%`);
  if (kind === "star") {
    style.setProperty("--y", `${random(2, 62).toFixed(2)}%`);
    style.setProperty("--s", `${random(2, 4.5).toFixed(1)}px`);
    style.setProperty("--d", `${random(2.4, 5.5).toFixed(2)}s`);
    style.setProperty("--delay", `${random(-6, 0).toFixed(2)}s`);
  } else if (kind === "cloud") {
    style.setProperty("--y", `${random(3, 34).toFixed(2)}%`);
    style.setProperty("--s", `${random(110, 190).toFixed(0)}px`);
    style.setProperty("--d", `${random(90, 150).toFixed(1)}s`);
    style.setProperty("--delay", `${random(-150, 0).toFixed(1)}s`);
  } else if (kind === "firefly") {
    style.setProperty("--y", `${random(35, 92).toFixed(2)}%`);
    style.setProperty("--s", `${random(4, 7).toFixed(1)}px`);
    style.setProperty("--d", `${random(5, 10).toFixed(2)}s`);
    style.setProperty("--delay", `${random(-10, 0).toFixed(2)}s`);
    style.setProperty("--dx", `${random(-40, 40).toFixed(0)}px`);
    style.setProperty("--dy", `${random(-30, 30).toFixed(0)}px`);
  } else if (kind === "bat") {
    style.setProperty("--y", `${random(6, 30).toFixed(2)}%`);
    style.setProperty("--s", `${random(26, 38).toFixed(0)}px`);
    style.setProperty("--d", `${random(16, 26).toFixed(1)}s`);
    style.setProperty("--delay", `${random(-26, 0).toFixed(1)}s`);
  } else {
    // Falling or rising things: size, fall time, sideways drift, spin.
    const small = kind === "snow" ? random(5, 13) : random(11, 19);
    style.setProperty("--s", `${small.toFixed(1)}px`);
    style.setProperty("--d", `${random(kind === "snow" ? 9 : 11, kind === "snow" ? 18 : 20).toFixed(2)}s`);
    style.setProperty("--delay", `${random(-20, 0).toFixed(2)}s`);
    style.setProperty("--drift", `${random(-60, 60).toFixed(0)}px`);
    style.setProperty("--sway", `${random(12, 28).toFixed(0)}px`);
    style.setProperty("--spin", `${random(-540, 540).toFixed(0)}deg`);
    style.setProperty("--o", random(0.55, 0.95).toFixed(2));
    if (kind === "leaf" && Math.random() < 0.45) node.classList.add("avio-p-leaf-red");
  }
  return node;
}

export function mount(host, initial) {
  let context = initial;
  const root = document.documentElement;
  const skies = new Map();
  let state = moment();
  let kindsKey = "";

  function applyState() {
    root.dataset.avioDaypart = state.daypart;
    root.dataset.avioSeason = state.season;
    if (state.holiday && state.holiday !== "none") root.dataset.avioHoliday = state.holiday;
    else delete root.dataset.avioHoliday;
    root.dataset.avioFx = "on";
  }

  function buildSky(target) {
    const sky = document.createElement("div");
    sky.className = "avio-sky";
    // The sun or the moon, placed and coloured by the stylesheet for the time of day.
    const orb = document.createElement("i");
    orb.className = "avio-orb";
    sky.append(orb);
    const width = Math.max(320, window.innerWidth || 390);
    const scale = Math.min(2, Math.max(0.8, width / 420));
    for (const kind of skyKinds(state, context.variant)) {
      const total = Math.round(COUNTS[kind] * (kind === "cloud" || kind === "bat" ? 1 : scale));
      for (let index = 0; index < total; index += 1) sky.append(particle(kind, index, total));
    }
    target.append(sky);
    return sky;
  }

  function reconcileSky(force) {
    const key = `${skyKinds(state, context.variant).join(",")}|${context.variant}`;
    const rebuild = force || key !== kindsKey;
    kindsKey = key;
    const targets = host.targets("shell.background");
    for (const [target, sky] of skies) {
      if (rebuild || !targets.includes(target)) {
        sky.remove();
        skies.delete(target);
      }
    }
    for (const target of targets) if (!skies.has(target)) skies.set(target, buildSky(target));
  }

  /* A shooting star now and then while the night sky is up. */
  function shootingStar() {
    host.timeout(() => {
      if (context.variant === "dark" && !document.hidden) {
        for (const sky of skies.values()) {
          const streak = document.createElement("i");
          streak.className = "avio-p avio-p-shoot";
          streak.style.setProperty("--x", `${random(20, 85).toFixed(1)}%`);
          streak.style.setProperty("--y", `${random(4, 30).toFixed(1)}%`);
          sky.append(streak);
          host.timeout(() => streak.remove(), 1600);
        }
      }
      shootingStar();
    }, random(9000, 24000));
  }

  /* Eyes: follow the pointer, glance around when nobody moves. */
  let lookRest = () => {};
  let lastPointer = 0;
  let frame = 0;
  let pending = null;

  function look(x, y) {
    root.style.setProperty("--avio-look-x", `${x.toFixed(2)}px`);
    root.style.setProperty("--avio-look-y", `${y.toFixed(2)}px`);
  }

  function lockCenter() {
    const header = host.targets("home.header.surface")[0];
    if (!header) return null;
    const box = header.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    return { x: box.left + box.width / 2, y: box.top + box.height * 0.66 };
  }

  function follow(event) {
    if (context.reducedMotion) return;
    pending = event;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (host.signal.aborted || !pending) return;
      const center = lockCenter();
      const point = pending;
      pending = null;
      if (!center) return;
      const dx = point.clientX - center.x;
      const dy = point.clientY - center.y;
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, distance / 140);
      look((dx / distance) * 2.6 * reach, (dy / distance) * 3 * reach);
      lastPointer = Date.now();
      lookRest();
      lookRest = host.timeout(() => look(0, 0), 1800);
    });
  }

  const glances = [[-2.4, 0.4], [2.4, 0.4], [0, -2.6], [1.8, 2.4], [-1.8, 2.4], [0, 0]];
  function glance() {
    host.timeout(() => {
      if (!document.hidden && Date.now() - lastPointer > 3000) {
        const [x, y] = glances[Math.floor(Math.random() * glances.length)];
        look(x, y);
        lookRest();
        lookRest = host.timeout(() => look(0, 0), random(700, 1400));
      }
      glance();
    }, random(3500, 8000));
  }

  /* The clock: re-check the time and season every minute. */
  function tick() {
    host.timeout(() => {
      const next = moment();
      if (next.daypart !== state.daypart || next.season !== state.season || next.holiday !== state.holiday) {
        state = next;
        applyState();
        reconcileSky(true);
      }
      tick();
    }, 60_000);
  }

  applyState();
  look(0, 0);
  reconcileSky(true);
  host.watchTargets(() => reconcileSky(false));
  host.listen(window, "pointermove", follow);
  host.listen(window, "pointerdown", follow);
  shootingStar();
  glance();
  tick();

  return {
    update(next) {
      const variantChanged = next.variant !== context.variant;
      context = next;
      if (variantChanged) reconcileSky(true);
    },
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      for (const sky of skies.values()) sky.remove();
      skies.clear();
      delete root.dataset.avioDaypart;
      delete root.dataset.avioSeason;
      delete root.dataset.avioHoliday;
      delete root.dataset.avioFx;
      root.style.removeProperty("--avio-look-x");
      root.style.removeProperty("--avio-look-y");
    },
  };
}
