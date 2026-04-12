<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import Slider from 'primevue/slider';
import Divider from 'primevue/divider';
import { type EventFeature } from '../../types/Event';

import { FEATURES } from '../../constants/features';
import { toggleFeature as toggleFeatureInSelection } from '../../utils/event';

const props = defineProps<{
    visible: boolean;
    availableFeatures?: EventFeature[];
    initialFeatures?: EventFeature[];
    submitLabel?: string;
    featurePrices?: Record<EventFeature, number | null>;
    featureSplitPrices?: Record<EventFeature, number | null>;
    initialHasVehicle?: boolean;
    initialVehicleSeats?: number;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', data: { features: EventFeature[], vehicle: { hasVehicle: boolean, vehicleSeats: number } }): void;
}>();

const selectedFeatures = ref<EventFeature[]>([]);
const hasVehicle = ref(false);
const vehicleSeats = ref(0);

const isFeatureAvailable = (id: EventFeature) => {
    // If availableFeatures is undefined, show all (backward compatibility)
    if (props.availableFeatures === undefined) return true;
    return props.availableFeatures.includes(id);
};

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

const toggleFeature = (feature: EventFeature) => {
    toggleFeatureInSelection(selectedFeatures.value, feature);
};

const onConfirm = () => {
    emit('confirm', {
        features: selectedFeatures.value,
        vehicle: {
            hasVehicle: hasVehicle.value,
            vehicleSeats: hasVehicle.value ? vehicleSeats.value : 0
        }
    });
    selectedFeatures.value = [];
    hasVehicle.value = false;
    vehicleSeats.value = 0;
};

watch(() => props.visible, (newVal) => {
    if (newVal) {
        selectedFeatures.value = props.initialFeatures ? [...props.initialFeatures] : [];
        hasVehicle.value = props.initialHasVehicle ?? false;
        vehicleSeats.value = props.initialVehicleSeats ?? 0;
    }
});
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Join Event"
        :style="{ width: '400px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid text-center" dismissableMask
        :draggable="false">

        <div class="flex flex-col gap-6 py-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button v-for="feature in FEATURES" :key="feature.id"
                    @click="isFeatureAvailable(feature.id) && toggleFeature(feature.id)"
                    class="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 focus:outline-none relative overflow-hidden group"
                    :class="[
                        isFeatureAvailable(feature.id) ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-40 cursor-not-allowed grayscale border-zinc-200 dark:border-zinc-800',
                        selectedFeatures.includes(feature.id)
                            ? `${feature.color} border-transparent ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-current shadow-lg`
                            : isFeatureAvailable(feature.id)
                                ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm'
                                : 'border-zinc-100 dark:border-zinc-900'
                    ]" :disabled="!isFeatureAvailable(feature.id)">
                    
                    <span class="text-3xl group-hover:scale-110 transition-transform duration-300">{{ feature.icon }}</span>
                    
                    <div class="flex flex-col items-center">
                        <span class="font-bold text-xs uppercase tracking-wider">{{ feature.label }}</span>
                        <div v-if="featurePrices?.[feature.id] !== null && featurePrices?.[feature.id] !== undefined" 
                            class="flex flex-col items-center mt-1 pt-1 border-t border-current/10 w-full">
                            <span class="text-[8px] opacity-60 uppercase font-black tracking-tighter">Budget: {{ currency.format(featurePrices[feature.id]!) }}</span>
                            <span class="text-[10px] font-black leading-tight mt-0.5" :class="selectedFeatures.includes(feature.id) ? 'text-white' : 'text-emerald-500'">
                                Share: {{ currency.format(featureSplitPrices?.[feature.id] || 0) }}
                            </span>
                        </div>
                    </div>

                    <!-- Selected Indicator -->
                    <div v-if="selectedFeatures.includes(feature.id)" class="absolute top-2 right-2">
                        <i class="pi pi-check-circle text-xs"></i>
                    </div>
                </button>
            </div>

            <Divider />

            <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between px-2">
                    <div class="flex flex-col items-start">
                        <span class="font-bold text-sm uppercase tracking-wider text-zinc-400">Transport</span>
                        <span class="text-xs text-zinc-500">Do you have a vehicle?</span>
                    </div>
                    <InputSwitch v-model="hasVehicle" />
                </div>

                <div v-if="hasVehicle" class="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">

                    <div class="flex flex-col items-start gap-2 px-2">
                        <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Available Seats</span>
                        <div class="flex items-center gap-4 w-full">
                            <Slider v-model="vehicleSeats" :min="0" :max="10" class="flex-1" />
                            <span class="text-xl font-black text-emerald-500 w-8">{{ vehicleSeats }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <Button label="Cancel" severity="secondary" text @click="emit('update:visible', false)" />
                <Button :label="submitLabel || 'Join Event'" icon="pi pi-check" @click="onConfirm" />
            </div>
        </template>
    </Dialog>
</template>
