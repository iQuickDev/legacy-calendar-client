<script setup lang="ts">
import type { Event } from '../../../types/Event';

defineProps<{
    event: Event;
    formattedStart: string;
    formattedEnd?: string;
    participationDeadline?: string;
}>();
</script>

<template>
    <div class="flex flex-col gap-4">
        <div v-if="event.description" class="flex flex-col gap-2">
            <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                <i class="pi pi-align-left"></i>
                <span class="font-semibold">Description</span>
            </div>
            <p class="text-surface-700 dark:text-surface-300 m-0 pl-6 whitespace-pre-wrap">{{ event.description }}</p>
        </div>

        <div v-if="event.location" class="flex flex-col gap-2">
            <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                <i class="pi pi-map-marker"></i>
                <span class="font-semibold">Location</span>
            </div>
            <p class="text-surface-700 dark:text-surface-300 m-0 pl-6">{{ event.location }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-calendar"></i>
                    <span class="font-semibold">Start</span>
                </div>
                <div class="pl-6">
                    <p class="text-surface-700 dark:text-surface-300 m-0">{{ formattedStart }}</p>
                </div>
            </div>

            <div v-if="formattedEnd" class="flex flex-col gap-2">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-calendar-times"></i>
                    <span class="font-semibold">End</span>
                </div>
                <div class="pl-6">
                    <p class="text-surface-700 dark:text-surface-300 m-0">{{ formattedEnd }}</p>
                </div>
            </div>

            <div v-if="participationDeadline" class="flex flex-col gap-2">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-clock"></i>
                    <span class="font-semibold text-orange-500">Deadline</span>
                </div>
                <div class="pl-6">
                    <p class="text-surface-700 dark:text-surface-300 m-0">{{ participationDeadline }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
