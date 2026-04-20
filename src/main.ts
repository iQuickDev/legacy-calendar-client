import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { router } from './router/router';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import OledPreset from './theme/oled';
import { createPinia } from 'pinia';
import './services/firebase';
import { registerSW } from 'virtual:pwa-register';
import Tooltip from 'primevue/tooltip';

registerSW({ immediate: true });

createApp(App)
    .use(router)
    .use(createPinia())
    .use(PrimeVue, {
        theme: {
            preset: OledPreset,
            options: {
                darkModeSelector: '.dark'
            }
        }
    })
    .use(ToastService)
    .use(ConfirmationService)
    .directive('tooltip', Tooltip)
    .mount('#app');
