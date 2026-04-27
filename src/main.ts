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
import Ripple from 'primevue/ripple';

registerSW({ immediate: true });

createApp(App)
    .use(router)
    .use(createPinia())
    .use(PrimeVue, {
        ripple: true,
        theme: {
            preset: OledPreset,
            options: {
                darkModeSelector: '.dark'
            }
        },
        pt: {
            Button: {
                root: { class: 'rounded-xl! font-bold' }
            },
            Dialog: {
                root: { class: 'rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl' },
                header: { class: 'rounded-t-2xl bg-transparent border-none!' },
                content: { class: 'bg-transparent' },
                footer: { class: 'rounded-b-2xl bg-transparent border-none!' }
            },
            DataTable: {
                root: { class: 'rounded-xl! overflow-hidden border border-zinc-800' },
                header: { class: 'bg-zinc-900/50' }
            },
            InputText: {
                root: { class: 'rounded-xl!' }
            },
            Textarea: {
                root: { class: 'rounded-xl!' }
            },
            Password: {
                pcInputText: {
                    root: { class: 'rounded-xl!' }
                }
            }
        },
        ptOptions: {
            mergeSections: true,
            mergeProps: true
        }
    })
    .use(ToastService)
    .use(ConfirmationService)
    .directive('tooltip', Tooltip)
    .directive('ripple', Ripple)
    .mount('#app');
