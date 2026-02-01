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
    addHours
} from 'date-fns';
import type { CalendarDay, CalendarEvent } from '../types/Calendar';

export function useCalendar() {
    const currentDate = ref(new Date());

    // Mock events state
    const events = ref<CalendarEvent[]>([
        {
            id: '1',
            title: 'Team Meeting',
            description: 'Weekly sync',
            location: 'Conference Room A',
            startDate: new Date(),
            endDate: addHours(new Date(), 1),
            participants: ['Alice', 'Bob']
        }
    ]);

    const days = computed<CalendarDay[]>(() => {
        const monthStart = startOfMonth(currentDate.value);
        const monthEnd = endOfMonth(monthStart);

        // startOfWeek with weekStartsOn: 1 (Monday)
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const dates = eachDayOfInterval({ start: startDate, end: endDate });

        return dates.map(date => {
            const dayEvents = events.value.filter(e => isSameDay(e.startDate, date));

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

    const addEvent = (event: CalendarEvent) => {
        events.value.push(event);
    };

    const updateEvent = (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
        const index = events.value.findIndex(e => e.id === id);
        if (index !== -1) {
            events.value[index] = { ...events.value[index], ...updates } as CalendarEvent;
        }
    };

    const deleteEvent = (id: string) => {
        events.value = events.value.filter(e => e.id !== id);
    };

    return {
        currentDate,
        days,
        events,
        nextMonth,
        prevMonth,
        addEvent,
        updateEvent,
        deleteEvent
    };
}
