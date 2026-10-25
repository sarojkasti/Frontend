/* eslint-disable no-restricted-globals */
// Artha Web Push Service Worker
// Enables notifications even when all browser tabs are closed or application is in background

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || 'Artha Notification';
  const body = data.body || data.message || 'You have a new update in Artha.';
  const link = data.link || (data.data && data.data.link) || '/';

  const options = {
    body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [200, 100, 200],
    tag: data.data?.id || `artha-alert-${Date.now()}`,
    renotify: true,
    data: {
      link,
      id: data.data?.id,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open in Artha' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetLink = event.notification.data?.link || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing Artha tab is open, bring it to focus and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetLink);
          }
          return;
        }
      }
      // 2. If no tab is open (browser was closed or running in background), open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetLink);
      }
    })
  );
});
