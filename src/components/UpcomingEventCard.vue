<script setup lang="ts">
import { computed } from 'vue';
import { format, isSameDay } from 'date-fns';
import Avatar from 'primevue/avatar';
import AvatarGroup from 'primevue/avatargroup';
import UserAvatar from './UserAvatar.vue';
import type { Event } from '../types/Event';
import { useMagicCard } from '../composables/useMagicCard';

const props = defineProps<{
    event: Event;
}>();

const emit = defineEmits<{
    (e: 'view', event: Event): void;
}>();

const startDate = computed(() => new Date(props.event.startTime));

const isPrivate = computed(() => props.event.isPrivate);

const { cardRef, backgroundStyle } = useMagicCard({
    gradientSize: 200,
    gradientColor: '#ffffff',
    gradientOpacity: 0.1
});

defineExpose({ cardRef });

// Get accepted/pending participants
const activeParticipants = computed(() => {
    return (props.event.participants || []).filter((p) => p.status !== 'DECLINED');
});

const displayParticipants = computed(() => {
    return activeParticipants.value.slice(0, 3);
});

const extraParticipantsCount = computed(() => {
    const extra = activeParticipants.value.length - 3;
    return extra > 0 ? extra : 0;
});
</script>

<template>
    <div
        ref="cardRef"
        class="upcoming-event-card relative flex flex-col justify-between overflow-hidden rounded-xl p-4 transition-all duration-300"
        @click="emit('view', event)"
    >
        <div class="z-10 flex flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
                <div class="flex flex-col gap-0.5">
                    <span class="text-primary-500 text-[10px] font-bold tracking-wider uppercase">
                        {{ isSameDay(startDate, new Date()) ? 'Today' : format(startDate, 'EEE, MMM d') }} •
                        {{ format(startDate, 'h:mm a') }}
                    </span>
                    <h3 class="text-surface-0 m-0 line-clamp-1 text-base font-bold">
                        {{ event.title }}
                    </h3>
                </div>
                <i v-if="isPrivate" class="pi pi-lock text-surface-500 mt-1 text-xs" title="Private Event"></i>
            </div>

            <p class="text-surface-400 m-0 line-clamp-2 text-xs leading-relaxed" v-if="event.description">
                {{ event.description }}
            </p>

            <div v-if="event.location" class="text-surface-500 flex items-center gap-1.5 text-[11px]">
                <i class="pi pi-map-marker text-[10px]"></i>
                <span class="truncate">{{ event.location }}</span>
            </div>
        </div>

        <div class="z-10 mt-4 flex items-center justify-between border-t border-white/5 pt-3">
            <div class="flex items-center gap-2">
                <UserAvatar
                    :profilePicture="event.host?.profilePicture"
                    :username="event.host?.username"
                    class="h-6! w-6! border border-zinc-800"
                />
                <span class="text-surface-400 hidden text-[10px] font-medium sm:inline">{{
                    event.host?.username
                }}</span>
            </div>

            <div class="flex items-center gap-2">
                <AvatarGroup v-if="activeParticipants.length > 0" class="-space-x-1.5">
                    <Avatar
                        v-for="p in displayParticipants"
                        :key="p.id"
                        :image="p.profilePicture"
                        :label="!p.profilePicture ? p.username?.charAt(0).toUpperCase() : undefined"
                        shape="circle"
                        class="text-surface-200 h-6! w-6! border border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold"
                    />
                    <Avatar
                        v-if="extraParticipantsCount > 0"
                        :label="`+${extraParticipantsCount}`"
                        shape="circle"
                        class="text-surface-400 h-6! w-6! border border-[#1a1a1a] bg-[#1a1a1a] text-[8px] font-bold"
                    />
                </AvatarGroup>

                <i class="pi pi-chevron-right text-[10px] text-zinc-600"></i>
            </div>
        </div>
        <div class="magic-spotlight" :style="backgroundStyle"></div>
    </div>
</template>

<style scoped>
.upcoming-event-card {
    background: #0a0a0a;
    border: 1px solid #262626;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    cursor: pointer;
}

.upcoming-event-card:hover {
    background: #0f0f0f;
    border-color: #404040;
    transform: translateY(-2px);
}

.magic-spotlight {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--x, 0px) var(--y, 0px), rgba(255, 255, 255, 0.08), transparent 80%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 5;
}

.upcoming-event-card:hover .magic-spotlight {
    opacity: 1;
}
</style>
