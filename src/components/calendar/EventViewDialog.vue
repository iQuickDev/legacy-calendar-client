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
import type { CalendarEvent } from '../../types/Calendar';
import type { User } from '../../services/API';
import { useAPIStore } from '../../stores/api';
import { useSessionStore } from '../../stores/session';
import { useEventsStore } from '../../stores/events';

const props = defineProps<{
    visible: boolean;
    event: CalendarEvent | null;
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
            image: p.image || user?.image
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
    return props.event.host?.id === currentUser.value.userId;
});

const userParticipantStatus = computed(() => {
    if (!currentUser.value || !props.event?.participants) return null;
    const p = props.event.participants.find(p => p.id === currentUser.value?.userId);
    return p ? p.status : null;
});

const canAccept = computed(() => {
    if (!props.event || !currentUser.value || isHost.value) return false;

    // Condition 1: User is already accepted (will show disabled button)
    if (userParticipantStatus.value === 'ACCEPTED') return true;

    // Condition 2: User is invited and status is PENDING
    if (userParticipantStatus.value === 'PENDING') return true;

    // Condition 3: Event is open and user is NOT a participant yet
    if (props.event.isOpen && userParticipantStatus.value === null) return true;

    return false;
});

const joining = ref(false);

const onAccept = async () => {
    if (!props.event) return;
    joining.value = true;
    try {
        const success = await eventsStore.joinEvent(props.event.id);
        if (success) {
            emit('joined');
            // Refresh local status if possible, or the parent will refresh events
        }
    } finally {
        joining.value = false;
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
        :style="{ width: '550px' }" :breakpoints="{ '640px': '95vw' }" class="p-fluid" dismissableMask
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
                    <Avatar :image="eventHost.image" shape="circle" size="small" v-if="eventHost.image" />
                    <Avatar :label="eventHost.username.charAt(0)" shape="circle" size="small" v-else />
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

            <Divider class="!my-2" />

            <!-- Invitees Table -->
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-users"></i>
                    <span class="font-semibold">Invitees</span>
                </div>

                <DataTable :value="resolvedInvitees"
                    class="p-datatable-sm border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden"
                    :rows="5" :paginator="resolvedInvitees.length > 5">
                    <template #empty>
                        <div class="p-4 text-center text-surface-500">No invitees found</div>
                    </template>
                    <Column field="username" header="Name">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <Avatar :image="slotProps.data.image" shape="circle" size="small"
                                    v-if="slotProps.data.image" class="!w-6 !h-6" />
                                <Avatar :label="slotProps.data.username.charAt(0)" shape="circle" size="small" v-else
                                    class="!w-6 !h-6" />
                                <span>{{ slotProps.data.username }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="status" header="Status" class="w-24">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)"
                                size="small" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end w-full gap-2">
                <!-- Left side: Delete button -->
                <div v-if="isHost" class="mr-auto">
                    <Button label="Delete" icon="pi pi-trash" severity="danger" text @click="onDelete" />
                </div>

                <Button v-if="canAccept" :label="userParticipantStatus === 'ACCEPTED' ? 'Accepted' : 'Accept'"
                    icon="pi pi-check" severity="success" :loading="joining"
                    :disabled="userParticipantStatus === 'ACCEPTED'" @click="onAccept" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped></style>
