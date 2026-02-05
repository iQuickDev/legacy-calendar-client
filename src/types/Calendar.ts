export interface CalendarEvent {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    hostId?: number;
    host?: { id: number; username: string; image?: string };
    participants?: { id: number; username: string; status: string; image?: string }[];
    isOpen: boolean;
}

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}

