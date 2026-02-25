// Service Worker for Push Notifications
const CACHE_NAME = 'placement-portal-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');

    let data = {
        title: 'Placement Portal',
        body: 'You have a new notification',
        icon: '/images/logo.png',
        badge: '/images/badge.png',
        tag: 'default',
        data: {}
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/images/logo.png',
        badge: data.badge || '/images/badge.png',
        tag: data.tag || 'default',
        data: data.data || {},
        vibrate: [100, 50, 100],
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (event.notification.data?.url) {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                // Open a new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Service Worker: Notification closed', event.notification.tag);
});
