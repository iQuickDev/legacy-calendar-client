<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import type { Event, EventFeature, EventParticipant } from '../../types/Event';
import type { User } from '../../types/User';
import { useAPIStore } from '../../stores/api';
import { useSessionStore } from '../../stores/session';
import { useEventsStore } from '../../stores/events';
import FeatureSelectionDialog from './FeatureSelectionDialog.vue';
import EventViewMode from './event-view/EventViewMode.vue';
import EventEditForm from './event-view/EventEditForm.vue';
import { FEATURES } from '../../constants/features';
import {
    canUserRespondToEvent,
    createFeatureRecord,
    featureCount,
    featurePricesFromEvent,
    featureSplitPrice,
    getParticipantStatusIcon,
    getParticipantStatusSeverity,
    participantFeatures,
    participantWantsFromSelection,
    selectedFeaturesFromEvent,
    totalEventBudget
} from '../../utils/event';
import type { CreateEventDto, ParticipateDto } from '../../types/Event';

const props = defineProps<{
    visible: boolean;
    event: Event | null;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'delete', id: number): void;
    (e: 'joined'): void;
    (e: 'refresh'): void;
}>();

const apiStore = useAPIStore();
const sessionStore = useSessionStore();
const eventsStore = useEventsStore();
const toast = useToast();
const confirm = useConfirm();

const allUsers = ref<User[]>([]);

const fetchUsers = async () => {
    try {
        const response = await apiStore.client.findAllUsers();
        allUsers.value = response.data;
    } catch (error) {
        console.error('Failed to fetch users:', error);
    }
};

const eventHost = computed(() => {
    const event = props.event;
    if (!event) return null;
    if (event.host) return event.host;
    if (event.hostId === undefined || event.hostId === null || allUsers.value.length === 0) return null;
    return allUsers.value.find((user) => user.id === event.hostId) || null;
});

const resolvedInvitees = computed(() => {
    if (!props.event?.participants?.length) return [];

    return props.event.participants.map((participant) => {
        const user = allUsers.value.find((u) => u.id === participant.id);
        return {
            ...participant,
            username: participant.username || user?.username || `User ${participant.id}`,
            profilePicture: participant.profilePicture || user?.profilePicture
        };
    });
});

const currentUser = computed(() => sessionStore.currentUser);

const isHost = computed(() => {
    if (!currentUser.value || !props.event) return false;
    return props.event.host?.id === currentUser.value.id;
});

const userParticipantStatus = computed(() => {
    if (!currentUser.value || !props.event?.participants) return null;
    return props.event.participants.find((participant) => participant.id === currentUser.value?.id)?.status ?? null;
});

const isDeadlinePassed = computed(() => {
    if (!props.event?.participationDeadline) return false;
    return new Date() > new Date(props.event.participationDeadline);
});

const canAccept = computed(() => {
    if (!props.event || !currentUser.value) return false;
    if (isDeadlinePassed.value && !isHost.value) return false;
    return canUserRespondToEvent({
        isHost: isHost.value,
        userParticipantStatus: userParticipantStatus.value,
        isOpen: props.event.isOpen
    });
});

const joining = ref(false);
const cancelling = ref(false);
const showFeatureSelection = ref(false);
const assigningRide = ref(false);
const dragOverDriverId = ref<number | null>(null);
const isEditing = ref(false);

const onAcceptClick = () => {
    showFeatureSelection.value = true;
};

const onEditParticipation = () => {
    if (!currentUser.value) return;
    if (isDeadlinePassed.value && !isHost.value) return;
    showFeatureSelection.value = true;
};

const onCancelParticipation = () => {
    confirm.require({
        message:
            'Are you sure you want to leave this event? If the event is private/invite only, you might not be able to join again.',
        header: 'Confirm Leave',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'No',
            severity: 'secondary',
            text: true
        },
        acceptProps: {
            label: 'Yes, Leave',
            severity: 'danger'
        },
        accept: async () => {
            if (!props.event || !currentUser.value) return;

            cancelling.value = true;
            try {
                const success = await eventsStore.leaveEvent(props.event.id);
                if (success) emit('joined');
                else throw new Error();
            } catch {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: eventsStore.error || 'Failed to leave event',
                    life: 5000
                });
            } finally {
                cancelling.value = false;
            }
        }
    });
};

