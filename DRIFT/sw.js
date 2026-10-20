/* ═══════════════════════════════════════════════════════════
   FFGlory Service Worker
   Background push notifications
   ═══════════════════════════════════════════════════════════ */

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
    let data = { title: 'FFGlory', body: 'You have a new notification', type: 'info' };
    try {
        if (event.data) data = { ...data, ...event.data.json() };
    } catch (e) {
        try { data.body = event.data.text(); } catch {}
    }

    const iconMap = {
        success: 'https://cdn-icons-png.flaticon.com/512/845/845646.png',
        error:   'https://cdn-icons-png.flaticon.com/512/753/753345.png',
        warning: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
        info:    'https://cdn-icons-png.flaticon.com/512/3135/3135706.png'
    };

    const options = {
        body: data.body,
        icon: iconMap[data.type] || iconMap.info,
        badge: iconMap[data.type] || iconMap.info,
        tag: data.tag || ('notif-' + Date.now()),
        requireInteraction: false,
        data: data
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click → open /client
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/client';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/client') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});