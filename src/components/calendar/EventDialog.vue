<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import ToggleSwitch from 'primevue/toggleswitch';
import type { CreateEventDto, EventFeature } from '../../types/Event';
import type { User } from '../../types/User';
import { useAPIStore } from '../../stores/api';
import { useSessionStore } from '../../stores/session';
import { baseURL } from '../../services/API';

const props = defineProps<{
    visible: boolean;
    initialDate: Date;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'save', event: CreateEventDto): void;
}>();

const title = ref('');
const description = ref('');
const location = ref('');
const isOpen = ref(true);
const selectedFeatures = ref<EventFeature[]>([]);

import { FEATURES } from '../../constants/features';

const toggleFeature = (feature: EventFeature) => {
    const index = selectedFeatures.value.indexOf(feature);
    if (index === -1) {
        selectedFeatures.value.push(feature);
    } else {
        selectedFeatures.value.splice(index, 1);
    }
};

const startDateOnly = ref<Date | null>(null);
const startTimeOnly = ref<Date | null>(null);

const endDateOnly = ref<Date | null>(null);
const endTimeOnly = ref<Date | null>(null);

const selectedParticipants = ref<number[]>([]);
const allParticipants = ref<User[]>([]);

const fetchUsers = async () => {
    try {
        const { client } = useAPIStore();
        const sessionStore = useSessionStore();
        const response = await client.findAllUsers();
        allParticipants.value = response.data.filter(user => user.id !== sessionStore.currentUser?.id);
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
};

watch(() => props.visible, (newVal) => {
    if (newVal) {
        title.value = '';
        description.value = '';
        location.value = '';
        selectedParticipants.value = [];
        isOpen.value = true;
        selectedFeatures.value = [];

        startDateOnly.value = new Date(props.initialDate);
        startTimeOnly.value = new Date(props.initialDate);

        const end = new Date(props.initialDate);
        end.setHours(end.getHours() + 1);

        endDateOnly.value = null;
        endTimeOnly.value = null;

        fetchUsers();
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
        description: description.value || undefined,
        location: location.value || undefined,
        startTime: start.toISOString(),
        endTime: end ? end.toISOString() : undefined,
        participants: selectedParticipants.value.length > 0 ? selectedParticipants.value : undefined,
        isOpen: isOpen.value,
        hasFood: selectedFeatures.value.includes('FOOD'),
        hasWeed: selectedFeatures.value.includes('WEED'),
        hasSleep: selectedFeatures.value.includes('SLEEP'),
        hasAlcohol: selectedFeatures.value.includes('ALCOHOL'),
    });
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Add New Event"
        :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid" dismissableMask
        :draggable="false">
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

            <div class="flex flex-col gap-2">
                <label class="font-semibold">Start</label>
                <div class="flex gap-2">
                    <DatePicker v-model="startDateOnly" class="flex-1" placeholder="Date" />
                    <DatePicker v-model="startTimeOnly" timeOnly class="w-24" placeholder="Time" />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label class="font-semibold">End (Optional)</label>
                <div class="flex gap-2">
                    <DatePicker v-model="endDateOnly" class="flex-1" placeholder="Date" />
                    <DatePicker v-model="endTimeOnly" timeOnly class="w-24" placeholder="Time" />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label for="participants" class="font-semibold">Participants</label>
                <MultiSelect id="participants" v-model="selectedParticipants" :options="allParticipants"
                    optionLabel="username" optionValue="id" placeholder="Select Participants" display="chip" filter
                    class="w-full">
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <Avatar
                                :image="slotProps.option.profilePicture ? `${baseURL}${slotProps.option.profilePicture}` : undefined"
                                :label="!slotProps.option.profilePicture ? slotProps.option.username.charAt(0) : undefined"
                                shape="circle" size="small" />
                            <span>{{ slotProps.option.username }}</span>
                        </div>
                    </template>
                    <template #chip="slotProps">
                        <div class="flex items-center gap-1 px-1">
                            <Avatar
                                :image="allParticipants.find((p: User) => p.id === slotProps.value)?.profilePicture ? `${baseURL}${allParticipants.find((p: User) => p.id === slotProps.value)?.profilePicture}` : undefined"
                                :label="!allParticipants.find((p: User) => p.id === slotProps.value)?.profilePicture ? allParticipants.find((p: User) => p.id === slotProps.value)?.username.charAt(0) : undefined"
                                shape="circle" class="!w-4 !h-4 !text-[10px]" />
                            <span>{{allParticipants.find((p: User) => p.id === slotProps.value)?.username}}</span>
                        </div>
                    </template>
                </MultiSelect>
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-semibold">Features</label>
                <div class="grid grid-cols-4 gap-2">
                    <button v-for="feature in FEATURES" :key="feature.id" @click="toggleFeature(feature.id)"
                        type="button"
                        class="flex flex-col cursor-pointer items-center justify-center gap-2 p-2 rounded-xl border-1  border-zinc-800 transition-all duration-200 hover:scale-[1.02] focus:outline-none"
                        :class="[
                            selectedFeatures.includes(feature.id)
                                ? `${feature.color} border-current`
                                : ''
                        ]">
                        <span class="text-2xl">{{ feature.icon }}</span>
                        <span class="text-xs font-medium">{{ feature.label }}</span>
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-between p-3">
                <div class="flex flex-col gap-1">
                    <label for="isOpen" class="font-semibold cursor-pointer">Open Event</label>
                    <small class="text-surface-500">Anyone can see and join this event</small>
                </div>
                <ToggleSwitch id="isOpen" v-model="isOpen" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="emit('update:visible', false)" :disabled="loading" />
            <Button :label="loading ? 'Saving...' : 'Save'" :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                @click="onSave" autofocus :disabled="loading" />
        </template>
    </Dialog>
</template>

<style scoped></style>
