<script setup lang="ts">
import { computed, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import type { CalendarEvent } from '../../types/Calendar';

const props = defineProps<{
    visible: boolean;
    event: CalendarEvent | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'delete', id: number): void;
}>();


// Formatted dates for display
const formattedStartDate = computed(() => {
    if (!props.event?.startTime) return '';
    return format(parseISO(props.event.startTime), 'EEEE, MMMM d, yyyy');
});

const formattedStartTime = computed(() => {
    if (!props.event?.startTime) return '';
    return format(parseISO(props.event.startTime), 'h:mm a');
});

const formattedEndDate = computed(() => {
    if (!props.event?.endTime) return '';
    return format(parseISO(props.event.endTime), 'EEEE, MMMM d, yyyy');
});

const formattedEndTime = computed(() => {
    if (!props.event?.endTime) return '';
    return format(parseISO(props.event.endTime), 'h:mm a');
});

// Reset state when dialog opens
watch(() => props.visible, () => {
    // No edit state to reset since we're view-only
});

const onDelete = () => {
    if (!props.event) return;
    emit('delete', props.event.id);
};

const onClose = () => {
    emit('update:visible', false);
};


</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Event Details"
        :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid" dismissableMask
        :draggable="false">

        <!-- View Mode -->
        <div v-if="event" class="flex flex-col gap-4">
            <!-- Title -->
            <div class="flex items-start justify-between gap-3">
                <h2 class="text-2xl font-bold m-0">{{ event.title }}</h2>
                <Tag v-if="event.endTime" severity="secondary" value="Scheduled" />
            </div>

            <Divider class="!my-2" />

            <!-- Description -->
            <div v-if="event.description" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-align-left"></i>
                    <span class="font-semibold">Description</span>
                </div>
                <p class="m-0 pl-6 text-surface-700 dark:text-surface-300">{{ event.description }}</p>
            </div>

            <!-- Location -->
            <div v-if="event.location" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-map-marker"></i>
                    <span class="font-semibold">Location</span>
                </div>
                <p class="m-0 pl-6 text-surface-700 dark:text-surface-300">{{ event.location }}</p>
            </div>

            <!-- Start Date/Time -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-calendar"></i>
                    <span class="font-semibold">Start</span>
                </div>
                <div class="pl-6">
                    <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedStartDate }}</p>
                    <p class="m-0 text-surface-600 dark:text-surface-400 text-sm">{{ formattedStartTime }}</p>
                </div>
            </div>

            <!-- End Date/Time -->
            <div v-if="event.endTime" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-calendar-times"></i>
                    <span class="font-semibold">End</span>
                </div>
                <div class="pl-6">
                    <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedEndDate }}</p>
                    <p class="m-0 text-surface-600 dark:text-surface-400 text-sm">{{ formattedEndTime }}</p>
                </div>
            </div>

            <!-- Host -->
            <div v-if="event.hostId" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-user"></i>
                    <span class="font-semibold">Host</span>
                </div>
                <p class="m-0 pl-6 text-surface-700 dark:text-surface-300">{{ event.hostId }}</p>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between w-full">
                <!-- Left side: Delete button -->
                <div>
                    <Button label="Delete" icon="pi pi-trash" severity="danger" text @click="onDelete" />
                </div>

                <!-- Right side: Close button -->
                <div class="flex gap-2">
                    <Button label="Close" icon="pi pi-times" @click="onClose" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped></style>
