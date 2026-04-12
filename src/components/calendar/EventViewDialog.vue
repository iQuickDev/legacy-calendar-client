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
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import DatePicker from 'primevue/datepicker';
import MultiSelect from 'primevue/multiselect';
import ToggleSwitch from 'primevue/toggleswitch';
import InputNumber from 'primevue/inputnumber';

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
    (e: 'refresh'): void;
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

const eventHost = computed(() => {
    if (props.event?.host) return props.event.host;
    if (props.event?.hostId === undefined || props.event?.hostId === null || allUsers.value.length === 0) return null;
    return allUsers.value.find(u => u.id === props.event?.hostId) || null;
});

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

    if (isHost.value) return true;

    if (userParticipantStatus.value === 'ACCEPTED') return true;

    if (userParticipantStatus.value === 'PENDING') return true;

    if (userParticipantStatus.value === 'DECLINED') return true;

    if (props.event.isOpen && userParticipantStatus.value === null) return true;

    return false;
});

const joining = ref(false);
const cancelling = ref(false);
const showFeatureSelection = ref(false);
const showLeaveConfirmation = ref(false);

const onAcceptClick = () => {
    showFeatureSelection.value = true;
};

const onEditParticipation = () => {
    if (!currentUser.value) return;
    showFeatureSelection.value = true;
};

const onCancelParticipation = () => {
    showLeaveConfirmation.value = true;
};

const onDecline = async () => {
    if (!props.event || !currentUser.value) return;

    cancelling.value = true;
    try {
        const success = await eventsStore.leaveEvent(props.event.id);
        if (success) {
            emit('joined');
        }
    } finally {
        cancelling.value = false;
    }
};

const confirmLeave = async () => {
    if (!props.event || !currentUser.value) return;

    showLeaveConfirmation.value = false;
    cancelling.value = true;
    try {
        const success = await eventsStore.leaveEvent(props.event.id);
        if (success) {
            emit('joined');
        }
    } finally {
        cancelling.value = false;
    }
};

const handleFeatureConfirm = async (data: { features: EventFeature[], vehicle: { hasVehicle: boolean, vehicleSeats: number } }) => {
    showFeatureSelection.value = false;
    if (!props.event || !currentUser.value) return;

    joining.value = true;
    try {
        const { features, vehicle } = data;
        const participateDto = {
            wantsFood: features.includes('FOOD'),
            wantsWeed: features.includes('WEED'),
            wantsSleep: features.includes('SLEEP'),
            wantsAlcohol: features.includes('ALCOHOL'),
            wantsBeer: features.includes('BEER'),
            wantsGas: features.includes('GAS'),
            ...vehicle
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
    const participant = resolvedInvitees.value.find(p => p.id === userId);
    if (!participant) return [];

    const features: EventFeature[] = [];
    if (participant.wantsFood) features.push('FOOD');
    if (participant.wantsWeed) features.push('WEED');
    if (participant.wantsAlcohol) features.push('ALCOHOL');
    if (participant.wantsSleep) features.push('SLEEP');
    if (participant.wantsBeer) features.push('BEER');
    if (participant.wantsGas) features.push('GAS');

    return features;
};

const featuresListColumns = FEATURES.map(f => ({
    field: f.id,
    header: f.label,
    icon: f.icon
}));

const eventFeatures = computed(() => {
    if (!props.event) return [];

    return FEATURES.filter(feature => {
        if (feature.id === 'FOOD' && props.event!.hasFood) return true;
        if (feature.id === 'WEED' && props.event!.hasWeed) return true;
        if (feature.id === 'ALCOHOL' && props.event!.hasAlcohol) return true;
        if (feature.id === 'SLEEP' && props.event!.hasSleep) return true;
        if (feature.id === 'BEER' && props.event!.hasBeer) return true;
        if (feature.id === 'GAS' && props.event!.hasGas) return true;
        return false;
    });
});

const eventPrices = computed<Record<string, number | null>>(() => {
    if (!props.event) return {} as Record<string, number | null>;
    return {
        FOOD: props.event.foodPrice ?? null,
        WEED: props.event.weedPrice ?? null,
        SLEEP: props.event.sleepPrice ?? null,
        ALCOHOL: props.event.alcoholPrice ?? null,
        BEER: props.event.beerPrice ?? null,
        GAS: props.event.gasPrice ?? null
    };
});

const eventSplitPrices = computed<Record<string, number | null>>(() => {
    if (!props.event) return {} as Record<string, number | null>;
    return {
        FOOD: getFeatureSplitPrice('FOOD'),
        WEED: getFeatureSplitPrice('WEED'),
        SLEEP: getFeatureSplitPrice('SLEEP'),
        ALCOHOL: getFeatureSplitPrice('ALCOHOL'),
        BEER: getFeatureSplitPrice('BEER'),
        GAS: getFeatureSplitPrice('GAS')
    };
});

const availableFeatureIds = computed(() => {
    if (!props.event) return [];
    const features: EventFeature[] = [];
    if (props.event.hasFood) features.push('FOOD');
    if (props.event.hasWeed) features.push('WEED');
    if (props.event.hasAlcohol) features.push('ALCOHOL');
    if (props.event.hasSleep) features.push('SLEEP');
    if (props.event.hasBeer) features.push('BEER');
    if (props.event.hasGas) features.push('GAS');
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
            case 'BEER': return p.wantsBeer;
            case 'GAS': return p.wantsGas;
            default: return false;
        }
    }).length;
};

