<script setup lang="ts">
import Button from 'primevue/button';
import Divider from 'primevue/divider';

defineEmits<{
    (e: 'edit'): void;
    (e: 'delete'): void;
}>();
</script>

<template>
    <Divider class="my-2!" />

    <div class="flex flex-col gap-3 pb-4">
        <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
            <i class="pi pi-cog"></i>
            <span class="text-sm font-semibold tracking-wider uppercase">Event Settings</span>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
            <Button
                label="Edit Event"
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                class="rounded-xl!"
                @click="$emit('edit')"
            />
            <Button
                label="Delete Event"
                icon="pi pi-trash"
                severity="danger"
                outlined
                class="rounded-xl!"
                @click="$emit('delete')"
            />
        </div>
    </div>
</template>
