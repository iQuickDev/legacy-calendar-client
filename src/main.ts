import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router/router'
import PrimeVue from 'primevue/config';
import OledPreset from './theme/oled';
import { createPinia } from 'pinia'

createApp(App)
    .use(router)
    .use(createPinia())
    .use(PrimeVue, {
        theme: {
            preset: OledPreset,
            options: {
                darkModeSelector: '.dark',
            }
        }
    }).mount('#app')
