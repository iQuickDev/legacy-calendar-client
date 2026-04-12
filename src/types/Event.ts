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
    hasBeer?: boolean;
    hasGas?: boolean;
    foodPrice?: number;
    weedPrice?: number;
    sleepPrice?: number;
    alcoholPrice?: number;
    beerPrice?: number;
    gasPrice?: number;
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
        wantsBeer?: boolean;
        wantsGas?: boolean;
        hasVehicle?: boolean;
        vehicleType?: string;
        vehicleSeats?: number;
        driverId?: number;
        driver?: { id: number; username: string; profilePicture?: string };
    }[];
    isOpen: boolean;
    hasFood?: boolean;
    hasWeed?: boolean;
    hasSleep?: boolean;
    hasAlcohol?: boolean;
    hasBeer?: boolean;
    hasGas?: boolean;
    foodPrice?: number;
    weedPrice?: number;
    sleepPrice?: number;
    alcoholPrice?: number;
    beerPrice?: number;
    gasPrice?: number;
    [key: string]: any;
}

export type EventFeature = 'FOOD' | 'WEED' | 'ALCOHOL' | 'SLEEP' | 'BEER' | 'GAS';

export interface ParticipateDto {
    wantsFood?: boolean;
    wantsWeed?: boolean;
    wantsSleep?: boolean;
    wantsAlcohol?: boolean;
    wantsBeer?: boolean;
    wantsGas?: boolean;
    hasVehicle?: boolean;
    vehicleType?: string;
    vehicleSeats?: number;
}

