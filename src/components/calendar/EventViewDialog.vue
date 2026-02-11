<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import type { Event } from '../../types/Event';
import type { User } from '../../types/User';
import { useAPIStore } from '../../stores/api';
import { useSessionStore } from '../../stores/session';
import { useEventsStore } from '../../stores/events';
import { baseURL } from '../../services/API';
import FeatureSelectionDialog from './FeatureSelectionDialog.vue';
import type { EventFeature } from '../../types/Event';
import { FEATURES } from '../../constants/features';

const props = defineProps<{
    visible: boolean;
    event: Event | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'delete', id: number): void;
    (e: 'joined'): void;
}>();

const allUsers = ref<User[]>([]);

const fetchUsers = async () => {
    try {
        const { client } = useAPIStore();
        const response = await client.findAllUsers();
        allUsers.value = response.data;
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
};

// Host lookup
const eventHost = computed(() => {
    if (props.event?.host) return props.event.host;
    if (props.event?.hostId === undefined || props.event?.hostId === null || allUsers.value.length === 0) return null;
    return allUsers.value.find(u => u.id === props.event?.hostId) || null;
});

// Invitees with status lookup
const resolvedInvitees = computed(() => {
    if (!props.event?.participants || props.event.participants.length === 0) return [];

    return props.event.participants.map(p => {
        const user = allUsers.value.find(u => u.id === p.id);
        return {
            ...p,
            username: p.username || user?.username || `User ${p.id}`,
            profilePicture: p.profilePicture || user?.profilePicture
        };
    });
});

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return 'success';
        case 'DECLINED': return 'danger';
        case 'PENDING': return 'warn';
        default: return 'secondary';
    }
};

const sessionStore = useSessionStore();
const eventsStore = useEventsStore();

const currentUser = computed(() => sessionStore.currentUser);

const isHost = computed(() => {
    if (!currentUser.value || !props.event) return false;
    return props.event.host?.id === currentUser.value.id;
});

const userParticipantStatus = computed(() => {
    if (!currentUser.value || !props.event?.participants) return null;
    const p = props.event.participants.find(p => p.id === currentUser.value?.id);
    return p ? p.status : null;
});

const canAccept = computed(() => {
    if (!props.event || !currentUser.value) return false;

    // Show for host as "Already Accepted"
    if (isHost.value) return true;

    // Condition 1: User is already accepted (will show disabled button)
    if (userParticipantStatus.value === 'ACCEPTED') return true;

    // Condition 2: User is invited and status is PENDING
    if (userParticipantStatus.value === 'PENDING') return true;

    // Condition 3: Event is open and user is NOT a participant yet
    if (props.event.isOpen && userParticipantStatus.value === null) return true;

    return false;
});

const joining = ref(false);
const showFeatureSelection = ref(false);

const onAcceptClick = () => {
    // If user is already accepted/host, do nothing (button disabled anyway)
    // If user needs to join, show dialog first
    showFeatureSelection.value = true;
};

const handleFeatureConfirm = async (features: EventFeature[]) => {
    showFeatureSelection.value = false;
    if (!props.event || !currentUser.value) return;

    joining.value = true;
    try {
        const participateDto = {
            wantsFood: features.includes('FOOD'),
            wantsWeed: features.includes('WEED'),
            wantsSleep: features.includes('SLEEP'),
            wantsAlcohol: features.includes('ALCOHOL')
        };

        const success = await eventsStore.joinEvent(props.event.id, participateDto);
        if (success) {
            emit('joined');
        }
    } finally {
        joining.value = false;
    }
};

const getParticipantFeatures = (userId: number): EventFeature[] => {
    // Return real features from participant data
    const participant = resolvedInvitees.value.find(p => p.id === userId);
    if (!participant) return [];

    const features: EventFeature[] = [];
    if (participant.wantsFood) features.push('FOOD');
    if (participant.wantsWeed) features.push('WEED');
    if (participant.wantsAlcohol) features.push('ALCOHOL');
    if (participant.wantsSleep) features.push('SLEEP');

    return features;
};

const featuresListColumns = FEATURES.map(f => ({
    field: f.id,
    header: f.label,
    icon: f.icon
}));

const eventFeatures = computed(() => {
    if (!props.event) return [];

    // Filter features that are enabled for this event
    return FEATURES.filter(feature => {
        if (feature.id === 'FOOD' && props.event!.hasFood) return true;
        if (feature.id === 'WEED' && props.event!.hasWeed) return true;
        if (feature.id === 'ALCOHOL' && props.event!.hasAlcohol) return true;
        if (feature.id === 'SLEEP' && props.event!.hasSleep) return true;
        return false;
    });
});

