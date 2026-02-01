<script setup lang="ts">
import { ref } from 'vue';
import { format } from 'date-fns';
import { useCalendar } from '../composables/useCalendar';
import CalendarCell from '../components/calendar/CalendarCell.vue';
import Button from 'primevue/button';
import EventDialog from '../components/calendar/EventDialog.vue';
import EventViewDialog from '../components/calendar/EventViewDialog.vue';
import type { CalendarEvent } from '../types/Calendar';

const { currentDate, days, nextMonth, prevMonth, addEvent, updateEvent, deleteEvent } = useCalendar();

const showDialog = ref(false);
const selectedDate = ref(new Date());

const openAddEvent = (date: Date) => {
    selectedDate.value = date;
    showDialog.value = true;
};

const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'>) => {
    // Generate a simple ID
    const newEvent: CalendarEvent = {
        ...eventData,
        id: Date.now().toString(),
    };
    addEvent(newEvent);
    showDialog.value = false;
};

// Event view dialog state
const showViewDialog = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);

const openViewEvent = (event: CalendarEvent) => {
    selectedEvent.value = event;
    showViewDialog.value = true;
};

const handleUpdateEvent = (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    updateEvent(id, updates);
    showViewDialog.value = false;
};

const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
    showViewDialog.value = false;
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<template>
    <div class="calendar-container flex flex-col p-4 md:px-6 md:py-4 gap-3 md:gap-4 w-full">
        <!-- Header -->
        <div class="flex flex-row items-center justify-between gap-2">
            <div class="flex items-center gap-1 sm:gap-2">
                <Button icon="pi pi-chevron-left" @click="prevMonth" text rounded aria-label="Previous Month" class="!p-1 sm:!p-2" />
                <Button icon="pi pi-chevron-right" @click="nextMonth" text rounded aria-label="Next Month" class="!p-1 sm:!p-2" />
            </div>
            <h1 class="text-lg sm:text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 whitespace-nowrap">
                {{ format(currentDate, 'MMMM yyyy') }}
            </h1>
            <Button label="Today" @click="currentDate = new Date()" outlined size="small" class="!text-xs sm:!text-sm" />
        </div>

        <!-- Calendar Grid -->
        <div
            class="calendar-grid flex-1 overflow-hidden md:overflow-hidden flex flex-col">
            <!-- Weekday Headers (Hidden on Mobile) -->
            <div
                class="hidden md:grid grid-cols-7">
                <div v-for="day in weekDays" :key="day"
                    class="weekday-header p-3 text-sm font-medium text-center text-surface-500 uppercase tracking-wider">
                    {{ day }}
                </div>
            </div>

            <!-- Days Grid -->
            <div class="days-grid flex-1">
                <CalendarCell v-for="day in days" :key="day.date.toISOString()" :day="day" @add-event="openAddEvent"
                    @view-event="openViewEvent" />
            </div>
        </div>

        <!-- Event Dialog -->
        <EventDialog v-model:visible="showDialog" :initial-date="selectedDate" @save="handleSaveEvent" />

        <!-- Event View Dialog -->
        <EventViewDialog v-model:visible="showViewDialog" :event="selectedEvent" @save="handleUpdateEvent"
            @delete="handleDeleteEvent" />
    </div>
</template>

<style scoped>
/* Calendar container - full viewport height minus header */
.calendar-container {
    height: calc(100vh - 60px);
    min-height: 500px;
}

/* Weekday headers - subtle dividers */
.weekday-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* Days grid - mobile: scrollable list, desktop: fixed grid */
.days-grid {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    /* Hide scrollbar but keep functionality */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}

.days-grid::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}

/* Desktop: fixed 7-column grid */
@media (min-width: 768px) {
    .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        /* Use auto-rows to handle months with 4, 5, or 6 weeks */
        grid-auto-rows: 1fr;
        overflow: hidden;
        /* Add outer border on the grid to complete the box */
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        border-left: 1px solid rgba(255, 255, 255, 0.15);
    }
}
</style>
