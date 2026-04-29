<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import type { CalendarDay } from '../../types/Calendar';
import type { Event } from '../../types/Event';
import UpcomingEventCard from '../UpcomingEventCard.vue';

const props = defineProps<{
    visible: boolean;
    day: CalendarDay | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'add-event', date: Date): void;
    (e: 'view-event', event: Event): void;
}>();

const close = () => emit('update:visible', false);

const dateTitle = computed(() => {
    if (!props.day) return '';
    return format(props.day.date, 'EEEE, MMMM do');
});

const handleAddEvent = () => {
    if (props.day) {
        emit('add-event', props.day.date);
        close();
    }
};

const handleViewEvent = (event: Event) => {
    emit('view-event', event);
    close();
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        modal
        header=" "
        :style="{ width: '90vw', maxWidth: '500px' }"
        :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
        class="day-view-dialog"
        :pt="{
            header: 'pb-0!'
        }"
    >
        <div v-if="day" class="flex h-full max-h-[80vh] flex-col">
            <div class="relative border-b border-zinc-800 px-6 pb-4">
                <h2 class="mb-1 text-xs font-bold tracking-widest text-zinc-400 uppercase">Day Overview</h2>
                <h1 class="text-2xl font-black text-white">{{ dateTitle }}</h1>
            </div>

            <div class="flex min-h-[200px] flex-1 flex-col gap-4 overflow-y-auto p-4">
                <div v-if="day.events.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                    <i class="pi pi-calendar-times mb-4 text-4xl text-zinc-800"></i>
                    <p class="font-medium text-zinc-500">No events scheduled for this day.</p>
                </div>

                <UpcomingEventCard
                    v-for="event in day.events"
                    :key="event.id"
                    :event="event"
                    class="border-zinc-800! bg-zinc-900/50! hover:border-zinc-700!"
                    @view="handleViewEvent"
                />
            </div>

            <div class="border-t border-zinc-800 bg-zinc-950/80 p-4 backdrop-blur-md">
                <Button
                    label="Add New Event"
                    icon="pi pi-plus"
                    class="w-full rounded-xl! py-3! font-bold!"
                    @click="handleAddEvent"
                />
            </div>
        </div>
    </Dialog>
</template>

<style scoped>
.day-view-dialog :deep(.p-dialog-content) {
    scrollbar-width: none;
}
.day-view-dialog :deep(.p-dialog-content)::-webkit-scrollbar {
    display: none;
}

@media (max-width: 641px) {
    .day-view-dialog :deep(.p-dialog-root) {
        height: 100%;
        max-height: 100%;
    }
}
</style>