const availableFeatureIds = computed(() => {
    if (!props.event) return [];
    const features: EventFeature[] = [];
    if (props.event.hasFood) features.push('FOOD');
    if (props.event.hasWeed) features.push('WEED');
    if (props.event.hasAlcohol) features.push('ALCOHOL');
    if (props.event.hasSleep) features.push('SLEEP');
    return features;
});

const hasFeature = (userId: number, feature: EventFeature) => {
    const features = getParticipantFeatures(userId);
    return features.includes(feature);
};

const getFeatureCount = (feature: EventFeature) => {
    if (!resolvedInvitees.value) return 0;
    return resolvedInvitees.value.filter(p => {
        // Only count accepted participants who want the feature
        if (p.status !== 'ACCEPTED') return false;

        switch (feature) {
            case 'FOOD': return p.wantsFood;
            case 'WEED': return p.wantsWeed;
            case 'ALCOHOL': return p.wantsAlcohol;
            case 'SLEEP': return p.wantsSleep;
            default: return false;
        }
    }).length;
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return 'pi pi-check';
        case 'DECLINED': return 'pi pi-times';
        case 'PENDING': return 'pi pi-clock';
        default: return 'pi pi-info-circle';
    }
};

// Formatted dates for display

const formattedStartDate = computed(() => {
    if (!props.event?.startTime) return '';
    return format(parseISO(props.event.startTime), 'EEEE, MMMM d, yyyy');
});

const formattedStartTime = computed(() => {
    if (!props.event?.startTime) return '';
    return format(parseISO(props.event.startTime), 'h:mm a');
});

const formattedEndDate = computed(() => {
    if (!props.event?.endTime) return '';
    return format(parseISO(props.event.endTime), 'EEEE, MMMM d, yyyy');
});

const formattedEndTime = computed(() => {
    if (!props.event?.endTime) return '';
    return format(parseISO(props.event.endTime), 'h:mm a');
});

// Reset state when dialog opens
watch(() => props.visible, (newVal) => {
    if (newVal) {
        fetchUsers();
    }
});

const onDelete = () => {
    if (!props.event) return;
    emit('delete', props.event.id);
};

