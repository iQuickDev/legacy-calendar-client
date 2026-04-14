<script setup lang="ts">
import Avatar from 'primevue/avatar';
import Badge from 'primevue/badge';
import Chip from 'primevue/chip';
import type { Event } from '../../types/Event';
import { baseURL } from '../../services/API';
import { useMagicCard } from '../../composables/useMagicCard';

const props = defineProps<{
    event: Event;
}>();

const emit = defineEmits<{
    (e: 'click', event: Event): void;
}>();

const { cardRef, backgroundStyle } = useMagicCard({
    gradientSize: 150,
    gradientColor: '#ffffff',
    gradientOpacity: 0.15,
});

// Reference cardRef to satisfy TypeScript noUnusedLocals (it's used as a template ref)
cardRef;

</script>

<template>
    <div ref="cardRef" class="event-card-wrapper mb-1 relative overflow-hidden group"
        @click.stop="emit('click', event)">
        <Chip :label="event.title" class="w-full cursor-pointer hover:brightness-95 transition-all justify-between!"
            :pt="{
                root: { class: '!rounded-md shadow-sm border border-white/5' },
                label: { class: 'flex-1 truncate font-medium text-sm z-10' }
            }">
            <template #icon>
                <div class="flex items-center gap-1 shrink-0 ml-auto z-10">
                    <Avatar :image="event.host?.profilePicture ? `${baseURL}${event.host.profilePicture}` : undefined"
                        :icon="!event.host?.profilePicture ? 'pi pi-user' : undefined" shape="circle" size="small"
                        class="w-6! h-6! text-[10px]! bg-surface-0/50 dark:bg-surface-900/50 backdrop-blur-sm shadow-sm" />

                    <i v-if="event.isPrivate" class="pi pi-lock text-[10px] text-zinc-400 dark:text-zinc-500" title="Private Event"></i>

                    <Badge v-if="event.participants && event.participants.length > 0" :value="event.participants.length"
                        severity="contrast" class="min-w-4! h-4! text-[10px]! leading-3!" />
                </div>
            </template>
        </Chip>

        <!-- Magic card spotlight overlay -->
        <div class="magic-spotlight" :style="backgroundStyle"></div>
    </div>
</template>

<style scoped>
.magic-spotlight {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--x, 0px) var(--y, 0px), rgba(255, 255, 255, 0.1), transparent 80%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 5;
}

.event-card-wrapper:hover .magic-spotlight {
    opacity: 1;
}

.event-card-wrapper {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.event-card-wrapper:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
