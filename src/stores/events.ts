import { defineStore } from 'pinia'
import { useAPIStore } from './api'
import type { Event, CreateEventDto } from '../types/Event'

export interface EventsState {
    events: Event[];
    loading: boolean;
    error: string | null;
}

export const useEventsStore = defineStore('events', {
    state: (): EventsState => ({
        events: [],
        loading: false,
        error: null,
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
        },
    },

    actions: {
        async fetchEvents() {
            this.loading = true;
            this.error = null;
            try {
                const { client } = useAPIStore();
                const response = await client.findAllEvents();
                this.events = response.data;
            } catch (err: any) {
                this.error = err.response?.data?.message || 'Failed to load events';
                console.error('Failed to fetch events:', err);
            } finally {
                this.loading = false;
            }
        },

        async createEvent(dto: CreateEventDto) {
            this.loading = true;
            this.error = null;
            try {
                const { client } = useAPIStore();
                await client.createEvent(dto);
                // Refresh events list to get the new event with its ID
                await this.fetchEvents();
                return true;
            } catch (err: any) {
                this.error = err.response?.data?.message || 'Failed to create event';
                console.error('Failed to create event:', err);
                return false;
            } finally {
                this.loading = false;
            }
        },

        async deleteEvent(id: number) {
            this.loading = true;
            this.error = null;
            try {
                const { client } = useAPIStore();
                await client.deleteEvent(id);
                // Remove from local state
                this.events = this.events.filter((event) => event.id !== id);
                return true;
            } catch (err: any) {
                this.error = err.response?.data?.message || 'Failed to delete event';
                console.error('Failed to delete event:', err);
                return false;
            } finally {
                this.loading = false;
            }
        },

        async joinEvent(id: number, dto?: any) { // using any to avoid circular dependency or import issues for now, or import ParticipateDto if easy
            this.loading = true;
            this.error = null;
            try {
                const { client } = useAPIStore();
                await client.joinEvent(id, dto);
                // Refresh to get updated event data
                await this.fetchEvents();
                return true;
            } catch (err: any) {
                this.error = err.response?.data?.message || 'Failed to join event';
                console.error('Failed to join event:', err);
                return false;
            } finally {
                this.loading = false;
            }
        },

        async leaveEvent(id: number) {
            this.loading = true;
            this.error = null;
            try {
                const { client } = useAPIStore();
                await client.leaveEvent(id);
                // Refresh to get updated event data
                await this.fetchEvents();
                return true;
            } catch (err: any) {
                this.error = err.response?.data?.message || 'Failed to leave event';
                console.error('Failed to leave event:', err);
                return false;
            } finally {
                this.loading = false;
            }
        },

        clearError() {
            this.error = null;
        },
    },
});
