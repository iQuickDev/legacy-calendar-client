import { precacheAndRoute } from 'workbox-precaching'
import { cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare let self: ServiceWorkerGlobalScope

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
    const notificationOptions = {
        body: payload.notification?.body,
        icon: '/pwa-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
