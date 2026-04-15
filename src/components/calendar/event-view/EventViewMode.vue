<script setup lang="ts">
import type { Event, EventFeature, EventParticipant } from '../../../types/Event';
import type { User } from '../../../types/User';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { uploadsBaseURL } from '../../../services/API';
import { FEATURES } from '../../../constants/features';

type FeatureColumn = {
    field: EventFeature;
    header: string;
    icon: string;
};

defineProps<{
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
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div class="flex flex-1 flex-col gap-1">
                    <h2 class="m-0 text-xl font-bold uppercase sm:text-2xl">{{ event.title }}</h2>
                    <div class="flex items-center gap-2">
                        <Tag
                            v-if="event.isOpen"
                            severity="success"
                            value="Open Event"
                            icon="pi pi-globe"
                            class="text-[10px]!"
                        />
                        <Tag
                            v-else-if="event.isPrivate"
                            severity="danger"
                            value="Private Event"
                            icon="pi pi-lock"
                            class="text-[10px]!"
                        />
                        <Tag
                            v-else
                            severity="secondary"
                            value="Standard Event"
                            icon="pi pi-calendar"
                            class="text-[10px]!"
                        />
                    </div>
                </div>
                <div
                    v-if="eventTotalBudget > 0"
                    class="flex shrink-0 flex-row items-center justify-between gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2 sm:flex-col sm:items-end sm:justify-start sm:gap-0 sm:rounded-none sm:border-none sm:bg-transparent sm:p-0"
                >
                    <span class="text-[10px] font-bold tracking-wider text-zinc-500 uppercase sm:text-xs"
                        >Total Expenses</span
                    >
                    <span class="text-lg font-black text-emerald-500 sm:text-xl">
                        {{
                            new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                                eventTotalBudget
                            )
                        }}
                    </span>
                </div>
            </div>

            <div v-if="eventHost" class="flex items-center gap-2">
                <Avatar
                    :image="eventHost.profilePicture ? `${uploadsBaseURL}${eventHost.profilePicture}` : undefined"
                    :label="!eventHost.profilePicture ? eventHost.username.charAt(0) : undefined"
                    shape="circle"
                    size="small"
                />
                <span class="text-surface-600 dark:text-surface-400"
                    >Hosted by
                    <span class="text-surface-900 dark:text-surface-0 font-semibold">{{
                        eventHost.username
                    }}</span></span
                >
            </div>

            <div
                v-if="userParticipantStatus === 'ACCEPTED'"
                class="group relative mt-1 flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-emerald-500/10 sm:flex-row sm:p-5"
            >
                <div
                    class="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-transform duration-700 group-hover:scale-150"
                ></div>
                <div class="relative z-10 flex w-full items-center gap-4 sm:w-auto">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-tr from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20 sm:h-12 sm:w-12"
                    >
                        <i class="pi pi-wallet text-xl sm:text-2xl"></i>
                    </div>
                    <div>
                        <div
                            class="text-[10px] font-black tracking-[0.2em] text-emerald-600 uppercase sm:text-xs dark:text-emerald-400"
                        >
                            Your Personal Contribution
                        </div>
                        <div class="text-[9px] font-bold tracking-wider text-zinc-500 uppercase sm:text-[10px]">
                            Based on selected features
                        </div>
                    </div>
                </div>
                <div class="relative z-10 flex w-full flex-col items-end sm:w-auto">
                    <div
                        class="flex items-baseline gap-1 text-2xl font-black text-emerald-600 sm:text-3xl dark:text-emerald-400"
                    >
                        {{
                            new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                                userTotalShare
                            )
                        }}
                    </div>
                </div>
            </div>
        </div>

        <Divider class="my-2!" />

        <div v-if="event.description" class="flex flex-col gap-2">
            <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                <i class="pi pi-align-left"></i>
                <span class="font-semibold">Description</span>
            </div>
            <p class="text-surface-700 dark:text-surface-300 m-0 pl-6 whitespace-pre-wrap">{{ event.description }}</p>
        </div>

        <div v-if="event.location" class="flex flex-col gap-2">
            <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                <i class="pi pi-map-marker"></i>
                <span class="font-semibold">Location</span>
            </div>
            <p class="text-surface-700 dark:text-surface-300 m-0 pl-6">{{ event.location }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-calendar"></i>
                    <span class="font-semibold">Start</span>
                </div>
                <div class="pl-6">
                    <p class="text-surface-700 dark:text-surface-300 m-0">{{ formattedStart }}</p>
                </div>
            </div>

            <div v-if="event.endTime" class="flex flex-col gap-2">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-calendar-times"></i>
                    <span class="font-semibold">End</span>
                </div>
                <div class="pl-6">
                    <p class="text-surface-700 dark:text-surface-300 m-0">{{ formattedEnd }}</p>
                </div>
            </div>
        </div>

        <Divider v-if="availableFeatureIds.length > 0" class="my-2!" />

        <div v-if="availableFeatureIds.length > 0" class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-receipt"></i>
                    <span class="text-sm font-bold tracking-wider uppercase">Costs & Budget Breakdown</span>
                </div>
                <div
                    class="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] font-black tracking-tighter text-zinc-500 uppercase dark:border-zinc-700/50 dark:bg-zinc-800/50"
                >
                    <span>Splits are auto-calculated</span>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-3 pl-0 sm:grid-cols-2 md:pl-0 lg:grid-cols-3">
                <div
                    v-for="feature in FEATURES.filter((item) => availableFeatureIds.includes(item.id))"
                    :key="feature.id"
                    class="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-300"
                    :class="[
                        getFeatureCount(feature.id) > 0
                            ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                            : 'border-dashed border-zinc-200 bg-zinc-50/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-950/30'
                    ]"
                >
                    <div
                        class="absolute -right-2 -bottom-2 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-10"
                        :class="feature.color.split(' ')[0]"
                    ></div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-10 w-10 items-center justify-center rounded-xl text-xl shadow-inner"
                                :class="feature.color"
                            >
                                {{ feature.icon }}
                            </div>
                            <div class="flex flex-col">
                                <span class="text-sm font-bold">{{ feature.label }}</span>
                                <span class="text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                                    {{ getFeatureCount(feature.id) }} participating
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800/50">
                        <div v-if="eventPrices[feature.id] !== null" class="flex flex-col gap-0.5">
                            <div class="flex items-center justify-between">
                                <span class="text-[9px] font-bold tracking-tighter text-zinc-400 uppercase"
                                    >Budget</span
                                >
                                <span class="text-[10px] font-bold text-zinc-500">
                                    {{
                                        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                                            eventPrices[feature.id] ?? 0
                                        )
                                    }}
                                </span>
                            </div>
                            <div class="mt-1 flex items-center justify-between">
                                <span class="text-[10px] font-black tracking-widest text-emerald-500 uppercase"
                                    >Your Share</span
                                >
                                <span class="text-lg font-black text-emerald-500">
                                    {{
                                        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                                            getFeatureSplitPrice(feature.id)
                                        )
                                    }}
                                </span>
                            </div>
                        </div>
                        <div v-else class="flex flex-col items-center justify-center py-2">
                            <span class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase"
                                >No budget set</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Divider class="my-2!" />

        <div class="flex flex-col gap-3">
            <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                <i class="pi pi-users"></i>
                <span class="font-semibold">Invitees</span>
            </div>

            <DataTable :value="resolvedInvitees" scrollable>
                <template #empty>
                    <div class="text-surface-500 p-4 text-center">No invitees found</div>
                </template>
                <Column field="username" header="Name">
                    <template #body="slotProps">
                        <div class="flex items-center gap-2">
                            <Avatar
                                :image="
                                    slotProps.data.profilePicture
                                        ? `${uploadsBaseURL}${slotProps.data.profilePicture}`
                                        : undefined
                                "
                                :label="!slotProps.data.profilePicture ? slotProps.data.username.charAt(0) : undefined"
                                shape="circle"
                                size="small"
                                class="h-6! w-6!"
                            />
                            <span>{{ slotProps.data.username }}</span>
                        </div>
                    </template>
                </Column>
                <Column v-for="col in featuresListColumns" :key="col.field" class="min-w-12 text-center sm:min-w-28">
                    <template #header>
                        <span class="hidden w-full text-center font-bold whitespace-nowrap sm:inline">
                            <span
                                :class="getFeatureCount(col.field) > 0 ? 'text-green-500' : 'text-zinc-400'"
                                class="font-bold tracking-widest uppercase"
                            >
                                {{ getFeatureCount(col.field) }}
                            </span>
                            {{ col.header }}
                        </span>
                        <span class="w-full text-center font-bold whitespace-nowrap sm:hidden" :title="col.header">{{
                            col.icon
                        }}</span>
                    </template>
                    <template #body="slotProps">
                        <div v-if="slotProps.data.status === 'ACCEPTED'" class="flex justify-center text-xs">
                            <template v-if="hasFeature(slotProps.data.id, col.field)">
                                <i class="pi pi-check font-bold text-green-500"></i>
                            </template>
                            <template v-else>
                                <i class="pi pi-times font-bold text-red-500/40"></i>
                            </template>
                        </div>
                        <div v-else class="text-surface-400 text-center">-</div>
                    </template>
                </Column>
                <Column field="status" header="Status" class="w-16 text-center sm:w-24">
                    <template #body="slotProps">
                        <span class="hidden sm:inline">
                            <Tag
                                :severity="getStatusSeverity(slotProps.data.status)"
                                size="small"
                                :value="slotProps.data.status"
                            />
                        </span>
                        <div class="flex justify-center sm:hidden">
                            <Tag
                                :severity="getStatusSeverity(slotProps.data.status)"
                                class="flex h-8! w-8! items-center justify-center p-0!"
                                size="small"
                            >
                                <i :class="getStatusIcon(slotProps.data.status)" class="text-xs"></i>
                            </Tag>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <Divider class="my-2!" />

        <div class="flex flex-col gap-3 pb-4">
            <div class="flex items-center justify-between">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-car"></i>
                    <span class="text-sm font-semibold tracking-wider uppercase">Transport & Rides</span>
                </div>
                <Tag
                    v-if="needsRide.length > 0"
                    severity="warn"
                    :value="`${needsRide.length} needing ride`"
                    size="small"
                />
            </div>

            <div v-if="drivers.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div
                    v-for="driver in drivers"
                    :key="driver.id"
                    class="flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200"
                    :class="[
                        dragOverDriverId === driver.id
                            ? 'scale-[1.02] border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                            : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50',
                        getAvailableSeats(driver) === 0 && dragOverDriverId === driver.id
                            ? 'border-red-500 bg-red-500/10'
                            : ''
                    ]"
                    @dragover="onDragOver($event, driver.id)"
                    @dragleave="onDragLeave"
                    @drop="onDrop($event, driver.id)"
                >
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <Avatar
                                :image="driver.profilePicture ? `${uploadsBaseURL}${driver.profilePicture}` : undefined"
                                :label="!driver.profilePicture ? driver.username.charAt(0) : undefined"
                                shape="circle"
                                size="normal"
                            />
                            <div class="flex flex-col">
                                <span class="text-sm font-bold">{{ driver.username }}</span>
                                <div class="flex items-center gap-2 text-[10px] font-bold uppercase">
                                    <span> {{ driver.vehicleSeats }} total seats </span>
                                    <span class="font-black">·</span>
                                    <span :class="getAvailableSeats(driver) > 0 ? 'text-emerald-500' : 'text-red-500'">
                                        {{ getAvailableSeats(driver) > 0 ? getAvailableSeats(driver) : 'None' }} left
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2 pt-1">
                        <div
                            v-for="passenger in resolvedInvitees.filter(
                                (participant) => participant.driver?.id === driver.id
                            )"
                            :key="passenger.id"
                            class="group flex items-center gap-2 rounded-lg border border-zinc-300/30 bg-zinc-200/50 px-2 py-1 dark:border-zinc-700/30 dark:bg-zinc-800/50"
                        >
                            <Avatar
                                :image="
                                    passenger.profilePicture
                                        ? `${uploadsBaseURL}${passenger.profilePicture}`
                                        : undefined
                                "
                                :label="!passenger.profilePicture ? passenger.username.charAt(0) : undefined"
                                shape="circle"
                                size="small"
                                class="h-4! w-4!"
                            />
                            <span class="text-[10px] font-medium">{{ passenger.username }}</span>
                            <Button
                                v-if="isHost || driver.id === currentUser?.id"
                                icon="pi pi-times"
                                severity="danger"
                                text
                                class="h-4! w-4! p-0! opacity-0 transition-opacity group-hover:opacity-100"
                                @click="assignRide(passenger.id, null)"
                            />
                        </div>
                        <div
                            v-if="
                                resolvedInvitees.filter((participant) => participant.driver?.id === driver.id)
                                    .length === 0
                            "
                            class="px-1 text-[10px] text-zinc-500 italic"
                        >
                            No passengers assigned yet
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-else
                class="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800"
            >
                No drivers available for this event yet.
            </div>

            <div
                v-if="(isHost || drivers.some((driver) => driver.id === currentUser?.id)) && needsRide.length > 0"
                class="mt-2 flex flex-col gap-2"
            >
                <span class="px-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase"
                    >Unassigned Participants</span
                >
                <div class="flex flex-col gap-1">
                    <div
                        v-for="passenger in needsRide"
                        :key="passenger.id"
                        draggable="true"
                        @dragstart="onDragStart($event, passenger.id)"
                        class="group flex cursor-grab items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 transition-colors hover:border-emerald-500/50 active:cursor-grabbing dark:border-zinc-800/50 dark:bg-zinc-900/30"
                    >
                        <div class="flex items-center gap-3">
                            <Avatar
                                :image="
                                    passenger.profilePicture
                                        ? `${uploadsBaseURL}${passenger.profilePicture}`
                                        : undefined
                                "
                                :label="!passenger.profilePicture ? passenger.username.charAt(0) : undefined"
                                shape="circle"
                                size="small"
                            />
                            <div class="flex flex-col">
                                <span class="text-sm font-medium">{{ passenger.username }}</span>
                                <span
                                    class="text-[9px] font-bold tracking-tighter text-zinc-500 uppercase opacity-0 transition-opacity group-hover:opacity-100"
                                    >Drag to assign</span
                                >
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <Button
                                v-for="driver in drivers.filter(
                                    (candidate) =>
                                        (isHost || candidate.id === currentUser?.id) && getAvailableSeats(candidate) > 0
                                )"
                                :key="driver.id"
                                :label="
                                    isHost && driver.id !== currentUser?.id
                                        ? `Add to ${driver.username}`
                                        : 'Add to my vehicle'
                                "
                                icon="pi pi-plus"
                                size="small"
                                severity="secondary"
                                outlined
                                class="py-1! text-[10px]!"
                                @click="assignRide(passenger.id, driver.id)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-if="isAldoMoro"
                class="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-red-500"
            >
                <i class="pi pi-exclamation-triangle text-lg"></i>
                <span class="animate-pulse text-xs font-bold tracking-widest uppercase">Aldo moro detected</span>
            </div>
        </div>

        <template v-if="isHost">
            <Divider class="my-2!" />

            <div class="flex flex-col gap-3 pb-4">
                <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-cog"></i>
                    <span class="text-sm font-semibold tracking-wider uppercase">Event Settings</span>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row">
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
