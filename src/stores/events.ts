import { defineStore } from 'pinia';
import { useAPIStore } from './api';
import type { CalendarVisibleRange } from '../types/Calendar';
import type { CreateEventDto, Event, ParticipateDto } from '../types/Event';

const monthRequestCache = new Map<string, Promise<Event[]>>();
const visibleLoadSequence = new Map<string, number>();

export interface EventsState {
    events: Event[];
    loading: boolean;
    error: string | null;
    activeRange: CalendarVisibleRange | null;
    rangeCache: Record<string, Event[]>;
    pendingRequests: number;
}

async function runEventsAction<T>(
    store: EventsState,
    errorMessage: string,
    action: () => Promise<T>,
    options: { trackLoading?: boolean; clearError?: boolean; logError?: boolean } = {}
): Promise<T | false> {
    const { trackLoading = true, clearError = true, logError = true } = options;

    if (trackLoading) {
        store.pendingRequests += 1;
        store.loading = true;
    }

    if (clearError) {
        store.error = null;
    }

    try {
        return await action();
    } catch (err: any) {
        if (logError) {
            store.error = err.response?.data?.message || errorMessage;
            console.error(errorMessage, err);
        }
        return false;
    } finally {
        if (trackLoading) {
            store.pendingRequests = Math.max(0, store.pendingRequests - 1);
            store.loading = store.pendingRequests > 0;
        }
    }
}

async function loadCalendarEvents(range: CalendarVisibleRange, dedupe = false): Promise<Event[]> {
    const rangeKey = range.monthKey;

    if (dedupe) {
        const inFlightRequest = monthRequestCache.get(rangeKey);
        if (inFlightRequest) {
            return inFlightRequest;
        }
    }

    const request = (async () => {
        const { client } = useAPIStore();
        const response = await client.findCalendarEvents(range);
        return response.data;
    })();

    if (dedupe) {
        monthRequestCache.set(rangeKey, request);
    }

    try {
        return await request;
    } finally {
        if (dedupe) {
            monthRequestCache.delete(rangeKey);
        }
    }
}

function storeVisibleEvents(store: EventsState, rangeKey: string, events: Event[], applyToVisible: boolean) {
    const nextEvents = [...events];
    store.rangeCache[rangeKey] = nextEvents;

    if (applyToVisible && store.activeRange?.monthKey === rangeKey) {
        store.events = nextEvents;
    }
}

async function loadAndStoreCalendarEvents(
    store: EventsState,
    range: CalendarVisibleRange,
    applyToVisible: boolean,
    dedupe: boolean,
    errorMessage: string
): Promise<boolean> {
    const rangeKey = range.monthKey;
    const requestId = applyToVisible ? (visibleLoadSequence.get(rangeKey) ?? 0) + 1 : 0;

    if (applyToVisible) {
        visibleLoadSequence.set(rangeKey, requestId);
        store.activeRange = cloneRange(range);

        const cachedEvents = store.rangeCache[rangeKey];
        if (cachedEvents) {
            store.events = [...cachedEvents];
        }
    }

    const result = await runEventsAction(
        store,
        errorMessage,
        async () => {
            const events = await loadCalendarEvents(range, dedupe);

            if (applyToVisible) {
                const latestVisibleRequest = visibleLoadSequence.get(rangeKey);
                if (latestVisibleRequest !== requestId || store.activeRange?.monthKey !== rangeKey) {
                    return true;
                }
            }

            storeVisibleEvents(store, rangeKey, events, applyToVisible);
            return true;
        },
        {
            trackLoading: applyToVisible,
            clearError: applyToVisible,
            logError: applyToVisible
        }
    );

    return result !== false;
}

function cloneRange(range: CalendarVisibleRange): CalendarVisibleRange {
    return {
        monthKey: range.monthKey,
        start: new Date(range.start),
        end: new Date(range.end)
    };
}

function areSameMonthRange(a: CalendarVisibleRange | null, b: CalendarVisibleRange) {
    return a?.monthKey === b.monthKey;
}

