import { createRouter, createWebHistory } from 'vue-router'

import Calendar from '../views/Calendar.vue'
import Login from '../views/Login.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/calendar', component: Calendar },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})