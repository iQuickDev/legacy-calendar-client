// Aligned with API Event interface
export interface CalendarEvent {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    hostId?: string;
    participants?: string[]; // List of participant IDs
}

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}

