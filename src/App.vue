<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { router } from './router/router'
import Header from './components/Header.vue'
import Toast from 'primevue/toast'
import { useSessionStore } from './stores/session'
import { onMessageListener, requestNotificationPermission } from './services/firebase'
import { useToast } from 'primevue/usetoast'

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
    toast.add({
      severity: 'info',
      summary: payload.notification?.title || 'New Notification',
      detail: payload.notification?.body || 'You have a new message',
      life: 5000
    });
  });
})
</script>

<template>
  <Toast position="top-right" />
  <Header v-if="showHeader" />
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style scoped></style>
