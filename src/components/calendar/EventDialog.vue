<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import SelectButton from 'primevue/selectbutton';
import ToggleSwitch from 'primevue/toggleswitch';
import InputNumber from 'primevue/inputnumber';
import type { CreateEventDto, EventFeature } from '../../types/Event';
import type { User } from '../../types/User';
import { useAPIStore } from '../../stores/api';
import { useSessionStore } from '../../stores/session';
import { uploadsBaseURL } from '../../services/API';
import { FEATURES } from '../../constants/features';
import {
    combineDateAndTime,
    createNullFeatureRecord,
    featureFlagsFromSelection,
    getEventStartDateBounds,
    isEventStartTimeWithinAllowedRange,
    toggleFeature as toggleFeatureInSelection
} from '../../utils/event';

const props = defineProps<{
    visible: boolean;
    initialDate: Date;
    loading?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'save', event: CreateEventDto): void;
}>();

const sessionStore = useSessionStore();

const title = ref('');
const description = ref('');
const location = ref('');
const visibilityOptions = [
    { label: 'Private', value: 'private', icon: 'pi pi-lock', color: 'text-red-500' },
    { label: 'Standard', value: 'standard', icon: 'pi pi-users', color: 'text-zinc-500' },
    { label: 'Open', value: 'open', icon: 'pi pi-globe', color: 'text-emerald-500' }
];
const eventVisibility = ref('open');
const selectedFeatures = ref<EventFeature[]>([]);
const featurePrices = ref<Record<EventFeature, number | null>>(createNullFeatureRecord());

const startDateOnly = ref<Date | null>(null);
const startTimeOnly = ref<Date | null>(null);

const endDateOnly = ref<Date | null>(null);
const endTimeOnly = ref<Date | null>(null);

const selectedParticipants = ref<number[]>([]);
const allParticipants = ref<User[]>([]);
const saveAttempted = ref(false);
const startDateBounds = getEventStartDateBounds();

