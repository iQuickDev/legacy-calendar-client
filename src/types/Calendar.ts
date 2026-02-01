export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    participants: string[]; // List of names or IDs
}

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}
