<script setup lang="ts">
import type { Event, EventPersonSummary } from '../../../types/Event';
import Tag from 'primevue/tag';
import UserAvatar from '../../UserAvatar.vue';
import { formatCurrency } from '../../../utils/format';

defineProps<{
    event: Event;
    eventHost: EventPersonSummary | null;
    eventTotalBudget: number;
    isDeadlinePassed: boolean;
    isEnded: boolean;
}>();
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div class="flex flex-1 flex-col gap-1">
                <h2 class="m-0 text-xl font-bold uppercase sm:text-2xl">{{ event.title }}</h2>
                <div class="flex flex-wrap items-center gap-2">
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
                    <Tag
                        v-if="isDeadlinePassed"
                        severity="warn"
                        value="Participation Closed"
                        icon="pi pi-lock"
                        class="border-orange-500/20 bg-orange-500/10 text-[10px]! text-orange-500"
                    />
                    <Tag
                        v-if="isEnded"
                        severity="danger"
                        value="Event Ended"
                        icon="pi pi-history"
                        class="border-red-500/20 bg-red-500/10 text-[10px]! text-red-500"
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
                    {{ formatCurrency(eventTotalBudget) }}
                </span>
            </div>
        </div>

        <div v-if="eventHost" class="flex items-center gap-2">
            <UserAvatar :profilePicture="eventHost.profilePicture" :username="eventHost.username" />
            <span class="text-surface-600 dark:text-surface-400">
                Hosted by
                <span class="text-surface-900 dark:text-surface-0 font-semibold">{{ eventHost.username }}</span>
            </span>
        </div>
    </div>
</template>
