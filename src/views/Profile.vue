<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSessionStore } from '../stores/session';
import Button from 'primevue/button';
import Password from 'primevue/password';
import FileUpload from 'primevue/fileupload';
import Avatar from 'primevue/avatar';
import Card from 'primevue/card';
import { useToast } from 'primevue/usetoast';
import { baseURL } from '../services/API';

const sessionStore = useSessionStore();
const toast = useToast();

const currentUser = computed(() => sessionStore.currentUser);

// Password Change State
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordLoading = ref(false);

// Profile Picture State
const fileUpload = ref<any>(null);

const triggerUpload = () => {
    fileUpload.value?.choose();
};

const handlePasswordChange = async () => {
    if (newPassword.value !== confirmPassword.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Passwords do not match', life: 3000 });
        return;
    }

    if (!currentPassword.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Current password is required', life: 3000 });
        return;
    }

    passwordLoading.value = true;
    try {
        await sessionStore.changePassword(currentPassword.value, newPassword.value);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully', life: 3000 });
        // Reset form
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to change password', life: 3000 });
    } finally {
        passwordLoading.value = false;
    }
};

const onUpload = async (event: any) => {
    try {
        const file = event.files[0];
        await sessionStore.uploadProfilePicture(file);
        toast.add({ severity: 'success', summary: 'Success', detail: 'Profile picture updated', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload profile picture', life: 3000 });
    }
};

const handleDeletePicture = async () => {
    try {
        await sessionStore.removeProfilePicture();
        toast.add({ severity: 'success', summary: 'Success', detail: 'Profile picture removed', life: 3000 });
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to remove profile picture', life: 3000 });
    }
};

</script>

<template>
    <div class="p-6 max-w-2xl mx-auto">
        <!-- Header Section -->
        <div class="flex flex-col items-center mb-4">
            <h1 class="text-4xl font-black tracking-tight mb-4">User Profile</h1>

            <div class="relative group cursor-pointer lg:hover:scale-105 transition-transform duration-300"
                @click="triggerUpload">
                <Avatar :image="currentUser?.profilePicture ? `${baseURL}${currentUser.profilePicture}` : undefined"
                    :label="!currentUser?.profilePicture ? (currentUser?.username?.charAt(0)?.toUpperCase() || 'U') : undefined"
                    class="bg-primary text-primary-contrast border-4 border-zinc-800 shadow-2xl"
                    :style="{ width: '100px', height: '100px', fontSize: '3rem' }" shape="circle" />
                <div
                    class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div class="flex flex-col items-center gap-1 p-2 text-center">
                        <i class="pi pi-camera text-white text-xl"></i>
                        <span class="text-white text-[10px] font-bold uppercase leading-tight">Change<br>Picture</span>
                    </div>
                </div>
            </div>

            <div class="mt-6 text-center">
                <h2 class="text-2xl font-bold">{{ currentUser?.username }}</h2>
                <div class="flex flex-col gap-2 mt-2 mb-2">
                    <FileUpload ref="fileUpload" mode="basic" name="file" :customUpload="true" @uploader="onUpload"
                        accept="image/*" :maxFileSize="10000000" :auto="true" style="display: none" />
                    <Button v-if="currentUser?.profilePicture" label="Remove Profile Picture" icon="pi pi-trash"
                        severity="danger" text @click="handleDeletePicture"
                        class="p-button-sm opacity-60 hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </div>

        <div class="space-y-8">
            <!-- Information Section -->
            <Card>
                <template #title>
                    <div class="flex items-center gap-2 text-xl font-bold">
                        <i class="pi pi-user text-primary"></i>
                        Personal Information
                    </div>
                </template>
                <template #content>
                    <div class="grid grid-cols-1 gap-6 pt-2">
                        <div class="flex flex-col gap-2">
                            <label class="text-xs font-bold uppercase tracking-widest text-zinc-500">Username</label>
                            <div
                                class="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-lg">
                                <i class="pi pi-at text-zinc-500 text-sm"></i>
                                <span>{{ currentUser?.username }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Security Section -->
            <Card>
                <template #title>
                    <div class="flex items-center gap-2 text-xl font-bold">
                        <i class="pi pi-lock text-primary"></i>
                        Security
                    </div>
                </template>
                <template #content>
                    <form @submit.prevent="handlePasswordChange" class="flex flex-col gap-6 pt-2">
                        <div class="flex flex-col gap-1.5">
                            <label for="current-password"
                                class="text-xs font-bold uppercase tracking-widest text-zinc-500">Current
                                Password</label>
                            <Password id="current-password" v-model="currentPassword" toggleMask :feedback="false"
                                class="w-full" inputClass="w-full p-3 bg-zinc-900/50 border-zinc-800"
                                placeholder="••••••••" />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="flex flex-col gap-1.5">
                                <label for="new-password"
                                    class="text-xs font-bold uppercase tracking-widest text-zinc-500">New
                                    Password</label>
                                <Password id="new-password" v-model="newPassword" toggleMask class="w-full"
                                    inputClass="w-full p-3 bg-zinc-900/50 border-zinc-800" placeholder="••••••••" />
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <label for="confirm-password"
                                    class="text-xs font-bold uppercase tracking-widest text-zinc-500">Confirm
                                    Password</label>
                                <Password id="confirm-password" v-model="confirmPassword" toggleMask :feedback="false"
                                    class="w-full" inputClass="w-full p-3 bg-zinc-900/50 border-zinc-800"
                                    placeholder="••••••••" />
                            </div>
                        </div>

                        <div class="pt-2">
                            <Button type="submit" label="Update Password" icon="pi pi-shield" :loading="passwordLoading"
                                class="w-full py-3 font-bold" />
                        </div>
                    </form>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
@reference "tailwindcss";

:deep(.p-card) {
    @apply border border-zinc-800/50 bg-zinc-950/40 backdrop-blur-xl shadow-2xl;
    background: linear-gradient(145deg, rgba(9, 9, 11, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%);
}

.bg-primary {
    background-color: var(--p-primary-color);
}

.text-primary {
    color: var(--p-primary-color);
}
</style>