const getFeatureSplitPrice = (featureId: string) => {
    if (!props.event) return 0;
    const price = (props.event as any)[`${featureId.toLowerCase()}Price`] || 0;
    if (price === 0) return 0;
    const count = getFeatureCount(featureId as EventFeature);
    return count > 0 ? price / count : price;
};

const userTotalShare = computed(() => {
    if (!currentUser.value || !props.event) return 0;
    const participant = props.event.participants?.find(p => p.id === currentUser.value?.id);
    if (!participant || participant.status !== 'ACCEPTED') return 0;

    let total = 0;
    if (participant.wantsFood) total += getFeatureSplitPrice('FOOD');
    if (participant.wantsWeed) total += getFeatureSplitPrice('WEED');
    if (participant.wantsAlcohol) total += getFeatureSplitPrice('ALCOHOL');
    if (participant.wantsSleep) total += getFeatureSplitPrice('SLEEP');
    if (participant.wantsBeer) total += getFeatureSplitPrice('BEER');
    if (participant.wantsGas) total += getFeatureSplitPrice('GAS');

    return total;
});

const drivers = computed(() => {
    if (!props.event?.participants) return [];
    return resolvedInvitees.value.filter(p => p.status === 'ACCEPTED' && p.hasVehicle);
});

const needsRide = computed(() => {
    if (!props.event?.participants) return [];
    return resolvedInvitees.value.filter(p => 
        p.status === 'ACCEPTED' && 
        !p.hasVehicle && 
        !p.driverId
    );
});

const getAssignedPassengers = (driverId: number) => {
    if (!props.event?.participants) return [];
    return resolvedInvitees.value.filter(p => p.driver?.id === driverId);
};

const getAvailableSeats = (driver: any) => {
    const assigned = getAssignedPassengers(driver.id).length;
    return Math.max(0, (driver.vehicleSeats || 0) - assigned);
};

const assigningRide = ref(false);
const dragOverDriverId = ref<number | null>(null);

const onDragStart = (event: DragEvent, passengerId: number) => {
    if (event.dataTransfer) {
        event.dataTransfer.setData('passengerId', passengerId.toString());
        event.dataTransfer.effectAllowed = 'move';
    }
};

