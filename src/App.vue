<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { router } from './router/router'
import Header from './components/Header.vue'
import Toast from 'primevue/toast'
import { useSessionStore } from './stores/session'
import { onMessageListener, requestNotificationPermission } from './services/firebase'
import { useToast } from 'primevue/usetoast'
import { baseURL } from './services/API'

const route = useRoute()
const toast = useToast()
const sessionStore = useSessionStore()
const showHeader = computed(() => route.name !== 'login')

onMounted(async () => {
  const loaded = await sessionStore.load()

  if (loaded) {
    // Register for notifications if logged in
    requestNotificationPermission();

    // If we loaded a session and we are on the login page, redirect to calendar
    if (route.name === 'login') {
      router.push('/calendar')
    }
  }

  // Set up foreground notification listener
  onMessageListener((payload) => {
    console.log('Foreground message received:', payload);
    const { title, body } = payload.notification || {};
    const { image, eventId, type } = payload.data || {};

    toast.add({
      severity: 'info',
      summary: title || 'New Notification',
      detail: body || 'You have a new message',
      life: 5000,
      group: undefined, // Use default group
      data: {
        image,
        eventId,
        type
      }
    } as any);
  });
})

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${baseURL}${path}`;
}

const handleToastClick = (message: any) => {
  if (message.data?.eventId) {
    router.push(`/events/${message.data.eventId}`);
  }
}
</script>

<template>
  <Toast position="top-right">
    <template #message="{ message }">
      <div 
        class="flex items-center gap-3 w-full p-2 rounded-lg transition-all duration-200"
        :class="{'cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800': message.data?.eventId}"
        @click="handleToastClick(message)"
      >
        <template v-if="message.data?.image">
          <img 
            :src="getImageUrl(message.data.image)" 
            class="w-10 h-10 rounded-full object-cover shrink-0 border border-surface-200 dark:border-surface-700 shadow-sm"
            alt="User"
            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" 
          />
        </template>
        <div class="flex flex-col gap-1 flex-1 min-w-0">
          <span class="font-bold text-sm block truncate">{{ message.summary }}</span>
          <p class="m-0 text-xs text-muted-color line-clamp-2 leading-tight">{{ message.detail }}</p>
        </div>
      </div>
    </template>
  </Toast>
  <Header v-if="showHeader" />
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style scoped></style>
