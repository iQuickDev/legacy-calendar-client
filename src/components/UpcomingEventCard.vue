<script setup lang="ts">
import { computed } from 'vue';
import { differenceInMinutes, differenceInDays } from 'date-fns';
import Avatar from 'primevue/avatar';
import AvatarGroup from 'primevue/avatargroup';
import Button from 'primevue/button';
import type { Event } from '../types/Event';

const props = defineProps<{
    event: Event;
}>();

const emit = defineEmits<{
    (e: 'view', event: Event): void;
}>();

const startDate = computed(() => new Date(props.event.startTime));

const timeUntilStart = computed(() => {
    const now = new Date();
    const start = startDate.value;
    if (start < now) return 'Started';

    const diffMins = differenceInMinutes(start, now);
    if (diffMins < 60) return `Starts in ${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours < 24) {
        if (remainingMins === 0) return `Starts in ${diffHours}h`;
        return `Starts in ${diffHours}h ${remainingMins}m`;
    }
    
    const diffDays = differenceInDays(start, now);
    return `Starts in ${diffDays}d`;
});

const pillTime = computed(() => {
    const now = new Date();
    const start = startDate.value;
    if (start < now) return 'Now';

    const diffMins = differenceInMinutes(start, now);
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = differenceInDays(start, now);
    return `${diffDays}d`;
});

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

const openNavigation = () => {
    if (!props.event.location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.event.location)}`;
    window.open(url, '_blank');
};
</script>

<template>
    <div
        class="upcoming-event-card group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-5 sm:p-6"
        @click="emit('view', event)"
    >
        <!-- Top row: Pill -->
        <div class="flex items-center">
            <div class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-surface-300 uppercase">
                <span>UPCOMING</span>
                <span class="text-surface-500">•</span>
                <span>{{ pillTime }}</span>
            </div>
            <i v-if="props.event.isPrivate" class="pi pi-lock text-surface-500 ml-auto" title="Private Event"></i>
        </div>

        <!-- Title & Time -->
        <div class="flex flex-col gap-1">
            <h3 class="text-surface-0 m-0 break-words text-2xl sm:text-3xl font-black tracking-tight line-clamp-2">
                {{ event.title }}
            </h3>
            <div class="text-surface-300 flex items-center gap-2 text-sm sm:text-base font-medium mt-1">
                <i class="pi pi-clock text-surface-400"></i>
                <span>{{ timeUntilStart }}</span>
            </div>
        </div>

        <!-- Description / Link -->
        <p v-if="event.description" class="text-surface-400 m-0 line-clamp-2 text-sm sm:text-base break-words">
            {{ event.description }}
        </p>

        <!-- Features -->
        <div v-if="event.hasFood || event.hasAlcohol || event.hasBeer" class="flex flex-wrap items-center gap-2 mt-1">
            <div
                v-if="event.hasFood"
                class="text-surface-400 flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs font-medium"
            >
                <i class="pi pi-shopping-cart text-[10px]"></i> Food
            </div>
            <div
                v-if="event.hasAlcohol || event.hasBeer"
                class="text-surface-400 flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs font-medium"
            >
                <i class="pi pi-shop text-[10px]"></i> Drinks
            </div>
        </div>

        <!-- Location & Participants -->
        <div class="mt-2 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div v-if="event.location" class="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-sm max-w-full">
                <i class="pi pi-map-marker text-surface-400 shrink-0"></i>
                <span class="truncate text-surface-100 font-semibold">{{ event.location }}</span>
            </div>
            
            <div class="flex items-center gap-3 shrink-0">
                <AvatarGroup v-if="activeParticipants.length > 0" class="-space-x-2">
                    <Avatar
                        v-for="p in displayParticipants"
                        :key="p.id"
                        :image="p.profilePicture"
                        :label="!p.profilePicture ? p.username?.charAt(0).toUpperCase() : undefined"
                        shape="circle"
                        class="text-surface-200 h-8! w-8! border-2 border-[#141414] group-hover:border-[#1a1a1a] transition-colors bg-[#2a2a2a] text-xs font-bold"
                        :title="p.username"
                    />
                    <Avatar
                        v-if="extraParticipantsCount > 0"
                        :label="`+${extraParticipantsCount}`"
                        shape="circle"
                        class="text-surface-300 h-8! w-8! border-2 border-[#141414] group-hover:border-[#1a1a1a] transition-colors bg-[#333] text-[10px] font-bold"
                    />
                </AvatarGroup>
                <span v-if="activeParticipants.length > 0" class="text-surface-400 text-xs sm:text-sm font-medium">
                    {{ activeParticipants.length }} attending
                </span>
            </div>
        </div>

        <!-- Actions -->
        <div class="mt-2 flex flex-col gap-2">
            <Button
                v-if="event.location"
                class="w-full flex justify-center items-center gap-2 py-3.5 text-white rounded-xl font-bold transition-colors text-sm sm:text-base cursor-pointer"
                @click.stop="openNavigation"
            >
                <i class="pi pi-map"></i>
                <span>Start Navigation</span>
        </Button>

            <button
                class="w-full text-center text-sm font-medium text-surface-400 hover:text-surface-200 py-2 transition-colors mt-1 cursor-pointer bg-transparent border-none"
                @click.stop="emit('view', event)"
            >
                Event Details
            </button>
        </div>
    </div>
</template>

<style scoped>
.upcoming-event-card {
    background: #141414;
    border: 1px solid #262626;
    cursor: pointer;
    transition: all 0.25s ease;
}

.upcoming-event-card:hover {
    background: #1a1a1a;
    border-color: #3f3f3f;
    transform: translateY(-2px);
    box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.5);
}
</style>
