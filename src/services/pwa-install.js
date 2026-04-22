/** @type {Set<() => void>} */
const stateListeners = new Set();
let installInitStarted = false;

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
    installed: isInstalledPwa(),
  });
  stateListeners.forEach((fn) => {
    fn();
  });
}

async function ensureInstallServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    debugLog(
      "service workers not supported; install prompt will stay unavailable",
    );
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      },
    );

    debugLog("service worker registration for installability", {
      scope: registration.scope,
      hasController: Boolean(navigator.serviceWorker.controller),
      activeState: registration.active?.state || null,
      waitingState: registration.waiting?.state || null,
      installingState: registration.installing?.state || null,
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      debugLog("service worker controllerchange", {
        hasController: Boolean(navigator.serviceWorker.controller),
      });
      notifyInstallStateChanged();
    });

    await navigator.serviceWorker.ready;
    debugLog("service worker ready", {
      hasController: Boolean(navigator.serviceWorker.controller),
    });

    if (!navigator.serviceWorker.controller) {
      debugLog(
        "page not yet controlled by service worker; reload once to satisfy installability on first registration",
      );
    }
  } catch (error) {
    console.error("[PWA Install] service worker registration error", error);
  }
}

export function initializePwaInstallSystem() {
  if (installInitStarted || typeof window === "undefined") {
    return;
  }

  installInitStarted = true;
  debugLog("initializePwaInstallSystem");

  const ua = window.navigator.userAgent;
  if (/Android/i.test(ua) && window.navigator.platform === "MacIntel") {
    debugLog(
      "android UA with MacIntel platform detected (likely Chrome device emulation)",
    );
  }

  ensureInstallServiceWorker();
}

if (typeof window !== "undefined") {
  initializePwaInstallSystem();

  window.addEventListener("appinstalled", () => {
    debugLog("appinstalled fired");
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
export function canUseInstallPrompt() {
  return false;
}

/**
 * @returns {boolean}
 */
export function canShowManualInstallGuide() {
  const available = !isInstalledPwa();
  debugLog("canShowManualInstallGuide", { available });
  return available;
}

/**
 * @returns {boolean}
 */
export function showManualInstallGuide() {
  if (isInstalledPwa()) {
    debugLog("showManualInstallGuide skipped: already installed");
    return false;
  }

  debugLog("showManualInstallGuide: dispatching open dialog event");
  window.dispatchEvent(new CustomEvent("open-install-guide-dialog"));
  return true;
}

/**
 * @returns {Promise<{ outcome: string }>}
 */
export async function promptAddToHomeScreen() {
  const shown = showManualInstallGuide();
  const result = { outcome: shown ? "guided" : "unavailable" };
  debugLog("promptAddToHomeScreen result", result);
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
