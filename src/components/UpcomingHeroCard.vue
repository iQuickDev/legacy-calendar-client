<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { differenceInMinutes, isAfter, isBefore, addMinutes, formatDistanceToNow } from 'date-fns';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import AvatarGroup from 'primevue/avatargroup';
import type { Event } from '../types/Event';
import { useMagicCard } from '../composables/useMagicCard';
import UserAvatar from './UserAvatar.vue';

const AVATAR_GROUP_SHOWN_LIMIT = 4;

const props = defineProps<{
    event: Event;
}>();

const emit = defineEmits<{
    (e: 'view', event: Event): void;
}>();

const now = ref(new Date());
let timer: any = null;

onMounted(() => {
    timer = setInterval(() => {
        now.value = new Date();
    }, 1000);
});

onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
});

const startDate = computed(() => new Date(props.event.startTime));
const endDate = computed(() => (props.event.endTime ? new Date(props.event.endTime) : addMinutes(startDate.value, 60)));

const isSoon = computed(() => {
    const diff = differenceInMinutes(startDate.value, now.value);
    return diff > 0 && diff <= 60;
});

const isStartingNow = computed(() => {
    const diff = differenceInMinutes(startDate.value, now.value);
    return diff >= 0 && diff <= 5;
});

const isMissed = computed(() => {
    return isAfter(now.value, endDate.value);
});

const isStartedAlready = computed(() => {
    return isBefore(startDate.value, now.value) && isBefore(now.value, endDate.value);
});

const state = computed(() => {
    if (isMissed.value) return 'missed';
    if (isStartingNow.value) return 'starting';
    if (isStartedAlready.value) return 'ongoing';
    if (isSoon.value) return 'soon';
    return 'upcoming';
});

const stateLabel = computed(() => {
    switch (state.value) {
        case 'missed':
            return 'Missed';
        case 'starting':
            return 'Starting Now';
        case 'ongoing':
            return 'Happening Now';
        case 'soon':
            return 'Soon • قريب';
        default:
            return 'Upcoming';
    }
});

const stateColor = computed(() => {
    switch (state.value) {
        case 'missed':
            return 'text-red-400 border-red-500/20 bg-red-500/5';
        case 'starting':
            return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.15)]';
        case 'ongoing':
            return 'text-blue-400 border-blue-500/20 bg-blue-500/5';
        case 'soon':
            return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
        default:
            return 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5';
    }
});

const countdownText = computed(() => {
    if (isMissed.value) return `Ended ${formatDistanceToNow(endDate.value)} ago`;
    if (isStartedAlready.value) return `Started ${formatDistanceToNow(startDate.value)} ago`;

    const diffMin = differenceInMinutes(startDate.value, now.value);
    if (diffMin < 1) return 'Starting any second...';
    if (diffMin < 60) return `Starts in ${diffMin}m`;

    const diffHours = Math.floor(diffMin / 60);
    const remainingMin = diffMin % 60;
    if (diffHours < 24) return `Starts in ${diffHours}h ${remainingMin}m`;

    return formatDistanceToNow(startDate.value, { addSuffix: true });
});

// Smart Action Logic
const isLocationUrl = computed(() => {
    try {
        if (!props.event.location) return false;
        new URL(props.event.location);
        return true;
    } catch {
        return props.event.location?.startsWith('http');
    }
});

const primaryAction = computed(() => {
    if (isLocationUrl.value) {
        return { label: 'Join Meeting', icon: 'pi pi-video', color: 'primary' };
    }
    if (props.event.location && props.event.location.length > 5) {
        return { label: 'Start Navigation', icon: 'pi pi-map', color: 'secondary' };
    }
    return { label: 'Prepare & View', icon: 'pi pi-arrow-right', color: 'primary' };
});

