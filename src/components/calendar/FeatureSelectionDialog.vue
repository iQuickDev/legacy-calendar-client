<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { type EventFeature } from '../../types/Event';

import { FEATURES } from '../../constants/features';

const props = defineProps<{
    visible: boolean;
    availableFeatures?: EventFeature[];
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', features: EventFeature[]): void;
}>();

const selectedFeatures = ref<EventFeature[]>([]);

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
    emit('confirm', selectedFeatures.value);
    selectedFeatures.value = []; // Reset for next time or keep if desired? strict reset is safer.
};

watch(() => props.visible, (newVal) => {
    if (newVal) {
        selectedFeatures.value = []; // Reset on open
    }
});
</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Event Features"
        :style="{ width: '400px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid text-center" dismissableMask
        :draggable="false">

        <div class="flex flex-col gap-6 py-4">
            <div class="grid grid-cols-2 gap-4">
                <button v-for="feature in FEATURES" :key="feature.id"
                    @click="isFeatureAvailable(feature.id) && toggleFeature(feature.id)"
                    class="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-1 border-zinc-800 transition-all duration-200 focus:outline-none"
                    :class="[
                        isFeatureAvailable(feature.id) ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-40 cursor-not-allowed grayscale',
                        selectedFeatures.includes(feature.id)
                            ? `${feature.color} border-current`
                            : isFeatureAvailable(feature.id)
                                ? 'border-surface-200'
                                : ''
                    ]" :disabled="!isFeatureAvailable(feature.id)">
                    <span class="text-3xl">{{ feature.icon }}</span>
                    <span class="font-medium">{{ feature.label }}</span>
                </button>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <Button label="Cancel" severity="secondary" text @click="emit('update:visible', false)" />
                <Button label="Join Event" icon="pi pi-check" @click="onConfirm" />
            </div>
        </template>
    </Dialog>
</template>
