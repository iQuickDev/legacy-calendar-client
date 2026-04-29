<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import ProgressSpinner from 'primevue/progressspinner';
import UpcomingEventCard from '../components/UpcomingEventCard.vue';
import UpcomingHeroCard from '../components/UpcomingHeroCard.vue';
import EventViewDialog from '../components/calendar/EventViewDialog.vue';
import API from '../services/API';
import type { Event } from '../types/Event';

const toast = useToast();
const loading = ref(true);
const events = ref<Event[]>([]);
const error = ref<string | null>(null);

// Reuse delete logic from calendar composable or define locally
// const { deleteEvent } = useCalendar();

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

const heroEvent = computed(() => (events.value.length > 0 ? events.value[0] : null));
const otherEvents = computed(() => (events.value.length > 1 ? events.value.slice(1) : []));

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
        events.value = events.value.filter((e) => e.id !== id);
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
    <div class="upcoming-container flex w-full flex-col gap-6 p-4 md:gap-8 md:px-8 md:py-6">
        <!-- Header -->
        <div class="flex flex-row items-end justify-between gap-2">
            <div>
                <h1 class="text-surface-900 dark:text-surface-0 text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                    Upcoming
                </h1>
                <p class="text-surface-400 mt-1 text-sm font-medium">Your schedule for the near future.</p>
            </div>

            <router-link :to="{ name: 'calendar' }" class="shrink-0">
                <Button label="View Calendar" icon="pi pi-calendar" text size="small" class="font-bold!" />
            </router-link>
        </div>

        <div v-if="loading" class="flex min-h-[400px] flex-1 items-center justify-center">
            <ProgressSpinner />
        </div>

        <div v-else-if="error" class="flex min-h-[400px] flex-1 flex-col items-center justify-center text-center">
            <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                <i class="pi pi-exclamation-triangle text-3xl"></i>
            </div>
            <h3 class="text-surface-0 text-xl font-bold">Something went wrong</h3>
            <p class="text-surface-400 mt-2 max-w-xs text-sm">{{ error }}</p>
            <Button
                label="Reload Events"
                icon="pi pi-refresh"
                class="mt-6 rounded-xl!"
                @click="fetchUpcomingEvents"
            />
        </div>

        <div
            v-else-if="events.length === 0"
            class="flex min-h-[500px] flex-1 flex-col items-center justify-center p-6 text-center"
        >
            <div class="relative mb-8">
                <div class="absolute inset-0 animate-pulse rounded-full bg-primary-500/10 blur-3xl"></div>
                <div class="bg-surface-900/50 relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/5 backdrop-blur-sm">
                    <i class="pi pi-calendar-plus text-surface-400 text-4xl"></i>
                </div>
            </div>
            <h3 class="text-surface-0 text-2xl font-bold">Quiet days ahead</h3>
            <p class="text-surface-400 mt-3 max-w-sm text-base leading-relaxed">
                You're all caught up! No upcoming events found. Why not plan something new?
            </p>
            <router-link :to="{ name: 'calendar' }" class="mt-8">
                <Button label="Schedule an Event" icon="pi pi-plus" class="rounded-xl! px-8! py-3!" />
            </router-link>
        </div>

        <div v-else class="flex flex-col gap-8 pb-20">
            <!-- Hero Section -->
            <section v-if="heroEvent" class="hero-section">
                <h3 class="text-surface-400 mb-4 text-xs font-bold tracking-widest uppercase">Next Up</h3>
                <UpcomingHeroCard :event="heroEvent" @view="openViewEvent" />
            </section>

            <!-- Grid Section -->
            <section v-if="otherEvents.length > 0" class="other-events-section">
                <h3 class="text-surface-400 mb-4 text-xs font-bold tracking-widest uppercase">Coming Later</h3>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <UpcomingEventCard
                        v-for="event in otherEvents"
                        :key="event.id"
                        :event="event"
                        class="fade-in"
                        @view="openViewEvent"
                    />
                </div>
            </section>
        </div>

        <!-- Event View Dialog -->
        <EventViewDialog v-model:visible="showViewDialog" :event="selectedEvent" @delete="handleDeleteEvent" />
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
