/** @type {Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null} */
let deferredInstallPrompt = null;

/** @type {Set<() => void>} */
const stateListeners = new Set();

function notifyInstallStateChanged() {
  stateListeners.forEach((fn) => {
    fn();
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyInstallStateChanged();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    notifyInstallStateChanged();
  });
}

/**
 * @returns {boolean}
 */
export function isInstalledPwa() {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }
  const nav = /** @type {Navigator & { standalone?: boolean }} */ (
    navigator
  );
  if (nav.standalone === true) {
    return true;
  }
  return false;
}

/**
 * @returns {boolean}
 */
export function isIosLikeDevice() {
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  return (
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  );
}

/**
 * @returns {boolean}
 */
export function canUseInstallPrompt() {
  return deferredInstallPrompt !== null;
}

/**
 * @returns {Promise<{ outcome: string }>}
 */
export async function promptAddToHomeScreen() {
  if (!deferredInstallPrompt) {
    return { outcome: "unavailable" };
  }
  await deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstallStateChanged();
  return result;
}

/**
 * @param {() => void} onChange
 * @returns {() => void}
 */
export function subscribePwaInstallState(onChange) {
  stateListeners.add(onChange);
  onChange();
  return () => {
    stateListeners.delete(onChange);
  };
}
