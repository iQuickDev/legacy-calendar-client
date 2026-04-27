import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/API';
import type { CalendarVisibleRange } from '../types/Calendar';
import type { CreateEventDto, Event, ParticipateDto } from '../types/Event';

const monthRequestCache = new Map<string, Promise<Event[]>>();
const visibleLoadSequence = new Map<string, number>();

export const useEventsStore = defineStore('events', () => {
    const events = ref<Event[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const activeRange = ref<CalendarVisibleRange | null>(null);
    const rangeCache = ref<Record<string, Event[]>>({});
    const pendingRequests = ref(0);

    // --- Helpers ---

    async function runEventsAction<T>(
        errorMessage: string,
        action: () => Promise<T>,
        options: { trackLoading?: boolean; clearError?: boolean; logError?: boolean } = {}
    ): Promise<T | false> {
        const { trackLoading = true, clearError = true, logError = true } = options;

        if (trackLoading) {
            pendingRequests.value += 1;
            loading.value = true;
        }

        if (clearError) {
            error.value = null;
        }

        try {
            return await action();
        } catch (err: any) {
            if (logError) {
                error.value = err.response?.data?.message || errorMessage;
                console.error(errorMessage, err);
            }
            return false;
        } finally {
            if (trackLoading) {
                pendingRequests.value = Math.max(0, pendingRequests.value - 1);
                loading.value = pendingRequests.value > 0;
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
            const response = await api.findCalendarEvents(range);
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

    function storeVisibleEvents(rangeKey: string, eventsList: Event[], applyToVisible: boolean) {
        const nextEvents = [...eventsList];
        rangeCache.value[rangeKey] = nextEvents;

        if (applyToVisible && activeRange.value?.monthKey === rangeKey) {
            events.value = nextEvents;
        }
    }

    async function loadAndStoreCalendarEvents(
        range: CalendarVisibleRange,
        applyToVisible: boolean,
        dedupe: boolean,
        errorMessage: string
    ): Promise<boolean> {
        const rangeKey = range.monthKey;
        const requestId = applyToVisible ? (visibleLoadSequence.get(rangeKey) ?? 0) + 1 : 0;

        if (applyToVisible) {
            visibleLoadSequence.set(rangeKey, requestId);
            activeRange.value = cloneRange(range);

            const cachedEvents = rangeCache.value[rangeKey];
            if (cachedEvents) {
                events.value = [...cachedEvents];
            }
        }

        const result = await runEventsAction(
            errorMessage,
            async () => {
                const fetchedEvents = await loadCalendarEvents(range, dedupe);

                if (applyToVisible) {
                    const latestVisibleRequest = visibleLoadSequence.get(rangeKey);
                    if (latestVisibleRequest !== requestId || activeRange.value?.monthKey !== rangeKey) {
                        return true;
                    }
                }

                storeVisibleEvents(rangeKey, fetchedEvents, applyToVisible);
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

    function hasCachedOrActiveMonth(range: CalendarVisibleRange) {
        return rangeCache.value[range.monthKey] !== undefined || areSameMonthRange(activeRange.value, range);
    }

    // --- Getters ---

    const getEventsByDate = computed(() => {
        return (date: Date) => {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);

            return events.value.filter((event) => {
                const eventDate = new Date(event.startTime);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === targetDate.getTime();
            });
        };
    });

    const getEventById = computed(() => {
        return (id: number) => events.value.find((event) => event.id === id);
    });

    // --- Actions ---

    async function fetchEvents() {
        return refreshActiveRange();
    }

    async function fetchCalendarEvents(
        range: CalendarVisibleRange,
        options: { refresh?: boolean; applyToVisible?: boolean } = {}
    ) {
        const { refresh = true, applyToVisible = true } = options;
        const rangeKey = range.monthKey;

        if (applyToVisible && !refresh && rangeCache.value[rangeKey]) {
            activeRange.value = cloneRange(range);
            events.value = [...rangeCache.value[rangeKey]];
            return true;
        }

        const dedupe = monthRequestCache.has(rangeKey);
        return loadAndStoreCalendarEvents(range, applyToVisible, dedupe, 'Failed to load events');
    }

    async function refreshActiveRange() {
        if (!activeRange.value) {
            return false;
        }

        return fetchCalendarEvents(activeRange.value, { refresh: true, applyToVisible: true });
    }

    async function prefetchCalendarEvents(range: CalendarVisibleRange) {
        if (hasCachedOrActiveMonth(range)) {
            return true;
        }

        const result = await runEventsAction(
            'Failed to prefetch events',
            async () => {
                const fetchedEvents = await loadCalendarEvents(range, true);

                if (activeRange.value?.monthKey !== range.monthKey) {
                    storeVisibleEvents(range.monthKey, fetchedEvents, false);
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
    }

    async function fetchEventById(id: number) {
        const result = await runEventsAction(`Failed to load event ${id}`, async () => {
            const response = await api.findOneEvent(id);
            const index = events.value.findIndex((e) => e.id === id);
            if (index !== -1) {
                events.value[index] = response.data;
            } else {
                events.value.push(response.data);
            }
            return true;
        });
        return result !== false;
    }

    async function createEvent(dto: CreateEventDto) {
        const result = await runEventsAction('Failed to create event', async () => {
            await api.createEvent(dto);
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    async function updateEvent(id: number, dto: Partial<CreateEventDto>) {
        const result = await runEventsAction('Failed to update event', async () => {
            await api.updateEvent(id, dto);
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    async function deleteEvent(id: number) {
        const result = await runEventsAction('Failed to delete event', async () => {
            await api.deleteEvent(id);
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    async function joinEvent(id: number, dto?: ParticipateDto) {
        const result = await runEventsAction('Failed to join event', async () => {
            await api.joinEvent(id, dto);
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    async function leaveEvent(id: number) {
        const result = await runEventsAction('Failed to leave event', async () => {
            await api.leaveEvent(id);
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    async function assignRide(eventId: number, passengerId: number, driverId: number | null) {
        const result = await runEventsAction('Failed to assign ride', async () => {
            await api.assignRide(eventId, passengerId, driverId);
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    async function assignRidesBatch(eventId: number, passengerIds: number[], driverId: number | null) {
        const result = await runEventsAction('Failed to assign rides', async () => {
            await Promise.all(passengerIds.map((id) => api.assignRide(eventId, id, driverId)));
            return true;
        });
        if (result !== false) {
            await refreshActiveRange();
        }
        return result !== false;
    }

    function clearError() {
        error.value = null;
    }

    return {
        events,
        loading,
        error,
        activeRange,
        rangeCache,
        pendingRequests,
        getEventsByDate,
        getEventById,
        fetchEvents,
        fetchCalendarEvents,
        refreshActiveRange,
        prefetchCalendarEvents,
        fetchEventById,
        createEvent,
        updateEvent,
        deleteEvent,
        joinEvent,
        leaveEvent,
        assignRide,
        assignRidesBatch,
        clearError
    };
});
