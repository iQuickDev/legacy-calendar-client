<script setup lang="ts">
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import Chip from 'primevue/chip';
import type { CalendarEvent } from '../../types/Calendar';

const props = defineProps<{
    event: CalendarEvent;
}>();

const emit = defineEmits<{
    (e: 'click', event: CalendarEvent): void;
}>();

</script>

<template>
    <div class="event-card-wrapper mb-1" @click.stop="emit('click', event)">
        <Chip :label="event.title" class="w-full cursor-pointer hover:brightness-95 transition-all !justify-between"
            :pt="{
                root: { class: '!rounded-md shadow-sm' },
                label: { class: 'flex-1 truncate font-medium text-sm' }
            }">
            <template #icon>
                <div class="flex items-center gap-1 shrink-0 ml-auto">
                    <Avatar icon="pi pi-user" shape="circle" size="small"
                        class="!w-6 !h-6 !text-xs bg-surface-0/50 dark:bg-surface-900/50 backdrop-blur-sm" />

                    <Badge v-if="event.participants && event.participants.length > 0" :value="event.participants.length"
                        severity="contrast" class="!min-w-[1rem] !h-4 !text-[10px] !leading-3" />
                </div>
            </template>
        </Chip>
    </div>
</template>

<style scoped></style>