const onDecline = () => {
    confirm.require({
        message: 'Are you sure you want to decline this invitation?',
        header: 'Confirm Decline',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'No',
            severity: 'secondary',
            text: true
        },
        acceptProps: {
            label: 'Yes, Decline',
            severity: 'danger'
        },
        accept: async () => {
            if (!props.event || !currentUser.value) return;

            cancelling.value = true;
            try {
                const success = await eventsStore.leaveEvent(props.event.id);
                if (success) emit('joined');
                else throw new Error();
            } catch {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: eventsStore.error || 'Failed to decline invitation',
                    life: 5000
                });
            } finally {
                cancelling.value = false;
            }
        }
    });
};

const handleFeatureConfirm = async (data: {
    features: EventFeature[];
    vehicle: { hasVehicle: boolean; vehicleSeats?: number };
}) => {
    showFeatureSelection.value = false;
    if (!props.event || !currentUser.value) return;

    joining.value = true;
    try {
        const participateDto: ParticipateDto = {
            ...participantWantsFromSelection(data.features),
            hasVehicle: data.vehicle.hasVehicle,
            vehicleSeats: data.vehicle.vehicleSeats
        };

        const success = await eventsStore.joinEvent(props.event.id, participateDto);
        if (success) emit('joined');
        else throw new Error();
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: eventsStore.error || 'Failed to join event',
            life: 5000
        });
    } finally {
        joining.value = false;
    }
};

const getParticipantFeatures = (userId: number): EventFeature[] => {
    return participantFeatures(resolvedInvitees.value.find((participant) => participant.id === userId));
};

const featuresListColumns = computed(() =>
    FEATURES.filter((feature) => availableFeatureIds.value.includes(feature.id)).map((feature) => ({
        field: feature.id,
        header: feature.label,
        icon: feature.icon
    }))
);

const availableFeatureIds = computed(() => selectedFeaturesFromEvent(props.event));

const eventPrices = computed(() => featurePricesFromEvent(props.event));
const eventSplitPrices = computed(() =>
    createFeatureRecord((feature) => featureSplitPrice(props.event, resolvedInvitees.value, feature))
);

const hasFeature = (userId: number, feature: EventFeature) => getParticipantFeatures(userId).includes(feature);
const getFeatureCount = (feature: EventFeature) => featureCount(resolvedInvitees.value, feature);
const getFeatureSplitPrice = (feature: EventFeature) => featureSplitPrice(props.event, resolvedInvitees.value, feature);

const userTotalShare = computed(() => {
    const user = currentUser.value;
    if (!user || !props.event) return 0;

    const participant = props.event.participants?.find((item) => item.id === user.id);
    if (!participant || participant.status !== 'ACCEPTED') return 0;

    return participantFeatures(participant).reduce((total, feature) => total + getFeatureSplitPrice(feature), 0);
});

const drivers = computed(() => {
    if (!props.event?.participants) return [];
    return resolvedInvitees.value
        .filter((participant) => participant.status === 'ACCEPTED' && participant.hasVehicle)
        .sort((a, b) => a.username.localeCompare(b.username));
});

const needsRide = computed(() => {
    if (!props.event?.participants) return [];
    return resolvedInvitees.value
        .filter((participant) => participant.status === 'ACCEPTED' && !participant.hasVehicle && !participant.driverId)
        .sort((a, b) => a.username.localeCompare(b.username));
});

const getAssignedPassengers = (driverId: number) => {
    if (!props.event?.participants) return [];
    return resolvedInvitees.value.filter((participant) => participant.driver?.id === driverId);
};

const getAvailableSeats = (driver: EventParticipant | undefined) => {
    if (!driver) return 0;
    const assigned = getAssignedPassengers(driver.id).length;
    const totalSeats = driver.vehicleSeats;
    return Math.max(0, totalSeats! - 1 - assigned);
};

