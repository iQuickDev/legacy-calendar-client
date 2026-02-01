<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format } from 'date-fns';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import Avatar from 'primevue/avatar';
import Chip from 'primevue/chip';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import type { CalendarEvent } from '../../types/Calendar';

const props = defineProps<{
    visible: boolean;
    event: CalendarEvent | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'save', id: string, updates: Partial<CalendarEvent>): void;
    (e: 'delete', id: string): void;
}>();

// Edit mode state
const isEditMode = ref(false);

// Form fields
const title = ref('');
const description = ref('');
const location = ref('');
const startDateOnly = ref<Date | null>(null);
const startTimeOnly = ref<Date | null>(null);
const endDateOnly = ref<Date | null>(null);
const endTimeOnly = ref<Date | null>(null);
const selectedParticipants = ref<string[]>([]);

// Mock participants (same as EventDialog)
const allParticipants = ref([
    { name: 'Alice', code: 'Alice', image: 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png' },
    { name: 'Bob', code: 'Bob', image: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png' },
    { name: 'Charlie', code: 'Charlie', image: 'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png' },
    { name: 'Dave', code: 'Dave', image: 'https://primefaces.org/cdn/primevue/images/avatar/ionibowcher.png' },
    { name: 'Eve', code: 'Eve', image: 'https://primefaces.org/cdn/primevue/images/avatar/xuxuefeng.png' }
]);

// Formatted dates for display
const formattedStartDate = computed(() => {
    if (!props.event?.startDate) return '';
    return format(props.event.startDate, 'EEEE, MMMM d, yyyy');
});

const formattedStartTime = computed(() => {
    if (!props.event?.startDate) return '';
    return format(props.event.startDate, 'h:mm a');
});

const formattedEndDate = computed(() => {
    if (!props.event?.endDate) return '';
    return format(props.event.endDate, 'EEEE, MMMM d, yyyy');
});

const formattedEndTime = computed(() => {
    if (!props.event?.endDate) return '';
    return format(props.event.endDate, 'h:mm a');
});

// Watch for dialog open/close
watch(() => props.visible, (newVal) => {
    if (newVal && props.event) {
        // Reset to view mode
        isEditMode.value = false;
        
        // Load event data into form fields
        title.value = props.event.title;
        description.value = props.event.description;
        location.value = props.event.location;
        selectedParticipants.value = [...props.event.participants];
        
        // Set date/time fields
        startDateOnly.value = new Date(props.event.startDate);
        startTimeOnly.value = new Date(props.event.startDate);
        
        if (props.event.endDate) {
            endDateOnly.value = new Date(props.event.endDate);
            endTimeOnly.value = new Date(props.event.endDate);
        } else {
            endDateOnly.value = null;
            endTimeOnly.value = null;
        }
    }
});

const combineDateAndTime = (datePart: Date, timePart: Date): Date => {
    const combined = new Date(datePart);
    combined.setHours(timePart.getHours());
    combined.setMinutes(timePart.getMinutes());
    return combined;
};

const onSave = () => {
    if (!props.event || !title.value || !startDateOnly.value || !startTimeOnly.value) return;

    const start = combineDateAndTime(startDateOnly.value, startTimeOnly.value);

    let end: Date | undefined;
    if (endDateOnly.value && endTimeOnly.value) {
        end = combineDateAndTime(endDateOnly.value, endTimeOnly.value);
    }

    emit('save', props.event.id, {
        title: title.value,
        description: description.value,
        location: location.value,
        startDate: start,
        endDate: end,
        participants: selectedParticipants.value
    });

    isEditMode.value = false;
};

const onDelete = () => {
    if (!props.event) return;
    emit('delete', props.event.id);
};

const onClose = () => {
    emit('update:visible', false);
};

const toggleEditMode = () => {
    isEditMode.value = !isEditMode.value;
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal
        :header="isEditMode ? 'Edit Event' : 'Event Details'" :style="{ width: '500px' }"
        :breakpoints="{ '640px': '95vw' }" class="p-fluid" dismissableMask :draggable="false">
        
        <!-- View Mode -->
        <div v-if="!isEditMode && event" class="flex flex-col gap-4">
            <!-- Title -->
            <div class="flex items-start justify-between gap-3">
                <h2 class="text-2xl font-bold m-0">{{ event.title }}</h2>
                <Tag v-if="event.endDate" severity="secondary" value="Scheduled" />
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
            <div v-if="event.endDate" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-calendar-times"></i>
                    <span class="font-semibold">End</span>
                </div>
                <div class="pl-6">
                    <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedEndDate }}</p>
                    <p class="m-0 text-surface-600 dark:text-surface-400 text-sm">{{ formattedEndTime }}</p>
                </div>
            </div>

            <!-- Participants -->
            <div v-if="event.participants.length > 0" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-users"></i>
                    <span class="font-semibold">Participants ({{ event.participants.length }})</span>
                </div>
                <div class="pl-6 flex flex-wrap gap-2">
                    <Chip v-for="participant in event.participants" :key="participant" :label="participant">
                        <template #icon>
                            <Avatar :image="allParticipants.find(p => p.code === participant)?.image"
                                :label="participant.charAt(0)" shape="circle" class="!w-6 !h-6 !text-xs mr-2"
                                v-if="allParticipants.find(p => p.code === participant)?.image" />
                            <Avatar :label="participant.charAt(0)" shape="circle" class="!w-6 !h-6 !text-xs mr-2"
                                v-else />
                        </template>
                    </Chip>
                </div>
            </div>
        </div>

        <!-- Edit Mode -->
        <div v-else-if="isEditMode && event" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <label for="edit-title" class="font-semibold">Title</label>
                <InputText id="edit-title" v-model="title" placeholder="Event Title" autofocus />
            </div>

            <div class="flex flex-col gap-2">
                <label for="edit-desc" class="font-semibold">Description</label>
                <Textarea id="edit-desc" v-model="description" rows="3" placeholder="Add a description..." />
            </div>

            <div class="flex flex-col gap-2">
                <label for="edit-location" class="font-semibold">Location</label>
                <InputText id="edit-location" v-model="location" placeholder="Meeting Room, Online, etc." />
            </div>

            <!-- Start Date/Time -->
            <div class="flex flex-col gap-2">
                <label class="font-semibold">Start</label>
                <div class="flex gap-2">
                    <DatePicker v-model="startDateOnly" class="flex-1" placeholder="Date" />
                    <DatePicker v-model="startTimeOnly" timeOnly class="w-24" placeholder="Time" />
                </div>
            </div>

            <!-- End Date/Time -->
            <div class="flex flex-col gap-2">
                <label class="font-semibold">End</label>
                <div class="flex gap-2">
                    <DatePicker v-model="endDateOnly" class="flex-1" placeholder="Date" />
                    <DatePicker v-model="endTimeOnly" timeOnly class="w-24" placeholder="Time" />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label for="edit-participants" class="font-semibold">Participants</label>
                <MultiSelect id="edit-participants" v-model="selectedParticipants" :options="allParticipants"
                    optionLabel="name" optionValue="code" placeholder="Select Participants" display="chip" filter
                    class="w-full">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <Avatar :image="slotProps.option.image" shape="circle" size="small"
                                v-if="slotProps.option.image" />
                            <Avatar :label="slotProps.option.name.charAt(0)" shape="circle" size="small" v-else />
                            <span>{{ slotProps.option.name }}</span>
                        </div>
                    </template>
                    <template #chip="slotProps">
                        <div class="flex items-center gap-1 px-1">
                            <Avatar :image="allParticipants.find(p => p.code === slotProps.value)?.image" shape="circle"
                                class="!w-4 !h-4 !text-[10px]"
                                v-if="allParticipants.find(p => p.code === slotProps.value)?.image" />
                            <Avatar :label="slotProps.value.charAt(0)" shape="circle" class="!w-4 !h-4 !text-[10px]"
                                v-else />
                            <span>{{ allParticipants.find(p => p.code === slotProps.value)?.name }}</span>
                        </div>
                    </template>
                </MultiSelect>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between w-full">
                <!-- Left side: Delete button (only in view mode) -->
                <div>
                    <Button v-if="!isEditMode" label="Delete" icon="pi pi-trash" severity="danger" text
                        @click="onDelete" />
                </div>

                <!-- Right side: Action buttons -->
                <div class="flex gap-2">
                    <Button v-if="!isEditMode" label="Edit" icon="pi pi-pencil" outlined @click="toggleEditMode" />
                    <Button v-if="!isEditMode" label="Close" icon="pi pi-times" @click="onClose" />

                    <Button v-if="isEditMode" label="Cancel" icon="pi pi-times" text @click="toggleEditMode" />
                    <Button v-if="isEditMode" label="Save" icon="pi pi-check" @click="onSave" />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped></style>
