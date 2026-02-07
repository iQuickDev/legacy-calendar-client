export interface CalendarEvent {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    hostId?: number;
    host?: { id: number; username: string; profilePicture?: string };
    participants?: { id: number; username: string; status: string; profilePicture?: string }[];
    isOpen: boolean;
}

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
}