const handleAction = () => {
    if (isLocationUrl.value) {
        window.open(props.event.location, '_blank');
    } else if (props.event.location) {
        window.open(
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.event.location)}`,
            '_blank'
        );
    } else {
        emit('view', props.event);
    }
};

const recommendation = computed(() => {
    if (isMissed.value) return 'This event has already concluded.';
    if (isStartedAlready.value) return 'Event in progress. Join now to catch up.';
    if (isStartingNow.value) return 'Starting now. Get ready!';
    if (isSoon.value) {
        if (isLocationUrl.value) return 'Time to join the call.';
        if (props.event.location) return 'Consider leaving soon to arrive on time.';
        return 'Prepare for your upcoming event.';
    }
    return null;
});

const { backgroundStyle } = useMagicCard({
    gradientSize: 400,
    gradientColor: computed(() => {
        switch (state.value) {
            case 'starting':
                return '#10b981';
            case 'soon':
                return '#f59e0b';
            case 'ongoing':
                return '#3b82f6';
            default:
                return '#ffffff';
        }
    }),
    gradientOpacity: 0.08
});

const activeParticipants = computed(() => {
    return (props.event.participants || []).filter((p) => p.status !== 'DECLINED');
});

const duration = computed(() => {
    const diff = differenceInMinutes(endDate.value, startDate.value);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
});
</script>

<template>
    <div
        ref="cardRef"
        class="hero-card relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all duration-500 hover:border-zinc-700 md:p-8"
        :class="{ 'soon-pulse': isSoon || isStartingNow }"
    >
        <div class="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div class="flex flex-1 flex-col gap-4">
                <!-- State Badge -->
                <div class="flex items-center gap-2">
                    <div
                        class="flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold tracking-widest uppercase transition-colors duration-500"
                        :class="stateColor"
                    >
                        <span v-if="isStartingNow || isStartedAlready" class="relative flex h-2 w-2">
                            <span
                                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"
                            ></span>
                            <span class="relative inline-flex h-2 w-2 rounded-full bg-current"></span>
                        </span>
                        {{ stateLabel }}
                    </div>
                    <span class="text-xs font-medium text-zinc-500">• {{ duration }}</span>
                </div>

                <!-- Title & Countdown -->
                <div class="flex flex-col gap-1">
                    <h2 class="text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
                        {{ event.title }}
                    </h2>
                    <div class="flex items-center gap-2 text-xl font-bold text-zinc-400 md:text-2xl">
                        <i class="pi pi-clock text-zinc-600"></i>
                        <span class="countdown-ticking">{{ countdownText }}</span>
                    </div>
                </div>

                <!-- Recommendation -->
                <p v-if="recommendation" class="text-primary-400/80 text-sm font-medium italic">
                    <i class="pi pi-sparkles mr-1 text-xs"></i>
                    {{ recommendation }}
                </p>

                <!-- Description Snippet -->
                <p v-if="event.description" class="line-clamp-2 max-w-2xl text-sm text-zinc-400 md:text-base">
                    {{ event.description }}
                </p>

                <!-- Metadata Row -->
                <div class="mt-2 flex flex-wrap items-center gap-6">
                    <!-- Location -->
                    <div v-if="event.location" class="flex items-center gap-2 text-sm text-zinc-300">
                        <div
                            class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900"
                        >
                            <i :class="isLocationUrl ? 'pi pi-external-link' : 'pi pi-map-marker'"></i>
                        </div>
                        <span class="max-w-[200px] truncate font-medium">{{ event.location }}</span>
                    </div>

                    <!-- Participants -->
                    <div v-if="activeParticipants.length > 0" class="flex items-center gap-3">
                        <AvatarGroup>
                            <UserAvatar
                                v-for="p in activeParticipants.slice(0, AVATAR_GROUP_SHOWN_LIMIT)"
                                :key="p.id"
                                :profile-picture="p.profilePicture"
                                :username="p.username"
                            />
                            <Avatar
                                v-if="activeParticipants.length > AVATAR_GROUP_SHOWN_LIMIT"
                                :label="`+${activeParticipants.length - AVATAR_GROUP_SHOWN_LIMIT}`"
                                shape="circle"
                            />
                        </AvatarGroup>
                        <span class="text-xs font-medium text-zinc-500">
                            {{ activeParticipants.length }} attending
                        </span>
                    </div>
                </div>
            </div>

            <!-- Primary Action Button -->
            <div class="mt-4 flex shrink-0 flex-col gap-3 md:mt-0 md:min-w-[200px]">
                <Button
                    :label="primaryAction.label"
                    :icon="primaryAction.icon"
                    class="hero-button w-full rounded-xl! py-4! text-lg! font-bold! text-black! transition-all duration-300 hover:scale-[1.02] hover:text-white! active:scale-[0.98]"
                    :severity="primaryAction.color === 'primary' ? 'primary' : 'secondary'"
                    @click="handleAction"
                />
                <Button
                    label="Event Details"
                    text
                    class="text-sm! text-zinc-500! hover:text-white!"
                    @click="emit('view', event)"
                />
            </div>
        </div>

        <!-- Background Effects -->
        <div class="magic-spotlight" :style="backgroundStyle"></div>
        <div
            class="bg-primary-500/5 pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full blur-[100px]"
        ></div>
    </div>
</template>

<style scoped>
.hero-card {
    background: linear-gradient(135deg, rgba(10, 10, 10, 1) 0%, rgba(18, 18, 18, 1) 100%);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.hero-card::after {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    border-radius: inherit;
    z-index: 0;
    pointer-events: none;
}

.countdown-ticking {
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
}

.hero-button {
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.4);
    background: var(--p-primary-500);
    border: none;
}

.hero-button:hover {
    filter: brightness(1.1);
    box-shadow: 0 15px 30px -10px var(--p-primary-500/30);
}

.magic-spotlight {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 5;
    opacity: 0.8;
}

@keyframes pulse-subtle {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.95;
        transform: scale(1.005);
    }
}

.soon-pulse {
    animation: pulse-subtle 4s infinite ease-in-out;
}

/* Mobile specific stacking is mostly handled by Tailwind, 
   but we ensure full width and comfortable padding */
@media (max-width: 768px) {
    .hero-card {
        border-radius: 0;
        border-left: none;
        border-right: none;
        margin-left: -1rem;
        margin-right: -1rem;
        width: calc(100% + 2rem);
    }
}
</style>