</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Event Details"
        :style="{ width: '900px' }" :breakpoints="{ '960px': '85vw', '640px': '95vw' }" class="p-fluid" dismissableMask
        :draggable="false">

        <!-- View Mode -->
        <div v-if="event" class="flex flex-col gap-4">
            <!-- Title and Host Header -->
            <div class="flex flex-col gap-3">
                <div class="flex items-start justify-between gap-3">
                    <h2 class="text-2xl font-bold m-0">{{ event.title }}</h2>
                    <Tag v-if="event.endTime" severity="secondary" value="Scheduled" />
                </div>

                <!-- Host (Moved to Top) -->
                <div v-if="eventHost" class="flex items-center gap-2">
                    <Avatar :image="eventHost.profilePicture ? `${baseURL}${eventHost.profilePicture}` : undefined"
                        :label="!eventHost.profilePicture ? eventHost.username.charAt(0) : undefined" shape="circle"
                        size="small" />
                    <span class="text-surface-600 dark:text-surface-400">Hosted by <span
                            class="text-surface-900 dark:text-surface-0 font-semibold">{{ eventHost.username
                            }}</span></span>
                </div>
            </div>

            <Divider class="!my-2" />

            <!-- Description -->
            <div v-if="event.description" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-align-left"></i>
                    <span class="font-semibold">Description</span>
                </div>
                <p class="m-0 pl-6 text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{{ event.description }}
                </p>
            </div>

            <!-- Location -->
            <div v-if="event.location" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-map-marker"></i>
                    <span class="font-semibold">Location</span>
                </div>
                <p class="m-0 pl-6 text-surface-700 dark:text-surface-300">{{ event.location }}</p>
            </div>

            <!-- Time Grid -->
            <div class="grid grid-cols-2 gap-4">
                <!-- Start Date/Time -->
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                        <i class="pi pi-calendar"></i>
                        <span class="font-semibold">Start</span>
                    </div>
                    <div class="pl-6">
                        <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedStartDate }}</p>
                        <p class="m-0 text-surface-600 dark:text-surface-400 text-sm">{{ formattedStartTime }}</p>
                    </div>
                </div>

                <!-- End Date/Time -->
                <div v-if="event.endTime" class="flex flex-col gap-2">
                    <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                        <i class="pi pi-calendar-times"></i>
                        <span class="font-semibold">End</span>
                    </div>
                    <div class="pl-6">
                        <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedEndDate }}</p>
                        <p class="m-0 text-surface-600 dark:text-surface-400 text-sm">{{ formattedEndTime }}</p>
                    </div>
                </div>
            </div>


            <Divider v-if="eventFeatures.length > 0" class="!my-2" />

            <!-- Event Features -->
            <div v-if="eventFeatures.length > 0" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-star"></i>
                    <span class="font-semibold">Available Features</span>
                </div>
                <div class="flex flex-wrap gap-2 md:pl-6 pl-0">
                    <div v-for="feature in eventFeatures" :key="feature.label"
                        class="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                        :class="feature.color">
                        <span>{{ feature.icon }}</span>
                        <span>{{ feature.label }}</span>
                    </div>
                </div>
            </div>

            <Divider class="!my-2" />

            <!-- Invitees Table -->
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-users"></i>
                    <span class="font-semibold">Invitees</span>
                </div>

                <DataTable :value="resolvedInvitees" scrollable>
                    <template #empty>
                        <div class="p-4 text-center text-surface-500">No invitees found</div>
                    </template>
                    <Column field="username" header="Name">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <Avatar
                                    :image="slotProps.data.profilePicture ? `${baseURL}${slotProps.data.profilePicture}` : undefined"
                                    :label="!slotProps.data.profilePicture ? slotProps.data.username.charAt(0) : undefined"
                                    shape="circle" size="small" class="!w-6 !h-6" />
                                <span>{{ slotProps.data.username }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column v-for="col in featuresListColumns" :key="col.field"
                        class="text-center min-w-[4rem] sm:min-w-[7rem]">
                        <template #header>
                            <span class="font-bold hidden sm:inline whitespace-nowrap">{{ col.header }} ({{
                                getFeatureCount(col.field) }})</span>
                            <span class="font-bold sm:hidden whitespace-nowrap" :title="col.header">{{ col.icon }} ({{
                                getFeatureCount(col.field) }})</span>
                        </template>
                        <template #body="slotProps">
                            <div v-if="slotProps.data.status === 'ACCEPTED'" class="flex justify-center">
                                <i v-if="hasFeature(slotProps.data.id, col.field)"
                                    class="pi pi-check text-green-500 font-bold"></i>
                                <i v-else class="pi pi-times text-red-500 font-bold"></i>
                            </div>
                            <div v-else class="text-center text-surface-400">-</div>
                        </template>
                    </Column>
                    <Column field="status" header="Status" class="w-16 sm:w-24 text-center">
                        <template #body="slotProps">
                            <span class="hidden sm:inline">
                                <Tag :severity="getStatusSeverity(slotProps.data.status)" size="small"
                                    :value="slotProps.data.status" />
                            </span>
                            <div class="sm:hidden flex justify-center">
                                <Tag :severity="getStatusSeverity(slotProps.data.status)"
                                    class="!w-8 !h-8 !p-0 flex items-center justify-center" size="small">
                                    <i :class="getStatusIcon(slotProps.data.status)" class="text-xs"></i>
                                </Tag>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end w-full gap-2 pt-2">
                <!-- Left side: Delete button -->
                <div v-if="isHost" class="mr-auto">
                    <Button label="Delete" icon="pi pi-trash" severity="danger" text @click="onDelete" />
                </div>

                <Button v-if="canAccept" :label="(userParticipantStatus === 'ACCEPTED') ? 'Joined' : 'Join'"
                    icon="pi pi-check" severity="success" :loading="joining"
                    :disabled="userParticipantStatus === 'ACCEPTED'" @click="onAcceptClick" />
            </div>
        </template>
    </Dialog>

    <FeatureSelectionDialog v-model:visible="showFeatureSelection" :availableFeatures="availableFeatureIds"
        @confirm="handleFeatureConfirm" />
</template>

<style scoped>
:deep(.p-datatable) {
    font-size: 0.95rem;
}

@media screen and (max-width: 640px) {
    :deep(.p-datatable) {
        font-size: 0.8rem;
    }

    :deep(.p-datatable .p-datatable-thead > tr > th) {
        padding: 0.5rem 0.25rem;
    }

    :deep(.p-datatable .p-datatable-tbody > tr > td) {
        padding: 0.5rem 0.25rem;
    }
}
</style>
