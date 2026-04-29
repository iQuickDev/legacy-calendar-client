<script setup lang="ts">
import { computed } from 'vue';
import { format, isSameDay } from 'date-fns';
import Button from 'primevue/button';
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
const endDate = computed(() => (props.event.endTime ? new Date(props.event.endTime) : null));

const dateDisplay = computed(() => {
    if (!endDate.value) {
        return format(startDate.value, 'MMM d, yyyy • h:mm a');
    }
    if (isSameDay(startDate.value, endDate.value)) {
        return `${format(startDate.value, 'MMM d, yyyy • h:mm a')} - ${format(endDate.value, 'h:mm a')}`;
    }
    return `${format(startDate.value, 'MMM d, h:mm a')} - ${format(endDate.value, 'MMM d, h:mm a')}`;
});

const monthShort = computed(() => format(startDate.value, 'MMM'));
const dayNumber = computed(() => format(startDate.value, 'dd'));

const isPrivate = computed(() => props.event.isPrivate);

const { cardRef, backgroundStyle } = useMagicCard({
    gradientSize: 200,
    gradientColor: '#ffffff',
    gradientOpacity: 0.1
});

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
        class="upcoming-event-card relative flex flex-col justify-between overflow-hidden rounded-xl p-5 transition-all duration-300"
        @click="emit('view', event)"
    >
        <div class="z-10 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-3">
                <div class="flex flex-col gap-1">
                    <span class="text-surface-400 text-xs font-semibold tracking-wider uppercase">
                        {{ dateDisplay }}
                    </span>
                    <h3 class="text-surface-0 m-0 line-clamp-2 text-xl font-bold">
                        {{ event.title }}
                    </h3>
                </div>
                <div class="flex shrink-0 items-center gap-2">
                    <i v-if="isPrivate" class="pi pi-lock text-surface-400" title="Private Event"></i>
                </div>
            </div>

            <p class="text-surface-300 m-0 line-clamp-3 text-sm" v-if="event.description">
                {{ event.description }}
            </p>

            <div v-if="event.location" class="text-surface-400 mt-2 flex items-center gap-2 text-sm">
                <i class="pi pi-map-marker"></i>
                <span class="truncate">{{ event.location }}</span>
            </div>

            <div class="mt-1 flex flex-wrap items-center gap-2">
                <div
                    v-if="event.hasFood"
                    class="text-surface-400 flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-xs"
                    title="Food available"
                >
                    <i class="pi pi-shopping-cart text-[10px]"></i> Food
                </div>
                <div
                    v-if="event.hasAlcohol || event.hasBeer"
                    class="text-surface-400 flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-xs"
                    title="Drinks available"
                >
                    <i class="pi pi-shop text-[10px]"></i> Drinks
                </div>
            </div>
        </div>

        <div class="z-10 mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <UserAvatar
                        :profilePicture="event.host?.profilePicture"
                        :username="event.host?.username"
                        class="border-surface-800 h-8! w-8! border"
                    />
                    <div class="flex hidden flex-col sm:flex">
                        <span class="text-surface-400 text-xs">Hosted by</span>
                        <span class="text-surface-100 text-sm font-medium">{{ event.host?.username }}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <AvatarGroup v-if="activeParticipants.length > 0" class="-space-x-2">
                    <Avatar
                        v-for="p in displayParticipants"
                        :key="p.id"
                        :image="p.profilePicture"
                        :label="!p.profilePicture ? p.username?.charAt(0).toUpperCase() : undefined"
                        shape="circle"
                        class="text-surface-200 h-7! w-7! border border-[#262626] bg-[#0a0a0a] text-xs font-bold"
                        :title="p.username"
                    />
                    <Avatar
                        v-if="extraParticipantsCount > 0"
                        :label="`+${extraParticipantsCount}`"
                        shape="circle"
                        class="text-surface-300 h-7! w-7! border border-[#262626] bg-[#1a1a1a] text-[10px] font-bold"
                    />
                </AvatarGroup>
                <div v-else class="text-surface-400 flex items-center gap-1" title="Participants">
                    <i class="pi pi-users text-sm"></i>
                    <span class="text-sm font-semibold">0</span>
                </div>

                <Button
                    label="View"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    size="small"
                    outlined
                    class="p-button-rounded hidden text-xs! sm:flex"
                    @click.stop="emit('view', event)"
                />
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
