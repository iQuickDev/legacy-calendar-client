<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import UpcomingEventCard from '../components/UpcomingEventCard.vue';
import EventViewDialog from '../components/calendar/EventViewDialog.vue';
import API from '../services/API';
import type { Event } from '../types/Event';
import { useCalendar } from '../composables/useCalendar';

const toast = useToast();
const loading = ref(true);
const events = ref<Event[]>([]);
const error = ref<string | null>(null);

// Reuse delete logic from calendar composable or define locally
const { deleteEvent } = useCalendar();

const fetchUpcomingEvents = async () => {
    loading.value = true;
    error.value = null;
    try {
        const response = await API.findUpcomingEvents();
        events.value = response.data;
    } catch (err: any) {
        console.error('Failed to fetch upcoming events', err);
        error.value = err.response?.data?.message || 'Failed to load upcoming events';
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.value,
            life: 4000
        });
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchUpcomingEvents();
});

// Event view dialog state
const showViewDialog = ref(false);
const selectedEventId = ref<number | null>(null);

const selectedEvent = computed(() => {
    if (selectedEventId.value === null) return null;
    return events.value.find((e) => e.id === selectedEventId.value) || null;
});

const openViewEvent = (event: Event) => {
    selectedEventId.value = event.id;
    showViewDialog.value = true;
};

const handleDeleteEvent = async (id: number) => {
    // Delete event using calendar composable or API directly
    try {
        await API.deleteEvent(id);
        events.value = events.value.filter(e => e.id !== id);
        toast.add({
            severity: 'success',
            summary: 'Event Deleted',
            detail: 'The event has been removed',
            life: 3000
        });
        showViewDialog.value = false;
    } catch (err: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: err.response?.data?.message || 'Failed to delete event',
            life: 4000
        });
    }
};
</script>

<template>
    <div class="upcoming-container flex w-full flex-col gap-3 p-4 md:gap-4 md:px-6 md:py-4">
        <!-- Header matches Calendar.vue -->
        <div class="flex flex-row items-center justify-between gap-2 mb-2">
            <div>
                <h1 class="text-surface-900 dark:text-surface-0 text-lg font-bold sm:text-2xl md:text-3xl">
                    Upcoming Events
                </h1>
                <p class="mt-1 text-xs text-surface-400 sm:text-sm">
                    Your next 10 events, sorted by start time.
                </p>
            </div>
            
            <router-link :to="{ name: 'calendar' }" class="shrink-0">
                <Button label="Calendar" icon="pi pi-calendar" outlined size="small" class="text-xs! sm:text-sm!" />
            </router-link>
        </div>

        <div v-if="loading" class="flex flex-1 items-center justify-center min-h-[300px]">
            <ProgressSpinner />
        </div>

        <div v-else-if="error" class="flex flex-1 flex-col items-center justify-center text-center min-h-[300px]">
            <i class="pi pi-exclamation-circle mb-4 text-4xl text-red-500"></i>
            <h3 class="text-lg font-bold text-surface-0">Failed to load events</h3>
            <p class="mt-2 text-sm text-surface-400">{{ error }}</p>
            <Button label="Try Again" icon="pi pi-refresh" outlined size="small" class="mt-4" @click="fetchUpcomingEvents" />
        </div>

        <div v-else-if="events.length === 0" class="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-surface-900/30 text-center min-h-[300px] p-6">
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-800">
                <i class="pi pi-calendar-times text-2xl text-surface-400"></i>
            </div>
            <h3 class="text-lg font-bold text-surface-0">No upcoming events</h3>
            <p class="mt-2 max-w-sm text-sm text-surface-400">You don't have any upcoming events scheduled. Head over to the calendar to create one!</p>
            <router-link :to="{ name: 'calendar' }" class="mt-6">
                <Button label="Go to Calendar" icon="pi pi-calendar-plus" outlined />
            </router-link>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-12">
            <UpcomingEventCard
                v-for="event in events"
                :key="event.id"
                :event="event"
                class="fade-in"
                @view="openViewEvent"
            />
        </div>

        <!-- Event View Dialog -->
        <EventViewDialog
            v-model:visible="showViewDialog"
            :event="selectedEvent"
            @delete="handleDeleteEvent"
        />
    </div>
</template>

<style scoped>
.upcoming-container {
    height: calc(100vh - 60px);
    overflow-y: auto;
}

.fade-in {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { 
        opacity: 0; 
        transform: translateY(10px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
}
</style>
