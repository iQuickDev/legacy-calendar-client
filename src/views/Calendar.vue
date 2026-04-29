<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { format } from 'date-fns';
import { useCalendar } from '../composables/useCalendar';
import { useToast } from 'primevue/usetoast';
import CalendarCell from '../components/calendar/CalendarCell.vue';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import EventDialog from '../components/calendar/EventDialog.vue';
import EventViewDialog from '../components/calendar/EventViewDialog.vue';
import DayViewDialog from '../components/calendar/DayViewDialog.vue';
import type { CalendarDay } from '../types/Calendar';
import type { Event, CreateEventDto } from '../types/Event';

const toast = useToast();
const {
    currentDate,
    days,
    events,
    isTodayMonth,
    nextMonth,
    prevMonth,
    goToToday,
    prefetchNextMonth,
    prefetchPrevMonth,
    prefetchTodayMonth,
    addEvent,
    deleteEvent,
    loading,
    error
} = useCalendar();

const showDialog = ref(false);
const selectedDate = ref(new Date());

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

// Day View state
const showDayViewDialog = ref(false);
const selectedDay = ref<CalendarDay | null>(null);

const handleZoomDay = (day: CalendarDay) => {
    selectedDay.value = day;
    showDayViewDialog.value = true;
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Auto-scroll to today on mobile
const daysGridRef = ref<HTMLElement | null>(null);

const scrollToToday = () => {
    if (window.innerWidth >= 768) return;
    nextTick(() => {
        const todayEl = daysGridRef.value?.querySelector('[data-today]') as HTMLElement | null;
        todayEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
};

const touchStartX = ref(0);
const touchEndX = ref(0);

const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.changedTouches[0]?.screenX ?? 0;
};

const handleTouchEnd = (e: TouchEvent) => {
    touchEndX.value = e.changedTouches[0]?.screenX ?? 0;
    handleSwipe();
};

const handleSwipe = () => {
    const swipeThreshold = 50;
    if (touchEndX.value < touchStartX.value - swipeThreshold) {
        nextMonth();
    }
    if (touchEndX.value > touchStartX.value + swipeThreshold) {
        prevMonth();
    }
};

onMounted(scrollToToday);
watch(days, scrollToToday);
</script>

<template>
    <div class="calendar-container flex w-full flex-col gap-3 p-1 md:gap-4 md:p-4 md:px-6 md:py-4">
        <!-- Loading Overlay -->
        <div v-if="loading && !isSaving" class="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
            <ProgressSpinner />
        </div>

        <!-- Header -->
        <div class="flex flex-row items-center justify-between gap-2">
            <div class="flex items-center gap-1 sm:gap-2">
                <Button
                    icon="pi pi-chevron-left"
                    @click="prevMonth"
                    @mouseenter="prefetchPrevMonth"
                    @focus="prefetchPrevMonth"
                    text
                    rounded
                    aria-label="Previous Month"
                    class="p-1! sm:p-2!"
                />
                <Button
                    icon="pi pi-chevron-right"
                    @click="nextMonth"
                    @mouseenter="prefetchNextMonth"
                    @focus="prefetchNextMonth"
                    text
                    rounded
                    aria-label="Next Month"
                    class="p-1! sm:p-2!"
                />
            </div>
            <h1
                class="text-surface-900 dark:text-surface-0 text-lg font-bold whitespace-nowrap sm:text-2xl md:text-3xl"
            >
                {{ format(currentDate, 'MMMM yyyy') }}
            </h1>
            <div class="flex min-w-[60px] justify-end sm:min-w-[100px]">
                <Transition name="fade-scale">
                    <Button
                        v-if="!isTodayMonth"
                        label="Today"
                        icon="pi pi-calendar"
                        @click="goToToday"
                        @mouseenter="prefetchTodayMonth"
                        @focus="prefetchTodayMonth"
                        outlined
                        severity="secondary"
                        size="small"
                        class="rounded-xl! text-xs! sm:text-sm!"
                    />
                </Transition>
            </div>
        </div>

        <!-- Calendar Grid -->
        <div
            class="calendar-grid flex flex-1 flex-col overflow-hidden md:overflow-hidden"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
        >
            <!-- Weekday Headers -->
            <div class="grid grid-cols-7">
                <div
                    v-for="day in weekDays"
                    :key="day"
                    class="weekday-header text-surface-500 p-1 text-center text-[10px] font-medium tracking-wider uppercase md:p-3 md:text-sm"
                >
                    {{ day }}
                </div>
            </div>

            <!-- Days Grid -->
            <div ref="daysGridRef" class="days-grid flex-1">
                <CalendarCell
                    v-for="day in days"
                    :key="day.date.toISOString()"
                    :day="day"
                    @add-event="openAddEvent"
                    @view-event="openViewEvent"
                    @zoom-day="handleZoomDay"
                />
            </div>
        </div>

        <!-- Event Dialog -->
        <EventDialog
            v-model:visible="showDialog"
            :initial-date="selectedDate"
            @save="handleSaveEvent"
            :loading="isSaving"
        />

        <!-- Event View Dialog -->
        <EventViewDialog v-model:visible="showViewDialog" :event="selectedEvent" @delete="handleDeleteEvent" />

        <!-- Day View Dialog -->
        <DayViewDialog
            v-model:visible="showDayViewDialog"
            :day="selectedDay"
            @add-event="openAddEvent"
            @view-event="openViewEvent"
        />
    </div>
</template>

<style scoped>
/* Calendar container - full viewport height minus header */
.calendar-container {
    height: calc(100vh - 60px);
    min-height: 500px;
    position: relative;
}

/* Days grid - uniform grid layout for all sizes */
.days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-auto-rows: minmax(80px, 1fr);
    gap: 1px;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.001);
    overflow-y: auto;
    /* Hide scrollbar but keep functionality */
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.days-grid::-webkit-scrollbar {
    display: none;
}

@media (min-width: 768px) {
    .days-grid {
        grid-auto-rows: 1fr;
        overflow: hidden;
    }
}

.fade-scale-enter-active,
.fade-scale-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
    opacity: 0;
    transform: scale(0.95);
}
</style>
