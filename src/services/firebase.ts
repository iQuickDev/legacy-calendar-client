import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import API from "./API";

const firebaseConfig = {
    apiKey: "AIzaSyCzD5NBdz225UzdI535-8PSVmK5ZFJNusM",
    authDomain: "legacy-calendar-2cd17.firebaseapp.com",
    projectId: "legacy-calendar-2cd17",
    storageBucket: "legacy-calendar-2cd17.firebasestorage.app",
    messagingSenderId: "226334477513",
    appId: "1:226334477513:web:f6af99c44e7d874889d118",
    measurementId: "G-E7T9QQW8ME"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
    if (!messaging) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');

            // Wait for the service worker to be ready
            const registration = await navigator.serviceWorker.ready;
            
            // Get FCM Token
            const token = await getToken(messaging, {
                vapidKey: 'BEbk5NqQ1cDk8sl8PQuudXigNlm7RVm7yNGL_D3-OyfZPu188-25jmFZrR30blUvRjdkp3s4oOHIlee_b6nSY1E',
                serviceWorkerRegistration: registration
            });
            if (token) {
                console.log('FCM Token:', token);
                // Send the token to your server if needed
                await API.subscribeNotifications(token);
                console.log('FCM Token registered on server.');
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
    }
};

export const onMessageListener = (callback: (payload: any) => void) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        callback(payload);
    });
};

export { app, analytics, messaging };