const onDragStart = (event: DragEvent, passengerId: number) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('passengerId', passengerId.toString());
    event.dataTransfer.effectAllowed = 'move';
};

const onDragOver = (event: DragEvent, driverId: number) => {
    event.preventDefault();
    const driver = drivers.value.find((candidate) => candidate.id === driverId);
    if (getAvailableSeats(driver) > 0) {
        dragOverDriverId.value = driverId;
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }
};

const onDragLeave = () => {
    dragOverDriverId.value = null;
};

const assignRide = async (passengerId: number, driverId: number | null) => {
    if (!props.event) return;

    assigningRide.value = true;
    try {
        const success = await eventsStore.assignRide(props.event.id, passengerId, driverId);
        if (success) emit('refresh');
        else throw new Error();
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: eventsStore.error || 'Failed to assign ride',
            life: 5000
        });
    } finally {
        assigningRide.value = false;
    }
};

const assignRidesBatch = async (passengerIds: number[], driverId: number | null) => {
    if (!props.event) return;

    assigningRide.value = true;
    try {
        const success = await eventsStore.assignRidesBatch(props.event.id, passengerIds, driverId);
        if (success) emit('refresh');
        else throw new Error();
    } catch {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: eventsStore.error || 'Failed to assign rides',
            life: 5000
        });
    } finally {
        assigningRide.value = false;
    }
};

const onDrop = async (event: DragEvent, driverId: number) => {
    event.preventDefault();
    dragOverDriverId.value = null;

    if (!event.dataTransfer) return;

    const passengerId = Number.parseInt(event.dataTransfer.getData('passengerId'), 10);
    if (Number.isNaN(passengerId)) return;

    const driver = drivers.value.find((candidate) => candidate.id === driverId);
    if (driver && getAvailableSeats(driver) > 0) {
        await assignRide(passengerId, driverId);
    }
};

const eventTotalBudget = computed(() => totalEventBudget(props.event));

const isAldoMoro = computed(() => {
    if (!props.event?.participants) return false;

    const rideNeedingParticipants = needsRide.value;
    if (rideNeedingParticipants.length === 0) return false;

    const totalSeats = drivers.value.reduce((acc, participant) => acc + Math.max(0, participant.vehicleSeats! - 1), 0);
    return totalSeats < rideNeedingParticipants.length;
});

const getStatusIcon = (status: string) => getParticipantStatusIcon(status);
const getStatusSeverity = (status: string) => getParticipantStatusSeverity(status);

const formattedStart = computed(() => {
    if (!props.event?.startTime) return '';
    return format(parseISO(props.event.startTime), 'd MMMM yyyy HH:mm');
});

const formattedEnd = computed(() => {
    if (!props.event?.endTime) return '';
    return format(parseISO(props.event.endTime), 'd MMMM yyyy HH:mm');
});

watch(
    () => props.visible,
    (isVisible) => {
        if (isVisible) {
            fetchUsers();
        } else {
            isEditing.value = false;
            showFeatureSelection.value = false;
        }
    }
);

const onDelete = () => {
    if (!props.event) return;
    confirm.require({
        message: 'Are you sure you want to delete this event? This action cannot be undone and all data will be lost.',
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'No',
            severity: 'secondary',
            text: true
        },
        acceptProps: {
            label: 'Yes, Delete',
            severity: 'danger'
        },
        accept: () => {
            if (!props.event) return;
            emit('delete', props.event.id);
        }
    });
};

const onEdit = () => {
    isEditing.value = true;
};

const onCancelEdit = () => {
    isEditing.value = false;
};

