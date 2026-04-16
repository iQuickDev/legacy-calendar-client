import { ref, computed, watch } from 'vue';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO
} from 'date-fns';
import type { CalendarDay, CalendarVisibleRange } from '../types/Calendar';
import type { CreateEventDto, Event, ParticipateDto } from '../types/Event';
import { useEventsStore } from '../stores/events';

export function useCalendar() {
    const currentDate = ref(new Date());
    const eventsStore = useEventsStore();

    const events = computed<Event[]>(() => eventsStore.events);

    const buildMonthKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const buildVisibleRange = (date: Date): CalendarVisibleRange => {
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(monthStart);

        return {
            monthKey: buildMonthKey(date),
            start: startOfWeek(monthStart, { weekStartsOn: 1 }),
            end: endOfWeek(monthEnd, { weekStartsOn: 1 })
        };
    };

    const visibleMonthKey = computed(() => {
        return buildMonthKey(currentDate.value);
    });

    const visibleRange = computed<CalendarVisibleRange>(() => {
        return buildVisibleRange(currentDate.value);
    });

    const prefetchRange = async (date: Date) => {
        const range = buildVisibleRange(date);
        await eventsStore.prefetchCalendarEvents(range);
    };

    const refreshVisibleRange = async () => {
        await eventsStore.fetchCalendarEvents(visibleRange.value, { refresh: true, applyToVisible: true });
    };

    const prefetchNextMonth = async () => {
        await prefetchRange(addMonths(currentDate.value, 1));
    };

    const prefetchPrevMonth = async () => {
        await prefetchRange(subMonths(currentDate.value, 1));
    };

    const prefetchTodayMonth = async () => {
        await prefetchRange(new Date());
    };

    const goToToday = async () => {
        const today = new Date();
        const isSameMonth = buildMonthKey(today) === visibleMonthKey.value;

        currentDate.value = today;

        if (isSameMonth) {
            await refreshVisibleRange();
        }
    };

    const days = computed<CalendarDay[]>(() => {
        const monthStart = startOfMonth(currentDate.value);
        const monthEnd = endOfMonth(monthStart);

        // startOfWeek with weekStartsOn: 1 (Monday)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        return dates.map((date) => {
            const dayEvents = events.value.filter((e) => {
                const eventDate = parseISO(e.startTime);
                return isSameDay(eventDate, date);
            });

            return {
                date,
                isCurrentMonth: isSameMonth(date, monthStart),
                isToday: isToday(date),
                events: dayEvents
            };
        });
    });

    watch(
        visibleMonthKey,
        async () => {
            await refreshVisibleRange();
        },
        { immediate: true }
    );

    const nextMonth = () => {
        currentDate.value = addMonths(currentDate.value, 1);
    };

    const prevMonth = () => {
        currentDate.value = subMonths(currentDate.value, 1);
    };

    const fetchEvents = async () => {
        await refreshVisibleRange();
    };

    const addEvent = async (dto: CreateEventDto) => {
        return await eventsStore.createEvent(dto);
    };

    const deleteEvent = async (id: number) => {
        return await eventsStore.deleteEvent(id);
    };

    const joinEvent = async (id: number, dto?: ParticipateDto) => {
        return await eventsStore.joinEvent(id, dto);
    };

    return {
        currentDate,
        days,
        events,
        loading: computed(() => eventsStore.loading),
        error: computed(() => eventsStore.error),
        nextMonth,
        prevMonth,
        goToToday,
        prefetchNextMonth,
        prefetchPrevMonth,
        prefetchTodayMonth,
        fetchEvents,
        addEvent,
        deleteEvent,
        joinEvent
    };
}
