import { createRouter, createWebHistory } from 'vue-router'

import Calendar from '../views/Calendar.vue'
import Login from '../views/Login.vue'
import AdminView from '../views/AdminView.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', name: 'login', component: Login, meta: { requiresGuest: true } },
  { path: '/calendar', name: 'calendar', component: Calendar, meta: { requiresAuth: true } },
  { path: '/admin', name: 'admin', component: AdminView },
  { path: '/profile', name: 'profile', component: Profile, meta: { requiresAuth: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token

  // Redirect to login if route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Redirect to calendar if user is already authenticated and tries to access login
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'calendar' })
    return
  }


  next()
})
