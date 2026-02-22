export interface CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime?: string;
    participants?: number[];
    isOpen: boolean;
    hasFood?: boolean;
    hasWeed?: boolean;
    hasSleep?: boolean;
    hasAlcohol?: boolean;
}

export interface Event {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime?: string;
    hostId?: number;
    host?: { id: number; username: string; profilePicture?: string };
    participants?: {
        id: number;
        username: string;
        status: string;
        profilePicture?: string;
        wantsFood?: boolean;
        wantsWeed?: boolean;
        wantsSleep?: boolean;
        wantsAlcohol?: boolean;
    }[];
    isOpen: boolean;
    hasFood?: boolean;
    hasWeed?: boolean;
    hasSleep?: boolean;
    hasAlcohol?: boolean;
    [key: string]: any;
}

export type EventFeature = 'FOOD' | 'WEED' | 'ALCOHOL' | 'SLEEP';

export interface ParticipateDto {
    wantsFood?: boolean;
    wantsWeed?: boolean;
    wantsSleep?: boolean;
    wantsAlcohol?: boolean;
}