const fetchUsers = async () => {
    try {
        const response = await useAPIStore().client.findAllUsers();
        allParticipants.value = response.data.filter((user) => user.id !== sessionStore.currentUser?.id);
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
};

const toggleFeature = (feature: EventFeature) => {
    toggleFeatureInSelection(selectedFeatures.value, feature);
};

const validationError = computed(() => {
    if (!title.value) return 'Title is required.';
    if (!startDateOnly.value || !startTimeOnly.value) return 'Start date and time are required.';

    const start = combineDateAndTime(startDateOnly.value, startTimeOnly.value);
    if (!isEventStartTimeWithinAllowedRange(start)) {
        return 'Start date must be today or within 1 year from today.';
    }

    if (endDateOnly.value && endTimeOnly.value) {
        const end = combineDateAndTime(endDateOnly.value, endTimeOnly.value);
        if (!isEventStartTimeWithinAllowedRange(end)) {
            return 'End date must be today or within 1 year from today.';
        }
    }

    return null;
});

const showValidationError = computed(() => saveAttempted.value && validationError.value !== null);

watch(
    () => props.visible,
    (newVal) => {
        if (newVal) {
            saveAttempted.value = false;
            title.value = '';
            description.value = '';
            location.value = '';
            selectedParticipants.value = [];
            eventVisibility.value = 'open';
            selectedFeatures.value = [];
            featurePrices.value = createNullFeatureRecord();

            startDateOnly.value = new Date(props.initialDate);
            startTimeOnly.value = new Date(props.initialDate);

            endDateOnly.value = null;
            endTimeOnly.value = null;

            fetchUsers();
        }
    }
);

const onSave = () => {
    saveAttempted.value = true;

    if (validationError.value) return;

    if (!startDateOnly.value || !startTimeOnly.value) return;

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
        isOpen: eventVisibility.value === 'open',
        isPrivate: eventVisibility.value === 'private',
        ...featureFlagsFromSelection(selectedFeatures.value),
        foodPrice: featurePrices.value.FOOD ?? undefined,
        weedPrice: featurePrices.value.WEED ?? undefined,
        sleepPrice: featurePrices.value.SLEEP ?? undefined,
        alcoholPrice: featurePrices.value.ALCOHOL ?? undefined,
        beerPrice: featurePrices.value.BEER ?? undefined
    });
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        modal
        header="Add New Event"
        :style="{ width: '500px' }"
        :breakpoints="{ '640px': '95vw' }"
        class="p-fluid"
        dismissableMask
        :draggable="false"
    >
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
                        <DatePicker
                            v-model="startDateOnly"
                            class="flex-1"
                            placeholder="Date"
                            :minDate="startDateBounds.minDate"
                            :maxDate="startDateBounds.maxDate"
                        />
                        <DatePicker v-model="startTimeOnly" timeOnly class="w-24" placeholder="Time" />
                    </div>
                    <small v-if="showValidationError" class="text-red-500">{{ validationError }}</small>
                </div>

            <div class="flex flex-col gap-2">
                <label class="font-semibold">End (Optional)</label>
                <div class="flex gap-2">
                    <DatePicker
                        v-model="endDateOnly"
                        class="flex-1"
                        placeholder="Date"
                        :minDate="startDateBounds.minDate"
                        :maxDate="startDateBounds.maxDate"
                    />
                    <DatePicker v-model="endTimeOnly" timeOnly class="w-24" placeholder="Time" />
                </div>
            </div>

            <div class="flex flex-col gap-2">
                <label for="participants" class="font-semibold">Participants ({{ selectedParticipants.length }})</label>
                <MultiSelect
                    id="participants"
                    v-model="selectedParticipants"
                    :options="allParticipants"
                    optionLabel="username"
                    optionValue="id"
                    placeholder="Select Participants"
                    display="chip"
                    filter
                    class="w-full"
                >
                    <template #option="slotProps">
                        <div class="flex items-center gap-2">
                            <Avatar
                                :image="
                                    slotProps.option.profilePicture
                                        ? `${uploadsBaseURL}${slotProps.option.profilePicture}`
                                        : undefined
                                "
                                :label="
                                    !slotProps.option.profilePicture ? slotProps.option.username.charAt(0) : undefined
                                "
                                shape="circle"
                                size="small"
                            />
                            <span>{{ slotProps.option.username }}</span>
                        </div>
                    </template>
                    <template #chip="slotProps">
                        <div class="flex items-center gap-1 px-1">
                            <Avatar
                                :image="
                                    allParticipants.find((p: User) => p.id === slotProps.value)?.profilePicture
                                        ? `${uploadsBaseURL}${allParticipants.find((p: User) => p.id === slotProps.value)?.profilePicture}`
                                        : undefined
                                "
                                :label="
                                    !allParticipants.find((p: User) => p.id === slotProps.value)?.profilePicture
                                        ? allParticipants
                                              .find((p: User) => p.id === slotProps.value)
                                              ?.username.charAt(0)
                                        : undefined
                                "
                                shape="circle"
                                class="h-4! w-4! text-[10px]!"
                            />
                            <span>{{ allParticipants.find((p: User) => p.id === slotProps.value)?.username }}</span>
                        </div>
                    </template>
                </MultiSelect>
            </div>
            <div class="flex flex-col gap-3">
                <label class="text-sm font-bold tracking-widest text-zinc-500 uppercase"
                    >Event Features & Budgets</label
                >
                <div class="space-y-3">
                    <div
                        v-for="feature in FEATURES"
                        :key="feature.id"
                        class="flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-300"
                        :class="[
                            selectedFeatures.includes(feature.id)
                                ? 'border-emerald-500/30 bg-zinc-50 ring-1 ring-emerald-500/10 dark:bg-zinc-900/50'
                                : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
                        ]"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <button
                                    @click="toggleFeature(feature.id)"
                                    type="button"
                                    class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-inner transition-all duration-300 focus:outline-none"
                                    :class="[
                                        selectedFeatures.includes(feature.id)
                                            ? feature.color
                                            : 'bg-zinc-100 text-zinc-400 opacity-50 dark:bg-zinc-900'
                                    ]"
                                >
                                    {{ feature.icon }}
                                </button>
                                <div class="flex flex-col">
                                    <span
                                        class="text-sm font-bold"
                                        :class="selectedFeatures.includes(feature.id) ? '' : 'text-zinc-500'"
                                        >{{ feature.label }}</span
                                    >
                                    <span
                                        v-if="selectedFeatures.includes(feature.id)"
                                        class="animate-in fade-in text-[9px] font-black tracking-widest text-emerald-500 uppercase duration-500"
                                        >Feature Active</span
                                    >
                                    <span v-else class="text-[9px] font-black tracking-widest text-zinc-400 uppercase"
                                        >Disabled</span
                                    >
                                </div>
                            </div>
                            <ToggleSwitch
                                :modelValue="selectedFeatures.includes(feature.id)"
                                @update:modelValue="toggleFeature(feature.id)"
                            />
                        </div>

                        <div
                            v-if="selectedFeatures.includes(feature.id)"
                            class="animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                            <div class="flex flex-col gap-1.5 border-t border-zinc-200 pt-3 dark:border-zinc-800/50">
                                <div class="flex items-center justify-between">
                                    <label class="text-[10px] font-black tracking-widest text-zinc-400 uppercase"
                                        >Target Budget</label
                                    >
                                    <span class="text-[10px] font-bold text-zinc-400">Optional</span>
                                </div>
                                <div class="group relative">
                                    <InputNumber
                                        v-model="featurePrices[feature.id]"
                                        mode="currency"
                                        currency="EUR"
                                        locale="de-DE"
                                        placeholder="0.00"
                                        class="w-full"
                                        :min="0"
                                    />
                                    <div
                                        class="absolute inset-y-0 left-0 w-1 rounded-full bg-emerald-500 opacity-0 transition-opacity group-focus-within:opacity-100"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <label class="font-semibold">Event Visibility</label>
                <SelectButton
                    v-model="eventVisibility"
                    :options="visibilityOptions"
                    optionLabel="label"
                    optionValue="value"
                    :allowEmpty="false"
                    class="mt-2"
                    fluid
                >
                    <template #option="slotProps">
                        <div class="flex items-center gap-2" :class="slotProps.option.color">
                            <i :class="slotProps.option.icon"></i>
                            <span>{{ slotProps.option.label }}</span>
                        </div>
                    </template>
                </SelectButton>
                <small class="text-surface-500">
                    <template v-if="eventVisibility === 'open'">Anyone can see and join this event</template>
                    <template v-else-if="eventVisibility === 'private'">
                        Only invited participants can see this event
                    </template>
                    <template v-else>Everyone can see this event, only invited participants can join</template>
                </small>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="emit('update:visible', false)" :disabled="loading" />
            <Button
                :label="loading ? 'Saving...' : 'Save'"
                :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                @click="onSave"
                autofocus
                :disabled="loading"
            />
        </template>
    </Dialog>
</template>

<style scoped></style>
