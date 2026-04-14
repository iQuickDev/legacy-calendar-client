<script setup lang="ts">
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { router } from '../router/router'
import { useSessionStore } from '../stores/session';

import { requestNotificationPermission } from '../services/firebase';

const toast = useToast();
const sessionStore = useSessionStore();

const username = ref('');
const password = ref('');

const handleLogin = async () => {
    if (!username.value || !password.value) {
        toast.add({
            severity: 'warn',
            summary: 'Validation Error',
            detail: 'Please enter both username and password',
            life: 3000
        });
        return;
    }

    const success = await sessionStore.login({
        username: username.value,
        password: password.value
    });

    if (success) {
        toast.add({
            severity: 'success',
            summary: 'Welcome!',
            detail: `Logged in as ${sessionStore.currentUser?.username}`,
            life: 2000
        });

        router.push('/calendar');

        await requestNotificationPermission();
    } else {
        toast.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: sessionStore.error || 'Please check your credentials',
            life: 4000
        });
    }
};
</script>

<template>
    <div class="flex min-h-dvh w-full items-center justify-center p-4 sm:p-6 bg-[#09090b] relative overflow-hidden">
        <!-- Subtle Glow -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div class="w-full max-w-104 rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-2xl backdrop-blur-xl relative z-10 transition-all duration-300">
            <div class="p-6 sm:p-8">
                <div class="mb-8 text-center flex flex-col items-center">
                    <div class="w-14 h-14 bg-zinc-800/60 rounded-xl flex items-center justify-center mb-5 border border-zinc-700/50 shadow-sm">
                        <i style="font-size: 1.5rem;" class="pi pi-calendar text-emerald-400"></i>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight text-white mb-2">Legacy Calendar</h1>
                    <p class="text-sm text-zinc-400">Sign in to your account</p>
                </div>

                <form @submit.prevent="handleLogin" class="space-y-6">
                    <div class="space-y-2">
                        <label for="username" class="text-sm font-medium text-zinc-300 ml-1">Username</label>
                        <InputText id="username" v-model="username" class="w-full bg-zinc-950/50 border-zinc-800 focus:border-emerald-500 rounded-xl p-3" placeholder="Enter your username"
                            :disabled="sessionStore.loading" fluid />
                    </div>

                    <div class="space-y-2">
                        <label for="password" class="text-sm font-medium text-zinc-300 ml-1">Password</label>
                        <Password id="password" v-model="password" :feedback="false" toggleMask class="w-full"
                            inputClass="w-full bg-zinc-950/50 border-zinc-800 focus:border-emerald-500 rounded-xl p-3" placeholder="Enter your password" :disabled="sessionStore.loading"
                            fluid />
                    </div>

                    <Button type="submit" :label="sessionStore.loading ? 'Signing in...' : 'Sign In'" class="w-full mt-8! py-3 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.15)] hover:shadow-[0_0_25px_rgba(52,211,153,0.3)] transition-all duration-300 font-semibold"
                        :loading="sessionStore.loading" :disabled="sessionStore.loading" />
                </form>

                <div class="mt-8 pt-6 border-t border-zinc-800/50 flex justify-center items-center">
                    <p class="text-xs text-zinc-500">
                        Powered by <span class="font-bold text-zinc-400">xForce</span>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(.p-password-input) {
    width: 100%;
}
</style>