const onDragOver = (event: DragEvent, driverId: number) => {
    event.preventDefault();
    if (getAvailableSeats(drivers.value.find(d => d.id === driverId)) > 0) {
        dragOverDriverId.value = driverId;
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
};

const onDragLeave = () => {
    dragOverDriverId.value = null;
};

const onDrop = async (event: DragEvent, driverId: number) => {
    event.preventDefault();
    dragOverDriverId.value = null;
    
    if (event.dataTransfer) {
        const passengerId = parseInt(event.dataTransfer.getData('passengerId'));
        if (!isNaN(passengerId)) {
            const driver = drivers.value.find(d => d.id === driverId);
            if (driver && getAvailableSeats(driver) > 0) {
                await assignRide(passengerId, driverId);
            }
        }
    }
};

const assignRide = async (passengerId: number, driverId: number | null) => {
    if (!props.event) return;
    
    assigningRide.value = true;
    try {
        await eventsStore.assignRide(props.event.id, passengerId, driverId);
        emit('refresh');
    } catch (error) {
        console.error('Failed to assign ride:', error);
    } finally {
        assigningRide.value = false;
    }
};


const eventTotalBudget = computed(() => {
    if (!props.event) return 0;
    return (props.event.foodPrice || 0) +
        (props.event.weedPrice || 0) +
        (props.event.sleepPrice || 0) +
        (props.event.alcoholPrice || 0) +
        (props.event.beerPrice || 0) +
        (props.event.gasPrice || 0);
});

const isAldoMoro = computed(() => {
    if (!props.event?.participants) return false;
    
    const rideNeedingParticipants = needsRide.value;
    if (rideNeedingParticipants.length === 0) return false;

    const totalSeats = drivers.value.reduce((acc, p) => {
        if (p.hasVehicle) {
            return acc + (p.vehicleSeats || 0);
        }
        return acc;
    }, 0);

    return totalSeats < rideNeedingParticipants.length;
});

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'ACCEPTED': return 'pi pi-check';
        case 'DECLINED': return 'pi pi-times';
        case 'PENDING': return 'pi pi-clock';
        default: return 'pi pi-info-circle';
    }
};

// Formatted dates for display

const formattedStart = computed(() => {
    if (!props.event?.startTime) return '';
    return format(parseISO(props.event.startTime), 'd MMMM yyyy HH:mm');
});

