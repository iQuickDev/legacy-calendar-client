<script setup lang="ts">
import type { Event, EventFeature, EventParticipant } from '../../../types/Event';
import type { User } from '../../../types/User';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { baseURL } from '../../../services/API';
import { FEATURES } from '../../../constants/features';

type FeatureColumn = {
    field: EventFeature;
    header: string;
    icon: string;
};

const props = defineProps<{
    event: Event;
    eventHost: User | null;
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
}>();

</script>

<template>
    <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <h2 class="text-xl sm:text-2xl font-bold m-0 uppercase flex-1">{{ event.title }}</h2>
                <div v-if="eventTotalBudget > 0" class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 shrink-0 bg-emerald-500/5 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-emerald-500/10 sm:border-none">
                    <span class="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Expenses</span>
                    <span class="text-lg sm:text-xl font-black text-emerald-500">
                        {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(eventTotalBudget) }}
                    </span>
                </div>
            </div>

            <div v-if="eventHost" class="flex items-center gap-2">
                <Avatar :image="eventHost.profilePicture ? `${baseURL}${eventHost.profilePicture}` : undefined"
                    :label="!eventHost.profilePicture ? eventHost.username.charAt(0) : undefined" shape="circle"
                    size="small" />
                <span class="text-surface-600 dark:text-surface-400">Hosted by <span
                        class="text-surface-900 dark:text-surface-0 font-semibold">{{ eventHost.username }}</span></span>
            </div>

            <div v-if="userParticipantStatus === 'ACCEPTED'"
                class="relative overflow-hidden group bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 backdrop-blur-md p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-1 shadow-sm hover:shadow-emerald-500/10 transition-all duration-300">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div class="flex items-center gap-4 w-full sm:w-auto relative z-10">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                        <i class="pi pi-wallet text-xl sm:text-2xl"></i>
                    </div>
                    <div>
                        <div class="text-[10px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">Your Personal Contribution</div>
                        <div class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Based on selected features</div>
                    </div>
                </div>
                <div class="flex flex-col items-end w-full sm:w-auto relative z-10">
                    <div class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1">
                        {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(userTotalShare) }}
                    </div>
                </div>
            </div>
        </div>

        <Divider class="my-2!" />

        <div v-if="event.description" class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                <i class="pi pi-align-left"></i>
                <span class="font-semibold">Description</span>
            </div>
            <p class="m-0 pl-6 text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{{ event.description }}</p>
        </div>

        <div v-if="event.location" class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                <i class="pi pi-map-marker"></i>
                <span class="font-semibold">Location</span>
            </div>
            <p class="m-0 pl-6 text-surface-700 dark:text-surface-300">{{ event.location }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-calendar"></i>
                    <span class="font-semibold">Start</span>
                </div>
                <div class="pl-6">
                    <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedStart }}</p>
                </div>
            </div>

            <div v-if="event.endTime" class="flex flex-col gap-2">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-calendar-times"></i>
                    <span class="font-semibold">End</span>
                </div>
                <div class="pl-6">
                    <p class="m-0 text-surface-700 dark:text-surface-300">{{ formattedEnd }}</p>
                </div>
            </div>
        </div>

        <Divider v-if="availableFeatureIds.length > 0" class="my-2!" />

        <div v-if="availableFeatureIds.length > 0" class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-receipt"></i>
                    <span class="font-bold uppercase tracking-wider text-sm">Costs & Budget Breakdown</span>
                </div>
                <div class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 text-[10px] font-black uppercase text-zinc-500 tracking-tighter border border-zinc-200 dark:border-zinc-700/50">
                    <span>Splits are auto-calculated</span>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:pl-0 pl-0">
                <div v-for="feature in FEATURES.filter((item) => availableFeatureIds.includes(item.id))" :key="feature.id"
                    class="flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group"
                    :class="[
                        getFeatureCount(feature.id) > 0
                            ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                            : 'bg-zinc-50/50 dark:bg-zinc-950/30 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                    ]">
                    <div class="absolute -right-2 -bottom-2 w-16 h-16 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-xl"
                        :class="feature.color.split(' ')[0]"></div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                                :class="feature.color">
                                {{ feature.icon }}
                            </div>
                            <div class="flex flex-col">
                                <span class="font-bold text-sm">{{ feature.label }}</span>
                                <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                    {{ getFeatureCount(feature.id) }} participating
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div v-if="eventPrices[feature.id] !== null" class="flex flex-col gap-0.5">
                            <div class="flex items-center justify-between">
                                <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Budget</span>
                                <span class="text-[10px] font-bold text-zinc-500">
                                    {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(eventPrices[feature.id] ?? 0) }}
                                </span>
                            </div>
                            <div class="flex items-center justify-between mt-1">
                                <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Your Share</span>
                                <span class="text-lg font-black text-emerald-500">
                                    {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(getFeatureSplitPrice(feature.id)) }}
                                </span>
                            </div>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center py-2">
                            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No budget set</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Divider class="my-2!" />

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
                <Column v-for="col in featuresListColumns" :key="col.field" class="text-center min-w-12 sm:min-w-28">
                    <template #header>
                        <span class="font-bold hidden sm:inline whitespace-nowrap">{{ col.header }} ({{ getFeatureCount(col.field) }})</span>
                        <span class="font-bold sm:hidden whitespace-nowrap" :title="col.header">{{ col.icon }}</span>
                    </template>
                    <template #body="slotProps">
                        <div v-if="slotProps.data.status === 'ACCEPTED'" class="flex justify-center text-xs">
                            <template v-if="hasFeature(slotProps.data.id, col.field)">
                                <i class="pi pi-check text-green-500 font-bold"></i>
                            </template>
                            <template v-else>
                                <i class="pi pi-times text-red-500 font-bold opacity-30"></i>
                            </template>
                        </div>
                        <div v-else class="text-center text-surface-400">-</div>
                    </template>
                </Column>
                <Column field="status" header="Status" class="w-16 sm:w-24 text-center">
                    <template #body="slotProps">
                        <span class="hidden sm:inline">
                            <Tag :severity="getStatusSeverity(slotProps.data.status)" size="small" :value="slotProps.data.status" />
                        </span>
                        <div class="sm:hidden flex justify-center">
                            <Tag :severity="getStatusSeverity(slotProps.data.status)" class="w-8! h-8! p-0! flex items-center justify-center" size="small">
                                <i :class="getStatusIcon(slotProps.data.status)" class="text-xs"></i>
                            </Tag>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Divider class="!my-2" />

        <div class="flex flex-col gap-3 pb-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-car"></i>
                    <span class="font-semibold uppercase tracking-wider text-sm">Transport & Rides</span>
                </div>
                <Tag v-if="needsRide.length > 0" severity="warn" :value="`${needsRide.length} needing ride`" size="small" />
            </div>

            <div v-if="drivers.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="driver in drivers" :key="driver.id"
                    class="p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3"
                    :class="[
                        dragOverDriverId === driver.id
                            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-lg shadow-emerald-500/10'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50',
                        getAvailableSeats(driver) === 0 && dragOverDriverId === driver.id ? 'border-red-500 bg-red-500/10' : ''
                    ]"
                    @dragover="onDragOver($event, driver.id)"
                    @dragleave="onDragLeave"
                    @drop="onDrop($event, driver.id)">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <Avatar :image="driver.profilePicture ? `${baseURL}${driver.profilePicture}` : undefined"
                                :label="!driver.profilePicture ? driver.username.charAt(0) : undefined" shape="circle" size="normal" />
                            <div class="flex flex-col">
                                <span class="font-bold text-sm">{{ driver.username }}</span>
                                <div class="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                                    <span>Vehicle</span>
                                    <span>•</span>
                                    <span :class="getAvailableSeats(driver) > 0 ? 'text-emerald-500' : 'text-red-500'">
                                        {{ getAvailableSeats(driver) }} seats left
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                        <div v-for="passenger in resolvedInvitees.filter((participant) => participant.driver?.id === driver.id)" :key="passenger.id"
                            class="flex items-center gap-2 px-2 py-1 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300/30 dark:border-zinc-700/30 group">
                            <Avatar :image="passenger.profilePicture ? `${baseURL}${passenger.profilePicture}` : undefined"
                                :label="!passenger.profilePicture ? passenger.username.charAt(0) : undefined" shape="circle" size="small" class="w-4! h-4!" />
                            <span class="text-[10px] font-medium">{{ passenger.username }}</span>
                            <Button v-if="isHost || driver.id === currentUser?.id" icon="pi pi-times" severity="danger" text class="p-0! w-4! h-4! opacity-0 group-hover:opacity-100 transition-opacity"
                                @click="assignRide(passenger.id, null)" />
                        </div>
                        <div v-if="resolvedInvitees.filter((participant) => participant.driver?.id === driver.id).length === 0" class="text-[10px] text-zinc-500 italic px-1">
                            No passengers assigned yet
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                No drivers available for this event yet.
            </div>

            <div v-if="(isHost || drivers.some((driver) => driver.id === currentUser?.id)) && needsRide.length > 0" class="mt-2 flex flex-col gap-2">
                <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Unassigned Participants</span>
                <div class="flex flex-col gap-1">
                    <div v-for="passenger in needsRide" :key="passenger.id"
                        draggable="true"
                        @dragstart="onDragStart($event, passenger.id)"
                        class="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/30 cursor-grab active:cursor-grabbing hover:border-emerald-500/50 transition-colors group">
                        <div class="flex items-center gap-3">
                            <Avatar :image="passenger.profilePicture ? `${baseURL}${passenger.profilePicture}` : undefined"
                                :label="!passenger.profilePicture ? passenger.username.charAt(0) : undefined" shape="circle" size="small" />
                            <div class="flex flex-col">
                                <span class="text-sm font-medium">{{ passenger.username }}</span>
                                <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Drag to assign</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button v-for="driver in drivers.filter((candidate) => (isHost || candidate.id === currentUser?.id) && getAvailableSeats(candidate) > 0)" :key="driver.id"
                                :label="isHost && driver.id !== currentUser?.id ? `Add to ${driver.username}` : 'Add to my vehicle'" icon="pi pi-plus" size="small" severity="secondary" outlined
                                class="text-[10px]! py-1!" @click="assignRide(passenger.id, driver.id)" />
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="isAldoMoro" class="mt-4 flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500">
                <i class="pi pi-exclamation-triangle text-lg"></i>
                <span class="text-xs font-bold uppercase tracking-widest animate-pulse">Aldo moro detected</span>
            </div>
        </div>

        <template v-if="isHost">
            <Divider class="my-2!" />

            <div class="flex flex-col gap-3 pb-4">
                <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <i class="pi pi-cog"></i>
                    <span class="font-semibold uppercase tracking-wider text-sm">Event Settings</span>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <Button label="Edit Event" icon="pi pi-pencil" severity="secondary" outlined @click="onEdit" />
                    <Button label="Delete Event" icon="pi pi-trash" severity="danger" outlined @click="onDelete" />
                </div>
            </div>
        </template>
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