const handleEditSave = async (dto: CreateEventDto) => {
    if (!props.event) return;

    const success = await eventsStore.updateEvent(props.event.id, dto);
    if (success) {
        isEditing.value = false;
        emit('refresh');
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: eventsStore.error || 'Failed to update event',
            life: 5000
        });
    }
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        modal
        header="Event Details"
        :style="{ width: '1000px' }"
        :breakpoints="{ '960px': '85vw', '640px': '95vw' }"
        class="p-fluid"
        dismissableMask
        :draggable="false"
    >
        <EventViewMode
            v-if="event && !isEditing"
            :event="event"
            :event-host="eventHost"
            :current-user="currentUser"
            :user-participant-status="userParticipantStatus"
            :user-total-share="userTotalShare"
            :event-total-budget="eventTotalBudget"
            :formatted-start="formattedStart"
            :formatted-end="formattedEnd"
            :available-feature-ids="availableFeatureIds"
            :event-prices="eventPrices"
            :event-split-prices="eventSplitPrices"
            :features-list-columns="featuresListColumns"
            :resolved-invitees="resolvedInvitees"
            :drivers="drivers"
            :needs-ride="needsRide"
            :drag-over-driver-id="dragOverDriverId"
            :is-host="isHost"
            :is-aldo-moro="isAldoMoro"
            :joining="joining"
            :cancelling="cancelling"
            :get-feature-count="getFeatureCount"
            :get-feature-split-price="getFeatureSplitPrice"
            :has-feature="hasFeature"
            :get-status-severity="getStatusSeverity"
            :get-status-icon="getStatusIcon"
            :get-available-seats="getAvailableSeats"
            :on-edit="onEdit"
            :on-delete="onDelete"
            :on-accept-click="onAcceptClick"
            :on-edit-participation="onEditParticipation"
            :on-cancel-participation="onCancelParticipation"
            :on-decline="onDecline"
            :on-drag-start="onDragStart"
            :on-drag-over="onDragOver"
            :on-drag-leave="onDragLeave"
            :on-drop="onDrop"
            :assign-ride="assignRide"
            :assign-rides-batch="assignRidesBatch"
            :is-deadline-passed="isDeadlinePassed"
        />

        <EventEditForm
            v-else-if="event && isEditing"
            :event="event"
            :users="allUsers"
            :saving="eventsStore.loading"
            @save="handleEditSave"
            @cancel="onCancelEdit"
        />

        <template #footer>
            <div class="flex w-full justify-end gap-2 pt-2">
                <template v-if="!isEditing">
                    <template v-if="userParticipantStatus === 'ACCEPTED'">
                        <Button
                            label="Leave"
                            icon="pi pi-times"
                            severity="danger"
                            text
                            :loading="cancelling"
                            @click="onCancelParticipation"
                        />
                        <Button
                            v-if="!isDeadlinePassed || isHost"
                            label="Edit Participation"
                            icon="pi pi-pencil"
                            severity="secondary"
                            @click="onEditParticipation"
                        />
                    </template>
                    <template v-else>
                        <Button
                            v-if="userParticipantStatus === 'PENDING'"
                            label="Decline"
                            icon="pi pi-times"
                            severity="danger"
                            text
                            :loading="cancelling"
                            @click="onDecline"
                        />
                        <Button
                            v-if="canAccept"
                            :label="userParticipantStatus === 'ACCEPTED' ? 'Joined' : 'Join'"
                            icon="pi pi-check"
                            severity="success"
                            :loading="joining"
                            :disabled="userParticipantStatus === 'ACCEPTED' || isDeadlinePassed"
                            @click="onAcceptClick"
                        />
                    </template>
                </template>
            </div>
        </template>
    </Dialog>

    <FeatureSelectionDialog
        v-model:visible="showFeatureSelection"
        :availableFeatures="availableFeatureIds"
        :initialFeatures="currentUser ? getParticipantFeatures(currentUser.id) : []"
        :initialHasVehicle="props.event?.participants?.find((p) => p.id === currentUser?.id)?.hasVehicle"
        :initialVehicleSeats="props.event?.participants?.find((p) => p.id === currentUser?.id)?.vehicleSeats"
        :submitLabel="userParticipantStatus === 'ACCEPTED' ? 'Save Changes' : 'Join Event'"
        :featurePrices="eventPrices"
        :featureSplitPrices="eventSplitPrices"
        @confirm="handleFeatureConfirm"
    />
</template>
