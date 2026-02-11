export interface CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    participants?: number[];
    isOpen: boolean;
}

export interface Event {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    hostId?: number;
    host?: { id: number; username: string; profilePicture?: string };
    participants?: { id: number; username: string; status: string; profilePicture?: string }[];
    isOpen: boolean;
    [key: string]: any;
}
