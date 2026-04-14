import { precacheAndRoute } from 'workbox-precaching';
import { cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { notificationStorage } from './services/notificationStorage';
import { NotificationCode } from './types/Notification';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute(self.__WB_MANIFEST);

const firebaseConfig = {
    apiKey: 'AIzaSyCzD5NBdz225UzdI535-8PSVmK5ZFJNusM',
    authDomain: 'legacy-calendar-2cd17.firebaseapp.com',
    projectId: 'legacy-calendar-2cd17',
    storageBucket: 'legacy-calendar-2cd17.firebasestorage.app',
    messagingSenderId: '226334477513',
    appId: '1:226334477513:web:f6af99c44e7d874889d118',
    measurementId: 'G-E7T9QQW8ME'
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, async (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Filter by category
    const category = payload.data?.category as NotificationCode | undefined;
    if (category) {
        const settings = await notificationStorage.getSettings();
        if (settings[category] === false) {
            console.log(`[firebase-messaging-sw.js] Notification category "${category}" is disabled. Skipping.`);
            return;
        }
    }

    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions: NotificationOptions = {
        body: payload.notification?.body,
        icon: '/icon.png',
        data: payload.data // Pass through the data so it's available in notificationclick
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
