<script setup lang="ts">
import type { Event, EventFeature, EventParticipant, EventPersonSummary } from '../../../types/Event';
import type { User } from '../../../types/User';
import Divider from 'primevue/divider';
import { computed } from 'vue';

import EventHeader from './EventHeader.vue';
import EventInfo from './EventInfo.vue';
import EventCostBreakdown from './EventCostBreakdown.vue';
import EventParticipantsTable from './EventParticipantsTable.vue';
import EventTransportSection from './EventTransportSection.vue';
import EventActions from './EventActions.vue';

type FeatureColumn = {
    field: EventFeature;
    header: string;
    icon: string;
};

const props = defineProps<{
    event: Event;
    eventHost: EventPersonSummary | null;
    currentUser: User | null | undefined;
    userParticipantStatus: string | null;
    userTotalShare: number;
    eventTotalBudget: number;
    formattedStart: string;
    formattedEnd: string;
    availableFeatureIds: EventFeature[];
    eventPrices: Record<EventFeature, number | null>;
    eventSplitPrices: Record<EventFeature, number | null>;
    featuresListColumns: FeatureColumn[];
    resolvedInvitees: EventParticipant[];
    drivers: EventParticipant[];
    needsRide: EventParticipant[];
    dragOverDriverId: number | null;
    isHost: boolean;
    isDeadlinePassed: boolean;
    isEnded: boolean;
    isAldoMoro: boolean;
    joining: boolean;
    cancelling: boolean;
    getFeatureCount: (feature: EventFeature) => number;
    getFeatureSplitPrice: (feature: EventFeature) => number;
    hasFeature: (userId: number, feature: EventFeature) => boolean;
    getStatusSeverity: (status: string) => string;
    getStatusIcon: (status: string) => string;
    getAvailableSeats: (driver: EventParticipant | undefined) => number;
    onEdit: () => void;
    onDelete: () => void;
    onAcceptClick: () => void;
    onEditParticipation: () => void;
    onCancelParticipation: () => void;
    onDecline: () => void;
    onDragStart: (event: DragEvent, passengerId: number) => void;
    onDragOver: (event: DragEvent, driverId: number) => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent, driverId: number) => void;
    assignRide: (passengerId: number, driverId: number | null) => void;
    assignRidesBatch: (passengerIds: number[], driverId: number | null) => void;
}>();

const canEditRides = computed(
    () =>
        (props.isHost || props.drivers.some((driver) => driver.id === props.currentUser?.id)) &&
        !props.isDeadlinePassed &&
        !props.isEnded
);

const canEditRide = (driverId: number) => {
    return (props.isHost || driverId === props.currentUser?.id) && !props.isEnded;
};
</script>

<template>
    <div class="flex flex-col gap-4 py-2">
        <EventHeader
            :event="event"
            :event-host="eventHost"
            :event-total-budget="eventTotalBudget"
            :is-deadline-passed="isDeadlinePassed"
            :is-ended="isEnded"
        />

        <Divider class="my-2!" />

        <EventInfo
            :event="event"
            :formatted-start="formattedStart"
            :formatted-end="formattedEnd"
            :participation-deadline="event.participationDeadline"
        />

        <Divider class="my-2!" v-if="availableFeatureIds.length > 0" />

        <EventCostBreakdown
            v-if="availableFeatureIds.length > 0"
            :user-participant-status="userParticipantStatus"
            :user-total-share="userTotalShare"
            :available-feature-ids="availableFeatureIds"
            :event-prices="eventPrices"
            :get-feature-count="getFeatureCount"
            :get-feature-split-price="getFeatureSplitPrice"
        />

        <Divider class="my-2!" />

        <EventParticipantsTable
            :resolved-invitees="resolvedInvitees"
            :features-list-columns="featuresListColumns"
            :get-feature-count="getFeatureCount"
            :has-feature="hasFeature"
            :get-status-severity="getStatusSeverity"
            :get-status-icon="getStatusIcon"
        />

        <Divider class="my-2!" />

        <EventTransportSection
            :drivers="drivers"
            :needs-ride="needsRide"
            :resolved-invitees="resolvedInvitees"
            :drag-over-driver-id="dragOverDriverId"
            :is-host="isHost"
            :is-ended="isEnded"
            :is-deadline-passed="isDeadlinePassed"
            :is-aldo-moro="isAldoMoro"
            :can-edit-rides="canEditRides"
            :get-available-seats="getAvailableSeats"
            :can-edit-ride="canEditRide"
            @drag-start="onDragStart"
            @drag-over="onDragOver"
            @drag-leave="onDragLeave"
            @drop="onDrop"
            @assign-ride="assignRide"
            @assign-rides-batch="assignRidesBatch"
        />

        <EventActions v-if="isHost && !isEnded" @edit="onEdit" @delete="onDelete" />
    </div>
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