function hasCachedOrActiveMonth(store: EventsState, range: CalendarVisibleRange) {
    return store.rangeCache[range.monthKey] !== undefined || areSameMonthRange(store.activeRange, range);
}

export const useEventsStore = defineStore('events', {
    state: (): EventsState => ({
        events: [],
        loading: false,
        error: null,
        activeRange: null,
        rangeCache: {},
        pendingRequests: 0
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
            return this.refreshActiveRange();
        },

        async fetchCalendarEvents(
            range: CalendarVisibleRange,
            options: { refresh?: boolean; applyToVisible?: boolean } = {}
        ) {
            const { refresh = true, applyToVisible = true } = options;
            const rangeKey = range.monthKey;

            if (applyToVisible && !refresh && this.rangeCache[rangeKey]) {
                this.activeRange = cloneRange(range);
                this.events = [...this.rangeCache[rangeKey]];
                return true;
            }

            const dedupe = monthRequestCache.has(rangeKey);
            return loadAndStoreCalendarEvents(this, range, applyToVisible, dedupe, 'Failed to load events');
        },

        async refreshActiveRange() {
            if (!this.activeRange) {
                return false;
            }

            return this.fetchCalendarEvents(this.activeRange, { refresh: true, applyToVisible: true });
        },

        async prefetchCalendarEvents(range: CalendarVisibleRange) {
            if (hasCachedOrActiveMonth(this, range)) {
                return true;
            }

            const result = await runEventsAction(
                this,
                'Failed to prefetch events',
                async () => {
                    const events = await loadCalendarEvents(range, true);

                    if (this.activeRange?.monthKey !== range.monthKey) {
                        storeVisibleEvents(this, range.monthKey, events, false);
                    }

                    return true;
                },
                {
                    trackLoading: false,
                    clearError: false,
                    logError: false
                }
            );

            return result !== false;
        },

        async fetchEventById(id: number) {
            const result = await runEventsAction(this, `Failed to load event ${id}`, async () => {
                const { client } = useAPIStore();
                const response = await client.findOneEvent(id);
                const index = this.events.findIndex((e) => e.id === id);
                if (index !== -1) {
                    this.events[index] = response.data;
                } else {
                    this.events.push(response.data);
                }
                return true;
            });
            return result !== false;
        },

        async createEvent(dto: CreateEventDto) {
            const result = await runEventsAction(this, 'Failed to create event', async () => {
                const { client } = useAPIStore();
                await client.createEvent(dto);
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        async updateEvent(id: number, dto: Partial<CreateEventDto>) {
            const result = await runEventsAction(this, 'Failed to update event', async () => {
                const { client } = useAPIStore();
                await client.updateEvent(id, dto);
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        async deleteEvent(id: number) {
            const result = await runEventsAction(this, 'Failed to delete event', async () => {
                const { client } = useAPIStore();
                await client.deleteEvent(id);
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        async joinEvent(id: number, dto?: ParticipateDto) {
            const result = await runEventsAction(this, 'Failed to join event', async () => {
                const { client } = useAPIStore();
                await client.joinEvent(id, dto);
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        async leaveEvent(id: number) {
            const result = await runEventsAction(this, 'Failed to leave event', async () => {
                const { client } = useAPIStore();
                await client.leaveEvent(id);
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        async assignRide(eventId: number, passengerId: number, driverId: number | null) {
            const result = await runEventsAction(this, 'Failed to assign ride', async () => {
                const { client } = useAPIStore();
                await client.assignRide(eventId, passengerId, driverId);
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        async assignRidesBatch(eventId: number, passengerIds: number[], driverId: number | null) {
            const result = await runEventsAction(this, 'Failed to assign rides', async () => {
                const { client } = useAPIStore();
                await Promise.all(passengerIds.map((id) => client.assignRide(eventId, id, driverId)));
                return true;
            });
            if (result !== false) {
                await this.refreshActiveRange();
            }
            return result !== false;
        },

        clearError() {
            this.error = null;
        }
    }
});
