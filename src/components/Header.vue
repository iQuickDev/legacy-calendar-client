<script setup lang="ts">
import { ref, computed } from 'vue';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import Menubar from 'primevue/menubar';
import { useSessionStore } from '../stores/session';
import { router } from '../router/router';
import { baseURL } from '../services/API';

const sessionStore = useSessionStore();

const isAuthenticated = computed(() => sessionStore.isAuthenticated);
const currentUser = computed(() => sessionStore.currentUser);

const handleLogout = async () => {
    await sessionStore.logout();
    router.push({ name: 'login' });
};

const items = ref([
    {
        label: 'Calendar',
        icon: 'pi pi-calendar',
        command: () => {
            router.push({ name: 'calendar' });
        }
    }
]);
</script>

<template>
    <Menubar :model="isAuthenticated ? items : []">
        <template #start>
            <router-link :to="{ name: 'calendar' }" class="flex items-center no-underline text-inherit cursor-pointer">
                <img src="/icon.png" alt="Legacy Calendar Icon" class="h-8 w-8 object-contain" />
                <h1 class="text-lg md:text-2xl font-bold ml-2">Legacy Calendar</h1>
            </router-link>
        </template>
        <template #item="{ item, props, hasSubmenu, root }">
            <a v-ripple class="flex items-center" v-bind="props.action">
                <span>{{ item.label }}</span>
                <Badge v-if="item.badge" :class="{ 'ml-auto': !root, 'ml-2': root }" :value="item.badge" />
                <span v-if="item.shortcut"
                    class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{
                        item.shortcut }}</span>
                <i v-if="hasSubmenu"
                    :class="['pi pi-angle-down ml-auto', { 'pi-angle-down': root, 'pi-angle-right': !root }]"></i>
            </a>
        </template>
        <template #end>
            <div v-if="isAuthenticated" class="flex items-center">
                <router-link :to="{ name: 'profile' }"
                    class="no-underline flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-full hover:bg-zinc-800 transition-all">
                    <Avatar :image="currentUser?.profilePicture ? `${baseURL}${currentUser.profilePicture}` : undefined"
                        :label="!currentUser?.profilePicture ? (currentUser?.username?.charAt(0)?.toUpperCase() || 'U') : undefined"
                        shape="circle"
                        class="bg-primary text-primary-contrast cursor-pointer hover:brightness-110 transition-all" />
                    <span>{{ currentUser?.username }}</span>
                </router-link>
                <Button icon="pi pi-sign-out" severity="secondary" text rounded aria-label="Logout"
                    @click="handleLogout" v-tooltip.bottom="'Logout'" />
            </div>
        </template>
    </Menubar>
</template>

<style scoped></style>
