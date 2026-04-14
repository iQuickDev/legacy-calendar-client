import { defineStore } from 'pinia';
import { useAPIStore } from './api';
import type { CreateEventDto, Event, ParticipateDto } from '../types/Event';

export interface EventsState {
    events: Event[];
    loading: boolean;
    error: string | null;
}

async function runEventsAction<T>(
    store: EventsState,
    errorMessage: string,
    action: () => Promise<T>
): Promise<T | false> {
    store.loading = true;
    store.error = null;
    try {
        return await action();
    } catch (err: any) {
        store.error = err.response?.data?.message || errorMessage;
        console.error(errorMessage, err);
        return false;
    } finally {
        store.loading = false;
    }
}

export const useEventsStore = defineStore('events', {
    state: (): EventsState => ({
        events: [],
        loading: false,
        error: null
    }),

    getters: {
        getEventsByDate: (state) => {
            return (date: Date) => {
                const targetDate = new Date(date);
                targetDate.setHours(0, 0, 0, 0);

                return state.events.filter((event) => {
                    const eventDate = new Date(event.startTime);
                    eventDate.setHours(0, 0, 0, 0);
                    return eventDate.getTime() === targetDate.getTime();
                });
            };
        },
        getEventById: (state) => {
            return (id: number) => state.events.find((event) => event.id === id);
        }
    },

    actions: {
        async fetchEvents() {
            const result = await runEventsAction(this, 'Failed to load events', async () => {
                const { client } = useAPIStore();
                const response = await client.findAllEvents();
                this.events = response.data;
                return true;
            });
            return result !== false;
        },

        async createEvent(dto: CreateEventDto) {
            const result = await runEventsAction(this, 'Failed to create event', async () => {
                const { client } = useAPIStore();
                await client.createEvent(dto);
                await this.fetchEvents();
                return true;
            });
            return result !== false;
        },

        async updateEvent(id: number, dto: Partial<CreateEventDto>) {
            const result = await runEventsAction(this, 'Failed to update event', async () => {
                const { client } = useAPIStore();
                await client.updateEvent(id, dto);
                await this.fetchEvents();
                return true;
            });
            return result !== false;
        },

        async deleteEvent(id: number) {
            const result = await runEventsAction(this, 'Failed to delete event', async () => {
                const { client } = useAPIStore();
                await client.deleteEvent(id);
                this.events = this.events.filter((event) => event.id !== id);
                return true;
            });
            return result !== false;
        },

        async joinEvent(id: number, dto?: ParticipateDto) {
            const result = await runEventsAction(this, 'Failed to join event', async () => {
                const { client } = useAPIStore();
                await client.joinEvent(id, dto);
                await this.fetchEvents();
                return true;
            });
            return result !== false;
        },

        async leaveEvent(id: number) {
            const result = await runEventsAction(this, 'Failed to leave event', async () => {
                const { client } = useAPIStore();
                await client.leaveEvent(id);
                await this.fetchEvents();
                return true;
            });
            return result !== false;
        },

        async assignRide(eventId: number, passengerId: number, driverId: number | null) {
            const result = await runEventsAction(this, 'Failed to assign ride', async () => {
                const { client } = useAPIStore();
                await client.assignRide(eventId, passengerId, driverId);
                await this.fetchEvents();
                return true;
            });
            return result !== false;
        },

        clearError() {
            this.error = null;
        }
    }
});
