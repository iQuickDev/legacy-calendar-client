import { createRouter, createWebHistory } from 'vue-router';

import Calendar from '../views/Calendar.vue';
import Login from '../views/Login.vue';
import AdminView from '../views/AdminView.vue';
import Profile from '../views/Profile.vue';

const routes = [
    { path: '/', name: 'login', component: Login, meta: { requiresGuest: true } },
    { path: '/calendar', name: 'calendar', component: Calendar, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } }
];

export const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guards
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
router.beforeEach(async (to, _from) => {
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;

    // Redirect to login if route requires auth and user is not authenticated
    if (to.meta.requiresAuth && !isAuthenticated) {
        return { name: 'login' };
    }

    // Redirect to calendar if user is already authenticated and tries to access login
    if (to.meta.requiresGuest && isAuthenticated) {
        return { name: 'calendar' };
    }

    // Redirect to calendar if route requires admin and user is not an admin
    if (to.meta.requiresAdmin) {
        const { useSessionStore } = await import('../stores/session');
        const sessionStore = useSessionStore();

        // Ensure session is loaded before checking admin status
        if (!sessionStore.currentUser) {
            await sessionStore.load();
        }

        if (!sessionStore.currentUser?.isAdmin) {
            return { name: 'calendar' };
        }
    }

    return;
});
