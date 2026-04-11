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
import InputNumber from 'primevue/inputnumber';
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
const featurePrices = ref<Record<string, number | null>>({
    FOOD: null,
    WEED: null,
    SLEEP: null,
    ALCOHOL: null,
    BEER: null
});

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
        Object.keys(featurePrices.value).forEach(key => featurePrices.value[key] = null);

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
        hasBeer: selectedFeatures.value.includes('BEER'),
        foodPrice: featurePrices.value.FOOD || undefined,
        weedPrice: featurePrices.value.WEED || undefined,
        sleepPrice: featurePrices.value.SLEEP || undefined,
        alcoholPrice: featurePrices.value.ALCOHOL || undefined,
        beerPrice: featurePrices.value.BEER || undefined,
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
                <div class="space-y-3">
                    <div v-for="feature in FEATURES" :key="feature.id"
                        class="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-200"
                        :class="[selectedFeatures.includes(feature.id) ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-300 dark:border-zinc-700' : '']">
                        <button @click="toggleFeature(feature.id)" type="button"
                            class="flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-lg transition-all duration-200 focus:outline-none shrink-0"
                            :class="[selectedFeatures.includes(feature.id) ? feature.color : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400']">
                            <span class="text-2xl">{{ feature.icon }}</span>
                            <span class="text-[10px] font-bold">{{ feature.label }}</span>
                        </button>
                        
                        <div class="flex-1 flex flex-col gap-1">
                            <div class="flex items-center justify-between">
                                <span class="font-medium text-sm">{{ feature.label }}</span>
                                <ToggleSwitch :modelValue="selectedFeatures.includes(feature.id)" @update:modelValue="toggleFeature(feature.id)" />
                            </div>
                            
                            <div v-if="selectedFeatures.includes(feature.id)" class="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-left-2 duration-300">
                                <span class="text-xs text-zinc-500">Price:</span>
                                <div class="relative flex-1">
                                    <InputNumber v-model="featurePrices[feature.id]" mode="currency" currency="EUR" locale="de-DE" 
                                        placeholder="0.00" class="w-full !text-sm" size="small" :min="0" />
                                </div>
                            </div>
                        </div>
                    </div>
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
