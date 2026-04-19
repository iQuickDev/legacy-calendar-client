<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Event, EventFeature, CreateEventDto } from '../../../types/Event';
import type { User } from '../../../types/User';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import MultiSelect from 'primevue/multiselect';
import ToggleSwitch from 'primevue/toggleswitch';
import SelectButton from 'primevue/selectbutton';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { FEATURES } from '../../../constants/features';
import { uploadsBaseURL } from '../../../services/API';
import {
    createNullFeatureRecord,
    featureFlagsFromSelection,
    featurePricesFromEvent,
    selectedFeaturesFromEvent,
    toggleFeature as toggleFeatureInSelection,
    combineDateAndTime
} from '../../../utils/event';

const props = defineProps<{
    event: Event;
    users: User[];
    saving: boolean;
}>();

const emit = defineEmits<{
    (e: 'save', dto: CreateEventDto): void;
    (e: 'cancel'): void;
}>();

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
const selectedParticipants = ref<number[]>([]);
const deadlineDateOnly = ref<Date | null>(null);
const deadlineTimeOnly = ref<Date | null>(null);

const initialize = () => {
    title.value = props.event.title;
    description.value = props.event.description || '';
    location.value = props.event.location || '';

    if (props.event.isPrivate) {
        eventVisibility.value = 'private';
    } else if (props.event.isOpen) {
        eventVisibility.value = 'open';
    } else {
        eventVisibility.value = 'standard';
    }

    selectedFeatures.value = selectedFeaturesFromEvent(props.event);
    featurePrices.value = featurePricesFromEvent(props.event);

    selectedParticipants.value = props.event.participants?.map((participant) => participant.id) || [];

    if (props.event.participationDeadline) {
        const deadline = new Date(props.event.participationDeadline);
        deadlineDateOnly.value = deadline;
        deadlineTimeOnly.value = deadline;
    } else {
        deadlineDateOnly.value = null;
        deadlineTimeOnly.value = null;
    }
};

watch(() => props.event, initialize, { immediate: true });

const toggleFeature = (feature: EventFeature) => {
    toggleFeatureInSelection(selectedFeatures.value, feature);
};

const onSave = () => {
    if (!title.value) return;

    emit('save', {
        title: title.value,
        description: description.value || undefined,
        location: location.value || undefined,
        startTime: props.event.startTime,
        endTime: props.event.endTime,
        participants: selectedParticipants.value,
        isOpen: eventVisibility.value === 'open',
        isPrivate: eventVisibility.value === 'private',
        ...featureFlagsFromSelection(selectedFeatures.value),
        foodPrice: featurePrices.value.FOOD ?? undefined,
        weedPrice: featurePrices.value.WEED ?? undefined,
        sleepPrice: featurePrices.value.SLEEP ?? undefined,
        alcoholPrice: featurePrices.value.ALCOHOL ?? undefined,
        beerPrice: featurePrices.value.BEER ?? undefined,
        participationDeadline:
            deadlineDateOnly.value && deadlineTimeOnly.value
                ? combineDateAndTime(deadlineDateOnly.value, deadlineTimeOnly.value).toISOString()
                : undefined
    });
};
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <label for="edit-title" class="text-sm font-bold tracking-wider text-zinc-500 uppercase"
                        >Title</label
                    >
                    <InputText id="edit-title" v-model="title" placeholder="Event Title" class="rounded-xl!" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="edit-desc" class="text-sm font-bold tracking-wider text-zinc-500 uppercase"
                        >Description</label
                    >
                    <Textarea
                        id="edit-desc"
                        v-model="description"
                        rows="4"
                        placeholder="Add a description..."
                        class="rounded-xl!"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="edit-location" class="text-sm font-bold tracking-wider text-zinc-500 uppercase"
                        >Location</label
                    >
                    <InputText
                        id="edit-location"
                        v-model="location"
                        placeholder="Meeting Room, Online, etc."
                        class="rounded-xl!"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-sm font-bold tracking-wider text-zinc-500 uppercase"
                        >Participation Deadline</label
                    >
                    <div class="flex gap-2">
                        <DatePicker
                            v-model="deadlineDateOnly"
                            class="flex-1 rounded-xl!"
                            placeholder="Date"
                        />
                        <DatePicker v-model="deadlineTimeOnly" timeOnly class="w-24 rounded-xl!" placeholder="Time" />
                    </div>
                    <small class="text-surface-500"
                        >Users won't be able to join or edit participation after this time.</small
                    >
                </div>

                <div class="mt-2 flex flex-col gap-2">
                    <label for="edit-participants" class="text-sm font-bold tracking-wider text-zinc-500 uppercase">
                        Participants ({{ selectedParticipants.length }})
                    </label>
                    <MultiSelect
                        id="edit-participants"
                        v-model="selectedParticipants"
                        :options="users"
                        optionLabel="username"
                        optionValue="id"
                        placeholder="Select Participants"
                        display="chip"
                        filter
                        class="w-full rounded-xl!"
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
                                        !slotProps.option.profilePicture
                                            ? slotProps.option.username.charAt(0)
                                            : undefined
                                    "
                                    shape="circle"
                                    size="small"
                                />
                                <span>{{ slotProps.option.username }}</span>
                            </div>
                        </template>
                    </MultiSelect>
                </div>

                <div class="mt-2 flex flex-col gap-2">
                    <label class="text-sm font-bold tracking-wider text-zinc-500 uppercase">Event Visibility</label>
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

            <div class="flex flex-col gap-4">
                <label class="text-sm font-bold tracking-wider text-zinc-500 uppercase">Event Features & Budgets</label>
                <div class="space-y-3">
                    <div
                        v-for="feature in FEATURES"
                        :key="feature.id"
                        class="flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200"
                        :class="[
                            selectedFeatures.includes(feature.id)
                                ? 'border-emerald-500/30 bg-zinc-50 dark:bg-zinc-900/50'
                                : 'border-zinc-200 dark:border-zinc-800'
                        ]"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div
                                    class="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                                    :class="
                                        selectedFeatures.includes(feature.id)
                                            ? feature.color
                                            : 'bg-zinc-100 opacity-50 dark:bg-zinc-800'
                                    "
                                >
                                    {{ feature.icon }}
                                </div>
                                <span
                                    class="font-bold"
                                    :class="selectedFeatures.includes(feature.id) ? '' : 'text-zinc-500'"
                                    >{{ feature.label }}</span
                                >
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
                            <div class="flex flex-col gap-1.5 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                                <label class="text-[10px] font-black tracking-widest text-zinc-400 uppercase"
                                    >Total Budget for {{ feature.label }}</label
                                >
                                <InputNumber
                                    v-model="featurePrices[feature.id]"
                                    mode="currency"
                                    currency="EUR"
                                    locale="de-DE"
                                    placeholder="0.00"
                                    class="w-full"
                                    :min="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex w-full justify-end gap-2 pt-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                severity="secondary"
                text
                @click="emit('cancel')"
                :disabled="saving"
            />
            <Button label="Save Changes" icon="pi pi-check" severity="success" @click="onSave" :loading="saving" />
        </div>
    </div>
</template>
