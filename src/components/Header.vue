<script setup lang="ts">
import { ref, computed } from 'vue';
import Badge from 'primevue/badge';
import UserAvatar from './UserAvatar.vue';
import Menubar from 'primevue/menubar';
import Menu from 'primevue/menu';
import { useSessionStore } from '../stores/session';
import { router } from '../router/router';
import { useRoute } from 'vue-router';

const sessionStore = useSessionStore();
const route = useRoute();

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
        route: 'calendar',
        command: () => {
            router.push({ name: 'calendar' });
        }
    },
    {
        label: 'Upcoming',
        icon: 'pi pi-list',
        route: 'upcoming',
        command: () => {
            router.push({ name: 'upcoming' });
        }
    }
]);

const profileMenu = ref();
const toggleProfileMenu = (event: Event) => {
    profileMenu.value.toggle(event);
};

const profileMenuItems = computed(() => [
    {
        label: 'My Profile',
        icon: 'pi pi-user',
        command: () => {
            router.push({ name: 'profile' });
        }
    },
    ...(currentUser.value?.isAdmin
        ? [
              {
                  label: 'Admin Panel',
                  icon: 'pi pi-shield',
                  command: () => {
                      router.push({ name: 'admin' });
                  }
              }
          ]
        : []),
    {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: handleLogout
    }
]);
</script>

<template>
    <Menubar :model="isAuthenticated ? items : []">
        <template #start>
            <router-link :to="{ name: 'calendar' }" class="flex cursor-pointer items-center text-inherit no-underline">
                <h1 class="ml-2 text-lg font-bold md:text-2xl">Legacy Calendar</h1>
            </router-link>
        </template>
        <template #item="{ item, props, hasSubmenu, root }">
            <a
                v-ripple
                class="flex items-center transition-colors"
                v-bind="props.action"
                :class="[route.name === item.route ? 'font-medium text-zinc-100!' : 'text-zinc-600!']"
            >
                <span>{{ item.label }}</span>
                <Badge v-if="item.badge" :class="{ 'ml-auto': !root, 'ml-2': root }" :value="item.badge" />
                <span
                    v-if="item.shortcut"
                    class="border-surface bg-emphasis text-muted-color ml-auto rounded border p-1 text-xs"
                >
                    {{ item.shortcut }}
                </span>
                <i
                    v-if="hasSubmenu"
                    :class="['pi pi-angle-down ml-auto', { 'pi-angle-down': root, 'pi-angle-right': !root }]"
                ></i>
            </a>
        </template>
        <template #end>
            <div v-if="isAuthenticated" class="flex items-center gap-2">
                <div
                    class="flex cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-2 py-1 no-underline transition-all hover:bg-zinc-800"
                    @click="toggleProfileMenu"
                    aria-haspopup="true"
                    aria-controls="profile_menu"
                >
                    <UserAvatar
                        :profilePicture="currentUser?.profilePicture"
                        :username="currentUser?.username"
                        class="transition-all hover:brightness-110"
                    />
                    <span class="hidden sm:inline">{{ currentUser?.username }}</span>
                    <i class="pi pi-angle-down text-xs text-zinc-500"></i>
                </div>
                <Menu ref="profileMenu" id="profile_menu" :model="profileMenuItems" :popup="true">
                    <template #item="{ item, props }">
                        <a v-ripple v-bind="props.action" class="flex items-center">
                            <span :class="item.icon" />
                            <span class="ml-2">{{ item.label }}</span>
                        </a>
                    </template>
                </Menu>
            </div>
        </template>
    </Menubar>
</template>
