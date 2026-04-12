import { ref, computed } from 'vue';
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
import type { CalendarDay } from '../types/Calendar';
import type { CreateEventDto, Event, ParticipateDto } from '../types/Event';
import { useEventsStore } from '../stores/events';

export function useCalendar() {
    const currentDate = ref(new Date());
    const eventsStore = useEventsStore();

    const events = computed<Event[]>(() => eventsStore.events);

    const days = computed<CalendarDay[]>(() => {
        const monthStart = startOfMonth(currentDate.value);
        const monthEnd = endOfMonth(monthStart);

        // startOfWeek with weekStartsOn: 1 (Monday)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        return dates.map(date => {
            const dayEvents = events.value.filter(e => {
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

    const nextMonth = () => {
        currentDate.value = addMonths(currentDate.value, 1);
    };

    const prevMonth = () => {
        currentDate.value = subMonths(currentDate.value, 1);
    };

    const fetchEvents = async () => {
        await eventsStore.fetchEvents();
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
        fetchEvents,
        addEvent,
        deleteEvent,
        joinEvent,
    };
}