const formattedEnd = computed(() => {
    if (!props.event?.endTime) return '';
    return format(parseISO(props.event.endTime), 'd MMMM yyyy HH:mm');
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

// --- Edit Mode ---

const isEditing = ref(false);
const editTitle = ref('');
const editDescription = ref('');
const editLocation = ref('');
const editIsOpen = ref(true);
const editSelectedFeatures = ref<EventFeature[]>([]);
const editFeaturePrices = ref<Record<string, number | null>>({
    FOOD: null,
    WEED: null,
    SLEEP: null,
    ALCOHOL: null,
    BEER: null,
    GAS: null
});
const editStartDateOnly = ref<Date | null>(null);
const editStartTimeOnly = ref<Date | null>(null);
const editEndDateOnly = ref<Date | null>(null);
const editEndTimeOnly = ref<Date | null>(null);
const editSelectedParticipants = ref<number[]>([]);

const onEdit = () => {
    if (!props.event) return;
    
    editTitle.value = props.event.title;
    editDescription.value = props.event.description || '';
    editLocation.value = props.event.location || '';
    editIsOpen.value = props.event.isOpen;
    
    editSelectedFeatures.value = [];
    if (props.event.hasFood) editSelectedFeatures.value.push('FOOD');
    if (props.event.hasWeed) editSelectedFeatures.value.push('WEED');
    if (props.event.hasSleep) editSelectedFeatures.value.push('SLEEP');
    if (props.event.hasAlcohol) editSelectedFeatures.value.push('ALCOHOL');
    if (props.event.hasBeer) editSelectedFeatures.value.push('BEER');
    if (props.event.hasGas) editSelectedFeatures.value.push('GAS');
    
    editFeaturePrices.value.FOOD = props.event.foodPrice || null;
    editFeaturePrices.value.WEED = props.event.weedPrice || null;
    editFeaturePrices.value.SLEEP = props.event.sleepPrice || null;
    editFeaturePrices.value.ALCOHOL = props.event.alcoholPrice || null;
    editFeaturePrices.value.BEER = props.event.beerPrice || null;
    editFeaturePrices.value.GAS = props.event.gasPrice || null;
    
    const start = parseISO(props.event.startTime);
    editStartDateOnly.value = start;
    editStartTimeOnly.value = start;
    
    if (props.event.endTime) {
        const end = parseISO(props.event.endTime);
        editEndDateOnly.value = end;
        editEndTimeOnly.value = end;
    } else {
        editEndDateOnly.value = null;
        editEndTimeOnly.value = null;
    }
    
    editSelectedParticipants.value = props.event.participants?.map(p => p.id) || [];
    
    isEditing.value = true;
};

const combineDateAndTime = (datePart: Date, timePart: Date): Date => {
    const combined = new Date(datePart);
    combined.setHours(timePart.getHours());
    combined.setMinutes(timePart.getMinutes());
    return combined;
};

const savingEdit = ref(false);

const onSaveEdit = async () => {
    if (!props.event || !editTitle.value || !editStartDateOnly.value || !editStartTimeOnly.value) return;

    savingEdit.value = true;
    try {
        const start = combineDateAndTime(editStartDateOnly.value, editStartTimeOnly.value);
        let end: Date | undefined;
        if (editEndDateOnly.value && editEndTimeOnly.value) {
            end = combineDateAndTime(editEndDateOnly.value, editEndTimeOnly.value);
        }

        const dto = {
            title: editTitle.value,
            description: editDescription.value || undefined,
            location: editLocation.value || undefined,
            startTime: start.toISOString(),
            endTime: end ? end.toISOString() : undefined,
            participants: editSelectedParticipants.value,
            isOpen: editIsOpen.value,
            hasFood: editSelectedFeatures.value.includes('FOOD'),
            hasWeed: editSelectedFeatures.value.includes('WEED'),
            hasSleep: editSelectedFeatures.value.includes('SLEEP'),
            hasAlcohol: editSelectedFeatures.value.includes('ALCOHOL'),
            hasBeer: editSelectedFeatures.value.includes('BEER'),
            hasGas: editSelectedFeatures.value.includes('GAS'),
            foodPrice: editFeaturePrices.value.FOOD || undefined,
            weedPrice: editFeaturePrices.value.WEED || undefined,
            sleepPrice: editFeaturePrices.value.SLEEP || undefined,
            alcoholPrice: editFeaturePrices.value.ALCOHOL || undefined,
            beerPrice: editFeaturePrices.value.BEER || undefined,
            gasPrice: editFeaturePrices.value.GAS || undefined,
        };

        const success = await eventsStore.updateEvent(props.event.id, dto);
        if (success) {
            isEditing.value = false;
            emit('refresh');
        }
    } finally {
        savingEdit.value = false;
    }
};

const onCancelEdit = () => {
    isEditing.value = false;
};

const toggleEditFeature = (feature: EventFeature) => {
    const index = editSelectedFeatures.value.indexOf(feature);
    if (index === -1) {
        editSelectedFeatures.value.push(feature);
    } else {
        editSelectedFeatures.value.splice(index, 1);
    }
};

</script>

<template>
    <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" modal header="Event Details"
        :style="{ width: '1000px' }" :breakpoints="{ '960px': '85vw', '640px': '95vw' }" class="p-fluid" dismissableMask
        :draggable="false">

        <!-- View Mode -->
        <div v-if="event && !isEditing" class="flex flex-col gap-4">
            <!-- Title and Host Header -->
            <div class="flex flex-col gap-3">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <h2 class="text-xl sm:text-2xl font-bold m-0 uppercase flex-1">{{ event.title }}</h2>
                    <div v-if="eventTotalBudget > 0" class="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0 shrink-0 bg-emerald-500/5 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border border-emerald-500/10 sm:border-none">
                        <span class="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Expenses</span>
                        <span class="text-lg sm:text-xl font-black text-emerald-500">
                            {{ new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(eventTotalBudget)}}
                        </span>
                    </div>
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

                <!-- User Share Section -->
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

            <!-- Costs Breakdown Section -->
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
                    <div v-for="feature in eventFeatures" :key="feature.id"
                        class="flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group"
                        :class="[
                            getFeatureCount(feature.id) > 0 
                                ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' 
                                : 'bg-zinc-50/50 dark:bg-zinc-950/30 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                        ]">
                        <!-- Background Glow Effect (on hover) -->
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
                    <Column v-for="col in featuresListColumns" :key="col.field"
                        class="text-center min-w-12 sm:min-w-28">
                        <template #header>
                            <span class="font-bold hidden sm:inline whitespace-nowrap">{{ col.header }} ({{
                                getFeatureCount(col.field) }})</span>
                            <span class="font-bold sm:hidden whitespace-nowrap" :title="col.header">{{ col.icon
                                }}</span>
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
                                <Tag :severity="getStatusSeverity(slotProps.data.status)" size="small"
                                    :value="slotProps.data.status" />
                            </span>
                            <div class="sm:hidden flex justify-center">
                                <Tag :severity="getStatusSeverity(slotProps.data.status)"
                                    class="w-8! h-8! p-0! flex items-center justify-center" size="small">
                                    <i :class="getStatusIcon(slotProps.data.status)" class="text-xs"></i>
                                </Tag>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <Divider class="!my-2" />

            <!-- Transport Section -->
            <div class="flex flex-col gap-3 pb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                        <i class="pi pi-car"></i>
                        <span class="font-semibold uppercase tracking-wider text-sm">Transport & Rides</span>
                    </div>
                    <Tag v-if="needsRide.length > 0" severity="warn" :value="`${needsRide.length} needing ride`" size="small" />
                </div>

                <!-- Drivers -->
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
                                        <span>🚗 Vehicle</span>
                                        <span>•</span>
                                        <span :class="getAvailableSeats(driver) > 0 ? 'text-emerald-500' : 'text-red-500'">
                                            {{ getAvailableSeats(driver) }} seats left
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Passengers in this car -->
                        <div class="flex flex-wrap gap-2 pt-1">
                            <div v-for="passenger in getAssignedPassengers(driver.id)" :key="passenger.id" 
                                class="flex items-center gap-2 px-2 py-1 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300/30 dark:border-zinc-700/30 group">
                                <Avatar :image="passenger.profilePicture ? `${baseURL}${passenger.profilePicture}` : undefined"
                                    :label="!passenger.profilePicture ? passenger.username.charAt(0) : undefined" shape="circle" size="small" class="w-4! h-4!" />
                                <span class="text-[10px] font-medium">{{ passenger.username }}</span>
                                <Button v-if="isHost || driver.id === currentUser?.id" icon="pi pi-times" severity="danger" text class="p-0! w-4! h-4! opacity-0 group-hover:opacity-100 transition-opacity" 
                                    @click="assignRide(passenger.id, null)" />
                            </div>
                            <div v-if="getAssignedPassengers(driver.id).length === 0" class="text-[10px] text-zinc-500 italic px-1">
                                No passengers assigned yet
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                    No drivers available for this event yet.
                </div>

                <!-- Needs Ride (Now for both Host and Drivers) -->
                <div v-if="(isHost || drivers.some(d => d.id === currentUser?.id)) && needsRide.length > 0" class="mt-2 flex flex-col gap-2">
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
                                <Button v-for="driver in drivers.filter(d => (isHost || d.id === currentUser?.id) && getAvailableSeats(d) > 0)" :key="driver.id"
                                    :label="isHost && driver.id !== currentUser?.id ? `Add to ${driver.username}` : 'Add to my vehicle'" icon="pi pi-plus" size="small" severity="secondary" outlined 
                                    class="text-[10px]! py-1!" @click="assignRide(passenger.id, driver.id)" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Warning Section -->
                <div v-if="isAldoMoro" class="mt-4 flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-500">
                    <i class="pi pi-exclamation-triangle text-lg"></i>
                    <span class="text-xs font-bold uppercase tracking-widest animate-pulse">Aldo moro detected</span>
                </div>
            </div>

            <!-- Event Settings Section (Host Only) -->
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

        <!-- Edit Mode -->
        <div v-else-if="event && isEditing" class="flex flex-col gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left Column: Basic Info -->
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-2">
                        <label for="edit-title" class="font-bold text-sm uppercase tracking-wider text-zinc-500">Title</label>
                        <InputText id="edit-title" v-model="editTitle" placeholder="Event Title" class="rounded-xl!" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="edit-desc" class="font-bold text-sm uppercase tracking-wider text-zinc-500">Description</label>
                        <Textarea id="edit-desc" v-model="editDescription" rows="4" placeholder="Add a description..." class="rounded-xl!" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="edit-location" class="font-bold text-sm uppercase tracking-wider text-zinc-500">Location</label>
                        <InputText id="edit-location" v-model="editLocation" placeholder="Meeting Room, Online, etc." class="rounded-xl!" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm uppercase tracking-wider text-zinc-500">Start Time</label>
                        <div class="flex gap-2">
                            <DatePicker v-model="editStartDateOnly" class="flex-1 rounded-xl!" placeholder="Date" />
                            <DatePicker v-model="editStartTimeOnly" timeOnly class="w-32 rounded-xl!" placeholder="Time" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label class="font-bold text-sm uppercase tracking-wider text-zinc-500">End Time (Optional)</label>
                        <div class="flex gap-2">
                            <DatePicker v-model="editEndDateOnly" class="flex-1 rounded-xl!" placeholder="Date" />
                            <DatePicker v-model="editEndTimeOnly" timeOnly class="w-32 rounded-xl!" placeholder="Time" />
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 mt-2">
                        <label for="edit-participants" class="font-bold text-sm uppercase tracking-wider text-zinc-500">Invite More People</label>
                        <MultiSelect id="edit-participants" v-model="editSelectedParticipants" :options="allUsers"
                            optionLabel="username" optionValue="id" placeholder="Select Participants" display="chip" filter
                            class="w-full rounded-xl!">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <Avatar
                                        :image="slotProps.option.profilePicture ? `${baseURL}${slotProps.option.profilePicture}` : undefined"
                                        :label="!slotProps.option.profilePicture ? slotProps.option.username.charAt(0) : undefined"
                                        shape="circle" size="small" />
                                    <span>{{ slotProps.option.username }}</span>
                                </div>
                            </template>
                        </MultiSelect>
                    </div>

                    <div class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 mt-2">
                        <div class="flex flex-col gap-1">
                            <label for="edit-isOpen" class="font-bold text-sm uppercase tracking-wider text-zinc-500 cursor-pointer">Open Event</label>
                            <small class="text-zinc-400">Anyone can see and join this event</small>
                        </div>
                        <ToggleSwitch id="edit-isOpen" v-model="editIsOpen" />
                    </div>
                </div>

                <!-- Right Column: Features & Prices -->
                <div class="flex flex-col gap-4">
                    <label class="font-bold text-sm uppercase tracking-wider text-zinc-500">Event Features & Budgets</label>
                    <div class="space-y-3">
                        <div v-for="feature in FEATURES" :key="feature.id"
                            class="flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200"
                            :class="[editSelectedFeatures.includes(feature.id) ? 'bg-zinc-50 dark:bg-zinc-900/50 border-emerald-500/30' : 'border-zinc-200 dark:border-zinc-800']">
                            
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" 
                                        :class="editSelectedFeatures.includes(feature.id) ? feature.color : 'bg-zinc-100 dark:bg-zinc-800 opacity-50'">
                                        {{ feature.icon }}
                                    </div>
                                    <span class="font-bold" :class="editSelectedFeatures.includes(feature.id) ? '' : 'text-zinc-500'">{{ feature.label }}</span>
                                </div>
                                <ToggleSwitch :modelValue="editSelectedFeatures.includes(feature.id)" @update:modelValue="toggleEditFeature(feature.id)" />
                            </div>
                            
                            <div v-if="editSelectedFeatures.includes(feature.id)" class="animate-in fade-in slide-in-from-top-2 duration-300">
                                <div class="flex flex-col gap-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <label class="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Total Budget for {{ feature.label }}</label>
                                    <InputNumber v-model="editFeaturePrices[feature.id]" mode="currency" currency="EUR" locale="de-DE" 
                                        placeholder="0.00" class="w-full" :min="0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end w-full gap-2 pt-2">
                <!-- Footer for Edit Mode -->
                <template v-if="isEditing">
                    <Button label="Cancel" icon="pi pi-times" severity="secondary" text @click="onCancelEdit" :disabled="savingEdit" />
                    <Button label="Save Changes" icon="pi pi-check" severity="success" @click="onSaveEdit" :loading="savingEdit" />
                </template>

                <!-- Footer for View Mode -->
                <template v-else>
                    <template v-if="userParticipantStatus === 'ACCEPTED'">
                        <Button label="Leave" icon="pi pi-times" severity="danger" text :loading="cancelling"
                            @click="onCancelParticipation" />
                        <Button label="Edit Participation" icon="pi pi-pencil" severity="secondary" @click="onEditParticipation" />
                    </template>
                    <template v-else>
                        <Button v-if="userParticipantStatus === 'PENDING'" label="Decline" icon="pi pi-times"
                            severity="danger" text :loading="cancelling" @click="onDecline" />
                        <Button v-if="canAccept" :label="(userParticipantStatus === 'ACCEPTED') ? 'Joined' : 'Join'"
                            icon="pi pi-check" severity="success" :loading="joining"
                            :disabled="userParticipantStatus === 'ACCEPTED'" @click="onAcceptClick" />
                    </template>
                </template>
            </div>
        </template>
    </Dialog>

    <FeatureSelectionDialog v-model:visible="showFeatureSelection" :availableFeatures="availableFeatureIds"
        :initialFeatures="currentUser ? getParticipantFeatures(currentUser.id) : []"
        :initialHasVehicle="props.event?.participants?.find(p => p.id === currentUser?.id)?.hasVehicle || false"
        :initialVehicleSeats="props.event?.participants?.find(p => p.id === currentUser?.id)?.vehicleSeats || 0"
        :submitLabel="userParticipantStatus === 'ACCEPTED' ? 'Save Changes' : 'Join Event'"
        :featurePrices="eventPrices"
        :featureSplitPrices="eventSplitPrices"
        @confirm="handleFeatureConfirm" />

    <Dialog v-model:visible="showLeaveConfirmation" modal header="Confirm" :style="{ width: '350px' }"
        :breakpoints="{ '640px': '90vw' }" dismissableMask :draggable="false">
        <div class="flex flex-col items-center gap-4 pt-2">
            <p class="text-center m-0">Are you sure you want to leave this event? You will need to join again to
                participate.</p>
        </div>
        <template #footer>
            <div class="flex justify-end gap-2 w-full">
                <Button label="No" severity="secondary" text @click="showLeaveConfirmation = false" />
                <Button label="Yes, Leave" severity="danger" @click="confirmLeave" />
            </div>
        </template>
    </Dialog>
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
