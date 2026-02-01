<script setup lang="ts">
import Header from './components/Header.vue'
</script>

<template>
  <Header />
  <router-view v-slot="{ Component }">
      <component :is="Component" />
  </router-view>
</template>

<style scoped>

</style>
