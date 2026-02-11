import { precacheAndRoute } from 'workbox-precaching'
import { cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare let self: ServiceWorkerGlobalScope
declare let clients: Clients

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

const firebaseConfig = {
    apiKey: "AIzaSyCzD5NBdz225UzdI535-8PSVmK5ZFJNusM",
    authDomain: "legacy-calendar-2cd17.firebaseapp.com",
    projectId: "legacy-calendar-2cd17",
    storageBucket: "legacy-calendar-2cd17.firebasestorage.app",
    messagingSenderId: "226334477513",
    appId: "1:226334477513:web:f6af99c44e7d874889d118",
    measurementId: "G-E7T9QQW8ME"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'New Message';

    // Resolve image URL
    let icon = '/icon.png';
    if (payload.data?.image) {
        if (payload.data.image.startsWith('http')) {
            icon = payload.data.image;
        } else {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            icon = `${baseUrl}${payload.data.image}`;
        }
    }

    const notificationOptions = {
        body: payload.notification?.body,
        icon: icon,
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const eventId = event.notification.data?.eventId;
    let targetUrl = '/calendar';
    if (eventId) {
        targetUrl = `/calendar?eventId=${eventId}`;
    }

    const urlToOpen = new URL(targetUrl, self.location.origin).href;

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    })
        .then((windowClients) => {
            let matchingClient = null;

            for (let i = 0; i < windowClients.length; i++) {
                const windowClient = windowClients[i];
                if (!windowClient) continue;
                // Check if we have a window open to the app origin
                if (windowClient.url.startsWith(self.location.origin)) {
                    matchingClient = windowClient;
                    break;
                }
            }

            if (matchingClient) {
                matchingClient.navigate(urlToOpen);
                return matchingClient.focus();
            } else {
                return clients.openWindow(urlToOpen);
            }
        });

    event.waitUntil(promiseChain);
});
