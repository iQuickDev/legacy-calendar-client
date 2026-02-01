<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import type { CalendarEvent } from '../../types/Calendar';

const props = defineProps<{
    visible: boolean;
    initialDate: Date;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'save', event: Omit<CalendarEvent, 'id'>): void;
}>();

const title = ref('');
const description = ref('');
const location = ref('');

// Split State for Start
const startDateOnly = ref<Date | null>(null);
const startTimeOnly = ref<Date | null>(null);

// Split State for End
const endDateOnly = ref<Date | null>(null);
const endTimeOnly = ref<Date | null>(null);

const selectedParticipants = ref<string[]>([]);

// Mock participants
// Mock participants with images
const allParticipants = ref([
    { name: 'Alice', code: 'Alice', image: 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png' },
    { name: 'Bob', code: 'Bob', image: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png' },
    { name: 'Charlie', code: 'Charlie', image: 'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png' },
    { name: 'Dave', code: 'Dave', image: 'https://primefaces.org/cdn/primevue/images/avatar/ionibowcher.png' },
    { name: 'Eve', code: 'Eve', image: 'https://primefaces.org/cdn/primevue/images/avatar/xuxuefeng.png' }
]);

watch(() => props.visible, (newVal) => {
    if (newVal) {
        // Reset form
        title.value = '';
        description.value = '';
        location.value = '';
        selectedParticipants.value = [];

        // Set initial start date/time
        startDateOnly.value = new Date(props.initialDate);
        startTimeOnly.value = new Date(props.initialDate);

        // Default end date to 1 hour after start
        const end = new Date(props.initialDate);
        end.setHours(end.getHours() + 1);

        endDateOnly.value = new Date(end);
        endTimeOnly.value = new Date(end);
    }
});

const combineDateAndTime = (datePart: Date, timePart: Date): Date => {
    const combined = new Date(datePart);
    combined.setHours(timePart.getHours());
    combined.setMinutes(timePart.getMinutes());
    return combined;
};

const onSave = () => {
    if (!title.value || !startDateOnly.value || !startTimeOnly.value) return;

    const start = combineDateAndTime(startDateOnly.value, startTimeOnly.value);

    let end: Date | undefined;
    if (endDateOnly.value && endTimeOnly.value) {
        end = combineDateAndTime(endDateOnly.value, endTimeOnly.value);
    }

    emit('save', {
        title: title.value,
        description: description.value,
        location: location.value,
        startDate: start,
        endDate: end,
        participants: selectedParticipants.value
    });
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Add New Event"
        :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid" dismissableMask :draggable="false">
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <label for="title" class="font-semibold">Title</label>
                <InputText id="title" v-model="title" placeholder="Event Title" autofocus />
            </div>

            <div class="flex flex-col gap-2">
                <label for="desc" class="font-semibold">Description</label>
                <Textarea id="desc" v-model="description" rows="3" placeholder="Add a description..." />
            </div>

            <div class="flex flex-col gap-2">
                <label for="location" class="font-semibold">Location</label>
                <InputText id="location" v-model="location" placeholder="Meeting Room, Online, etc." />
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
                <label for="participants" class="font-semibold">Participants</label>
                <MultiSelect id="participants" v-model="selectedParticipants" :options="allParticipants"
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
                            <span>{{allParticipants.find(p => p.code === slotProps.value)?.name}}</span>
                        </div>
                    </template>
                </MultiSelect>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="emit('update:visible', false)" />
            <Button label="Save" icon="pi pi-check" @click="onSave" autofocus />
        </template>
    </Dialog>
</template>

<style scoped></style>
