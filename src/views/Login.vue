<script setup lang="ts">
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { router } from '../router/router'

const username = ref('');
const password = ref('');

const handleLogin = () => {
    // Logic to be implemented later
    console.log('Login attempt', { username: username.value, password: password.value });
    router.push('/calendar')
};
</script>

<template>
    <div class="flex min-h-[calc(100vh-60px)] items-center justify-center">
        <div class="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-xl backdrop-blur-sm">
            <div class="p-8 pb-4">
                <div class="mb-8 text-center">
                    <h1 class="text-3xl font-bold tracking-tight text-white">Legacy Calendar</h1>
                    <p class="mt-2 text-sm text-zinc-400">Sign in to your account</p>
                </div>

                <form @submit.prevent="handleLogin" class="space-y-6">
                    <div class="space-y-2">
                        <label for="username" class="text-sm font-medium text-zinc-300">Username</label>
                        <InputText id="username" v-model="username" class="w-full" placeholder="Enter your username"
                            fluid />
                    </div>

                    <div class="space-y-2">
                        <label for="password" class="text-sm font-medium text-zinc-300">Password</label>
                        <Password id="password" v-model="password" :feedback="false" toggleMask class="w-full"
                            inputClass="w-full" placeholder="Enter your password" fluid />
                    </div>

                    <Button type="submit" label="Login" class="w-full !mt-6" />
                </form>

                <div class="w-full flex justify-center text-sm text-zinc-400 mt-6">
                    <span>Powered by <span class="font-bold">xForce</span></span>
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
