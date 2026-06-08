// Shared ESP32 proxy helpers. Server-only.
const ESP_IP = (process.env.ESP_IP || "").replace(/\/$/, "");

// In-memory simulated state used when the ESP32 is unreachable.
const sim = {
  solo: 52,
  luz: 68,
  bomba: false,
  auto: true,
  limiteMin: 40,
  limiteMax: 65,
  online: false,
};

function driftSim() {
  // Random walk to make demo feel alive.
  sim.solo = Math.max(0, Math.min(100, sim.solo + (Math.random() * 6 - 3)));
  sim.luz = Math.max(0, Math.min(100, sim.luz + (Math.random() * 8 - 4)));
  if (sim.auto) {
    if (sim.solo < sim.limiteMin) sim.bomba = true;
    if (sim.solo > sim.limiteMax) sim.bomba = false;
  }
  if (sim.bomba) sim.solo = Math.min(100, sim.solo + 2);
}

async function espFetch(paths: string | string[], init?: RequestInit) {
  if (!ESP_IP) throw new Error("no_esp");
  const candidates = Array.isArray(paths) ? paths : [paths];
  let lastError: unknown;

  for (const path of candidates) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    try {
      const r = await fetch(`${ESP_IP}${path}`, { ...init, signal: ctrl.signal });
      if (!r.ok) throw new Error(`esp_${r.status}`);
      return r;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastError ?? new Error("esp_unreachable");
}

export async function getStatus() {
  try {
    const r = await espFetch(["/api/status", "/status"]);
    const data = await r.json();
    Object.assign(sim, data, { online: true });
    return { ...sim, online: true, simulated: false };
  } catch {
    driftSim();
    return { ...sim, online: false, simulated: true };
  }
}

export async function setPump(state: boolean) {
  sim.bomba = state;
  try {
    await espFetch([
      `/api/pump?state=${state ? 0 : 1}`,
      `/pump?state=${state ? 0 : 1}`,
    ]);
    return { ok: true, bomba: state, simulated: false };
  } catch {
    return { ok: true, bomba: state, simulated: true };
  }
}

export async function setConfig(min: number, max: number, auto: boolean) {
  sim.limiteMin = min;
  sim.limiteMax = max;
  sim.auto = auto;
  try {
    await espFetch([
      `/api/config?min=${min}&max=${max}&auto=${auto ? 1 : 0}`,
      `/config?min=${min}&max=${max}&auto=${auto ? 1 : 0}`,
    ]);
    return { ok: true, limiteMin: min, limiteMax: max, auto, simulated: false };
  } catch {
    return { ok: true, limiteMin: min, limiteMax: max, auto, simulated: true };
  }
}
