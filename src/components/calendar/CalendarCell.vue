<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarDay } from '../../types/Calendar';
import type { Event } from '../../types/Event';
import EventCard from './EventCard.vue';

const props = defineProps<{
    day: CalendarDay;
}>();

defineEmits<{
    (e: 'add-event', date: Date): void;
    (e: 'view-event', event: Event): void;
}>();

const dayName = computed(() => {
    return props.day.date.toLocaleDateString('en-US', { weekday: 'short' });
});
</script>

<template>
    <div class="calendar-cell min-h-[60px] md:min-h-0 p-3 md:p-2 flex flex-row md:flex-col gap-3 md:gap-1 relative group cursor-pointer items-center md:items-stretch shrink-0 md:shrink"
        :class="[
            {
                'cell-active': day.isCurrentMonth,
                'cell-inactive': !day.isCurrentMonth,
                'cell-today': day.isToday,
                'hidden md:flex': !day.isCurrentMonth
            }
        ]" @click="$emit('add-event', day.date)">

        <!-- Date Header -->
        <div
            class="flex md:justify-between items-center mb-0 md:mb-1 shrink-0 w-12 md:w-auto flex-col md:flex-row gap-1">
            <!-- Mobile Day Name -->
            <span class="text-[10px] uppercase text-surface-500 font-bold md:hidden">
                {{ dayName }}
            </span>

            <span
                class="day-number text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300"
                :class="{
                    'today-badge': day.isToday,
                    'text-surface-600 dark:text-surface-400': !day.isToday && day.isCurrentMonth,
                    'text-surface-700': !day.isCurrentMonth
                }">
                {{ day.date.getDate() }}
            </span>
        </div>

        <!-- Events List -->
        <div class="flex flex-col gap-1 z-10 flex-1 w-full overflow-y-auto min-h-0 custom-scrollbar pr-1">
            <EventCard v-for="event in day.events" :key="event.id" :event="event" @click="$emit('view-event', event)" />
        </div>

        <!-- Hover overlay -->
        <div class="hover-overlay"></div>

        <!-- Today green glow -->
        <div v-if="day.isToday" class="today-glow"></div>
    </div>
</template>

<style scoped>
/* Base cell styling */
.calendar-cell {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Active (current month) cells */
.cell-active {
    background: transparent;
}

.cell-active:hover {
    background: rgba(255, 255, 255, 0.03);
    z-index: 10;
}

/* Inactive (other months) cells - more obvious disabled look */
.cell-inactive {
    background: rgba(0, 0, 0, 0.3);
    opacity: 0.35;
    pointer-events: none;
}

.cell-inactive .day-number {
    color: rgba(255, 255, 255, 0.25) !important;
}

/* Today cell - gentle green overlay */
.cell-today {
    background: rgba(34, 197, 94, 0.06);
    box-shadow: inset 0 0 30px rgba(34, 197, 94, 0.05);
}

.cell-today:hover {
    background: rgba(34, 197, 94, 0.1);
}

/* Today badge styling */
.today-badge {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white !important;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

/* Hover overlay with animated gradient */
.hover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.02) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0.02) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
}

.cell-active:hover .hover-overlay {
    opacity: 1;
}

/* Today green glow effect */
.today-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    opacity: 0.8;
}

/* Animated border glow on hover for active cells */
.cell-active::before {
    content: '';
    position: absolute;
    inset: 0;
    border: 1px solid transparent;
    transition: border-color 0.3s ease;
    pointer-events: none;
}

.cell-active:hover::before {
    border-color: rgba(255, 255, 255, 0.08);
}

/* Custom Scrollbar for events list */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
}

/* Firefox */
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
</style>
