<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import Slider from 'primevue/slider';
import Divider from 'primevue/divider';
import { type EventFeature } from '../../types/Event';

import { FEATURES } from '../../constants/features';

const props = defineProps<{
    visible: boolean;
    availableFeatures?: EventFeature[];
    initialFeatures?: EventFeature[];
    submitLabel?: string;
    featurePrices?: Record<string, number | null>;
    featureSplitPrices?: Record<string, number | null>;
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

const toggleFeature = (feature: EventFeature) => {
    const index = selectedFeatures.value.indexOf(feature);
    if (index === -1) {
        selectedFeatures.value.push(feature);
    } else {
        selectedFeatures.value.splice(index, 1);
    }
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
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Event Features"
        :style="{ width: '400px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid text-center" dismissableMask
        :draggable="false">

        <div class="flex flex-col gap-6 py-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button v-for="feature in FEATURES" :key="feature.id"
                    @click="isFeatureAvailable(feature.id) && toggleFeature(feature.id)"
                    class="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-zinc-800 transition-all duration-200 focus:outline-none"
                    :class="[
                        isFeatureAvailable(feature.id) ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-40 cursor-not-allowed grayscale',
                        selectedFeatures.includes(feature.id)
                            ? `${feature.color} border-current`
                            : isFeatureAvailable(feature.id)
                                ? 'border-surface-200'
                                : ''
                    ]" :disabled="!isFeatureAvailable(feature.id)">
                    <span class="text-3xl">{{ feature.icon }}</span>
                    <div class="flex flex-col items-center">
                        <span class="font-medium text-sm">{{ feature.label }}</span>
                        <div v-if="featurePrices?.[feature.id]" class="flex flex-col items-center mt-1">
                            <span class="text-[9px] opacity-60 uppercase font-black leading-tight tracking-tighter">Budget: {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(featurePrices[feature.id]!) }}</span>
                            <span class="text-[11px] font-bold text-emerald-500 leading-tight">Share: {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(featureSplitPrices?.[feature.id] || 0) }}</span>
                        </div>
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
