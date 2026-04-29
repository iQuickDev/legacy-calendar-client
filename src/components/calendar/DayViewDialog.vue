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
            root: { class: 'border-none bg-zinc-950 p-0 overflow-hidden' },
            header: { class: 'hidden' },
            content: { class: 'p-0' }
        }"
    >
        <div v-if="day" class="flex flex-col h-full max-h-[80vh]">
            <!-- Custom Header -->
            <div class="relative p-6 pb-4 border-b border-zinc-800">
                <Button 
                    icon="pi pi-times" 
                    text 
                    rounded 
                    class="absolute top-4 right-4 text-zinc-500!" 
                    @click="close"
                />
                <h2 class="text-zinc-400 text-xs font-bold tracking-widest uppercase mb-1">Day Overview</h2>
                <h1 class="text-2xl font-black text-white">{{ dateTitle }}</h1>
            </div>

            <!-- Events List -->
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-[200px]">
                <div v-if="day.events.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                    <i class="pi pi-calendar-times text-zinc-800 text-4xl mb-4"></i>
                    <p class="text-zinc-500 font-medium">No events scheduled for this day.</p>
                </div>
                
                <UpcomingEventCard
                    v-for="event in day.events"
                    :key="event.id"
                    :event="event"
                    class="bg-zinc-900/50! border-zinc-800! hover:border-zinc-700!"
                    @view="handleViewEvent"
                />
            </div>

            <!-- Footer Action -->
            <div class="p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
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
