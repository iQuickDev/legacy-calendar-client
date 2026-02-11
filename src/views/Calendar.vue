<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { format } from 'date-fns';
import { useCalendar } from '../composables/useCalendar';
import { useToast } from 'primevue/usetoast';
import CalendarCell from '../components/calendar/CalendarCell.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import EventDialog from '../components/calendar/EventDialog.vue';
import EventViewDialog from '../components/calendar/EventViewDialog.vue';
import type { CalendarEvent } from '../types/Calendar';
import type { CreateEventDto } from '../services/API';
import API from '../services/API';

const toast = useToast();
const route = useRoute();
const { currentDate, days, nextMonth, prevMonth, addEvent, deleteEvent, fetchEvents, loading, error } = useCalendar();

const showDialog = ref(false);
const selectedDate = ref(new Date());

// Fetch events on mount
onMounted(async () => {
    await fetchEvents();
    checkQueryForEvent();
});

// Watch query params
watch(() => route.query.eventId, () => {
    checkQueryForEvent();
});

const checkQueryForEvent = async () => {
    const eventId = route.query.eventId;
    if (eventId) {
        try {
            const response = await API.findOneEvent(Number(eventId));
             // Convert API Event to CalendarEvent (if they differ, but they seem compatible enough or I can cast)
             // CalendarEvent type vs API Event type. 
             // CalendarEvent usually extends EventInput from FullCalendar or similar? 
             // Let's check types. Assuming structure is close.
             // Actually, API returns `Event`. `selectedEvent` is `CalendarEvent | null`.
             // `CalendarEvent` probably has `start` and `end` as Date objects?
            const apiEvent = response.data;
            selectedEvent.value = {
                ...apiEvent,
                // Ensure dates are strings or Dates as component expects?
                // EventViewDialog uses props.event.startTime (string) in computed.
                // It seems compatible.
            } as any; 
            showViewDialog.value = true;
        } catch (e) {
            console.error('Failed to load event from query param', e);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Could not load event details' });
        }
    }
};

const openAddEvent = (date: Date) => {
    selectedDate.value = date;
    showDialog.value = true;
};

const isSaving = ref(false);

const handleSaveEvent = async (eventData: CreateEventDto) => {
    isSaving.value = true;
    try {
        const success = await addEvent(eventData);
        if (success) {
            toast.add({
                severity: 'success',
                summary: 'Event Created',
                detail: `"${eventData.title}" has been added`,
                life: 3000
            });
            showDialog.value = false;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: error.value || 'Failed to create event',
                life: 4000
            });
        }
    } finally {
        isSaving.value = false;
    }
};

// Event view dialog state
const showViewDialog = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);

const openViewEvent = (event: CalendarEvent) => {
    selectedEvent.value = event;
    showViewDialog.value = true;
};

const handleDeleteEvent = async (id: number) => {
    const success = await deleteEvent(id);
    if (success) {
        toast.add({
            severity: 'success',
            summary: 'Event Deleted',
            detail: 'The event has been removed',
            life: 3000
        });
        showViewDialog.value = false;
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.value || 'Failed to delete event',
            life: 4000
        });
    }
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<template>
    <div class="calendar-container flex flex-col p-4 md:px-6 md:py-4 gap-3 md:gap-4 w-full">
        <!-- Loading Overlay -->
        <div v-if="loading && !isSaving" class="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <ProgressSpinner />
        </div>

        <!-- Header -->
        <div class="flex flex-row items-center justify-between gap-2">
            <div class="flex items-center gap-1 sm:gap-2">
                <Button icon="pi pi-chevron-left" @click="prevMonth" text rounded aria-label="Previous Month"
                    class="!p-1 sm:!p-2" />
                <Button icon="pi pi-chevron-right" @click="nextMonth" text rounded aria-label="Next Month"
                    class="!p-1 sm:!p-2" />
            </div>
            <h1
                class="text-lg sm:text-2xl md:text-3xl font-bold text-surface-900 dark:text-surface-0 whitespace-nowrap">
                {{ format(currentDate, 'MMMM yyyy') }}
            </h1>
            <Button label="Today" @click="currentDate = new Date()" outlined size="small"
                class="!text-xs sm:!text-sm" />
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-grid flex-1 overflow-hidden md:overflow-hidden flex flex-col">
            <!-- Weekday Headers (Hidden on Mobile) -->
            <div class="hidden md:grid grid-cols-7">
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
        <EventDialog v-model:visible="showDialog" :initial-date="selectedDate" @save="handleSaveEvent" :loading="isSaving" />

        <!-- Event View Dialog -->
        <EventViewDialog v-model:visible="showViewDialog" :event="selectedEvent" @delete="handleDeleteEvent"
            @joined="showViewDialog = false" />
    </div>
</template>

<style scoped>
/* Calendar container - full viewport height minus header */
.calendar-container {
    height: calc(100vh - 60px);
    min-height: 500px;
    position: relative;
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
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE/Edge */
}

.days-grid::-webkit-scrollbar {
    display: none;
    /* Chrome, Safari, Opera */
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
