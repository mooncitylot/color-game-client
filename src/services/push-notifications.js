import { apiFetch } from "./api-fetch.js";

/**
 * Push Notification Service for ColorZap
 * Handles Web Push API subscriptions and communication with backend
 */

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Check current notification permission
 */
export function getNotificationPermission() {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return "denied";
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get or create service worker registration
 */
export async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported");
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js", {
    scope: "/",
  });

  // Wait for service worker to be active
  if (registration.active) {
    return registration;
  }

  return new Promise((resolve) => {
    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (installingWorker) {
        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "activated") {
            resolve(registration);
          }
        });
      }
    });
  });
}

/**
 * Get VAPID public key as Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  // Request permission
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  // Get service worker registration
  const registration = await getServiceWorkerRegistration();

  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
  });

  // Send subscription to backend
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.getKey("p256dh") 
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh"))))
        : "",
      auth: subscription.getKey("auth")
        ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth"))))
        : "",
    },
  };

  await apiFetch("/v1/push/subscribe", "POST", pushSubscription);

  return subscription;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  const registration = await getServiceWorkerRegistration();
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  // Remove from backend first
  try {
    await apiFetch("/v1/push/subscribe", "DELETE", {
      endpoint: subscription.endpoint,
    });
  } catch (error) {
    console.warn("Failed to unsubscribe from backend:", error);
  }

  // Unsubscribe from push manager
  const result = await subscription.unsubscribe();
  return result;
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription() {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return null;
  }
}

/**
 * Get user's push subscriptions from backend
 */
export async function getUserSubscriptions() {
  try {
    const response = await apiFetch("/v1/push/subscriptions", "GET");
    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error("Failed to get subscriptions:", error);
    return [];
  }
}

/**
 * Check if user is currently subscribed to push notifications
 */
export async function isSubscribed() {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}

/**
 * Send a test notification (client-side only, for testing)
 */
export function sendTestNotification() {
  if (!("Notification" in window)) {
    throw new Error("Notifications are not supported");
  }

  if (Notification.permission !== "granted") {
    throw new Error("Notification permission not granted");
  }

  const notification = new Notification("ColorZap Test", {
    body: "This is a test notification!",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    vibrate: [100, 50, 100],
    tag: "test-notification",
  });

  notification.onclick = () => {
    notification.close();
    window.focus();
  };

  return notification;
}

/**
 * Initialize push notifications for the app
 */
export async function initializePushNotifications() {
  if (!isPushSupported()) {
    console.log("[Push] Push notifications not supported");
    return false;
  }

  try {
    // Register service worker
    await getServiceWorkerRegistration();
    console.log("[Push] Service worker registered");

    // Check if already subscribed
    const subscription = await getCurrentSubscription();
    if (subscription) {
      console.log("[Push] Already subscribed to push notifications");
      return true;
    }

    console.log("[Push] Not subscribed yet");
    return false;
  } catch (error) {
    console.error("[Push] Initialization error:", error);
    return false;
  }
}
