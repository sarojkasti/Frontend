import {
  fetchVapidPublicKey,
  savePushSubscriptionOnServer,
  removePushSubscriptionFromServer,
  sendTestPushNotification,
} from '@/service/notification.service';

/**
 * Convert a URL-safe Base64 string to a Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const cleanKey = (base64String || '').replace(/['"]+/g, '').trim();
  const padding = '='.repeat((4 - (cleanKey.length % 4)) % 4);
  const base64 = (cleanKey + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the current browser environment supports Push Notifications
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current push notification permission status ('granted', 'denied', 'default')
 */
export function getPushPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Check whether the user currently has an active push subscription
 */
export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('Failed to retrieve push subscription:', err);
    return null;
  }
}

/**
 * Subscribe the user to Background Web Push Notifications.
 * Requests browser permission and saves the subscription credentials to the server.
 */
export async function subscribeToWebPush(userId?: string): Promise<{
  success: boolean;
  message?: string;
  subscription?: PushSubscription;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      message: 'Push notifications are not supported in this browser.',
    };
  }

  // 1. Request notification permission from user
  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    return {
      success: false,
      message: 'Notification permission was denied. Please allow notifications in site settings.',
    };
  }
  if (permission !== 'granted') {
    return {
      success: false,
      message: 'Notification permission was dismissed.',
    };
  }

  try {
    // 2. Ensure Service Worker is ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Fetch backend VAPID Public Key
    const { publicKey, enabled } = await fetchVapidPublicKey();
    if (!enabled || !publicKey) {
      return {
        success: false,
        message: 'Push notifications are not configured on the server.',
      };
    }

    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Subscribe with the browser's PushManager
    let subscription = await registration.pushManager.getSubscription();

    // If an existing subscription exists, test and sync to server
    if (subscription) {
      try {
        await savePushSubscriptionOnServer(subscription.toJSON(), userId);
        return {
          success: true,
          subscription,
          message: 'Desktop and background notifications active!',
        };
      } catch (syncErr) {
        console.warn('Could not sync existing subscription, recreating...', syncErr);
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      } catch (subErr: any) {
        if (subErr?.name === 'AbortError' || subErr?.message?.includes('push service error')) {
          console.warn('Push service error: resetting stale subscription and retrying...');
          const stale = await registration.pushManager.getSubscription();
          if (stale) await stale.unsubscribe();
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        } else {
          throw subErr;
        }
      }
    }

    // 5. Save the subscription endpoint and keys to Artha backend
    await savePushSubscriptionOnServer(subscription.toJSON(), userId);

    return {
      success: true,
      subscription,
      message: 'Desktop and background notifications successfully enabled!',
    };
  } catch (err: any) {
    console.error('Error during push subscription:', err);
    let errorMsg = err?.message || 'Failed to subscribe to push notifications.';

    if (err?.name === 'AbortError' || err?.message?.includes('push service error')) {
      const isBrave = (navigator as any)?.brave !== undefined;
      return {
        success: false,
        isPushServiceBlocked: true,
        message: isBrave
          ? "You granted site notifications, but Brave blocks background push services by default. To receive alerts when closed, enable 'Use Google services for push messaging' in brave://settings/privacy, click Relaunch, and refresh."
          : "Site notifications allowed, but browser push service (Google FCM) could not be reached. Desktop alerts will still work whenever Artha is open in any tab.",
      };
    }

    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Unsubscribe user from Web Push Notifications
 */
export async function unsubscribeFromWebPush(): Promise<{ success: boolean; message?: string }> {
  if (!isPushNotificationSupported()) return { success: true };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await removePushSubscriptionFromServer(subscription.endpoint);
      await subscription.unsubscribe();
    }
    return { success: true, message: 'Unsubscribed from push notifications.' };
  } catch (err: any) {
    console.warn('Error unsubscribing:', err);
    return { success: false, message: err?.message || 'Failed to unsubscribe.' };
  }
}

/**
 * Send a test push notification to verify native desktop/mobile delivery
 */
export async function testPushDelivery(userId?: string) {
  return await sendTestPushNotification(userId);
}
