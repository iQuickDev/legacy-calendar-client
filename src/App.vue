<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import Toast from 'primevue/toast'

const route = useRoute()
const showHeader = computed(() => route.name !== 'login')
</script>

<template>
  <Toast position="top-right" />
  <Header v-if="showHeader" />
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
</template>

<style scoped></style>
