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
  const nav = /** @type {Navigator & { standalone?: boolean }} */ (navigator);
  if (nav.standalone === true) {
    return true;
  }
  return false;
}

/**
 * @returns {boolean}
 */
export function isIosLikeDevice() {
  const nav =
    /** @type {Navigator & { userAgentData?: { platform?: string } }} */ (
      window.navigator
    );
  const uaDataPlatform = nav.userAgentData?.platform?.toLowerCase();
  if (uaDataPlatform === "ios") {
    return true;
  }
  if (uaDataPlatform === "android") {
    return false;
  }

  const ua = nav.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }

  // iPadOS in desktop mode can report as MacIntel + touch points.
  const isDesktopModeIpad =
    nav.platform === "MacIntel" &&
    nav.maxTouchPoints > 1 &&
    /Safari/i.test(ua) &&
    !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|OPR|SamsungBrowser|Android/i.test(ua);

  return isDesktopModeIpad;
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
