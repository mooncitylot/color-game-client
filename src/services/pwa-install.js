/** @type {Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> } | null} */
let deferredInstallPrompt = null;

/** @type {Set<() => void>} */
const stateListeners = new Set();

const PWA_DEBUG_PREFIX = "[PWA Install]";

function debugLog(message, data) {
  if (data !== undefined) {
    console.log(PWA_DEBUG_PREFIX, message, data);
    return;
  }
  console.log(PWA_DEBUG_PREFIX, message);
}

function notifyInstallStateChanged() {
  debugLog("notifyInstallStateChanged", {
    listenerCount: stateListeners.size,
    promptReady: deferredInstallPrompt !== null,
  });
  stateListeners.forEach((fn) => {
    fn();
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    debugLog("beforeinstallprompt fired", {
      platform: window.navigator.platform,
      userAgent: window.navigator.userAgent,
    });
    e.preventDefault();
    deferredInstallPrompt = e;
    debugLog("stored deferred install prompt");
    notifyInstallStateChanged();
  });

  window.addEventListener("appinstalled", () => {
    debugLog("appinstalled fired");
    deferredInstallPrompt = null;
    notifyInstallStateChanged();
  });
}

/**
 * @returns {boolean}
 */
export function isInstalledPwa() {
  const displayModeStandalone = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  if (displayModeStandalone) {
    debugLog("isInstalledPwa=true via display-mode standalone");
    return true;
  }
  const nav = /** @type {Navigator & { standalone?: boolean }} */ (navigator);
  if (nav.standalone === true) {
    debugLog("isInstalledPwa=true via navigator.standalone");
    return true;
  }
  debugLog("isInstalledPwa=false", {
    displayModeStandalone,
    navigatorStandalone: nav.standalone === true,
  });
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
    debugLog("isIosLikeDevice=true via userAgentData.platform", {
      uaDataPlatform,
    });
    return true;
  }
  if (uaDataPlatform === "android") {
    debugLog("isIosLikeDevice=false via userAgentData.platform", {
      uaDataPlatform,
    });
    return false;
  }

  const ua = nav.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) {
    debugLog("isIosLikeDevice=true via userAgent match", {
      platform: nav.platform,
      maxTouchPoints: nav.maxTouchPoints,
    });
    return true;
  }

  // iPadOS in desktop mode can report as MacIntel + touch points.
  const isDesktopModeIpad =
    nav.platform === "MacIntel" &&
    nav.maxTouchPoints > 1 &&
    /Safari/i.test(ua) &&
    !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|OPR|SamsungBrowser|Android/i.test(ua);

  debugLog("isIosLikeDevice fallback result", {
    isDesktopModeIpad,
    platform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    userAgent: ua,
  });

  return isDesktopModeIpad;
}

/**
 * @returns {boolean}
 */
export function canUseInstallPrompt() {
  const promptReady = deferredInstallPrompt !== null;
  debugLog("canUseInstallPrompt", { promptReady });
  return promptReady;
}

/**
 * @returns {Promise<{ outcome: string }>}
 */
export async function promptAddToHomeScreen() {
  if (!deferredInstallPrompt) {
    debugLog("promptAddToHomeScreen unavailable: no deferred prompt");
    return { outcome: "unavailable" };
  }
  debugLog("promptAddToHomeScreen triggering prompt()");
  await deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  debugLog("promptAddToHomeScreen userChoice", result);
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
  debugLog("subscribePwaInstallState", {
    listenerCount: stateListeners.size,
  });
  onChange();
  return () => {
    stateListeners.delete(onChange);
    debugLog("unsubscribePwaInstallState", {
      listenerCount: stateListeners.size,
    });
  };
}
