<script setup lang="ts">
import type { EventParticipant, EventFeature } from '../../../types/Event';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import UserAvatar from '../../UserAvatar.vue';

defineProps<{
    resolvedInvitees: EventParticipant[];
    featuresListColumns: { field: EventFeature; header: string; icon: string }[];
    getFeatureCount: (feature: EventFeature) => number;
    hasFeature: (userId: number, feature: EventFeature) => boolean;
    getStatusSeverity: (status: string) => string;
    getStatusIcon: (status: string) => string;
}>();
</script>

<template>
    <div class="flex flex-col gap-3">
        <div class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
            <i class="pi pi-users"></i>
            <span class="font-semibold">Participants ({{ resolvedInvitees.length }})</span>
        </div>

        <DataTable
            :value="resolvedInvitees"
            scrollable
            sortMode="multiple"
            :multiSortMeta="[
                { field: 'status', order: 1 },
                { field: 'username', order: 1 }
            ]"
        >
            <template #empty>
                <div class="text-surface-500 p-4 text-center">No invitees found</div>
            </template>
            <Column field="username" header="Name" sortable>
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <UserAvatar
                            :profilePicture="slotProps.data.profilePicture"
                            :username="slotProps.data.username"
                            class="h-8! w-8! lg:h-10! lg:w-10!"
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
                    <span class="w-full text-center font-bold whitespace-nowrap sm:hidden" :title="col.header">
                        {{ col.icon }}
                    </span>
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
            <Column field="status" header="Status" class="w-16 text-center sm:w-24" sortable>
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
</template>
