import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

export const baseURL = import.meta.env.VITE_API_URL

// --- Interfaces ---

export interface CreateUserDto {
    username: string;
    password: string;
}

export interface UpdateUserDto {
    [key: string]: any;
}

export interface AuthLoginDto {
    username: string;
    password: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

export interface CreateEventDto {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    participants?: number[];
    isOpen: boolean;
}

export interface User {
    id: number;
    username: string;
    profilePicture?: string;
    [key: string]: any;
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

// --- API Class ---

class API {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }

                const bypassToken = localStorage.getItem('bypass_token');
                if (bypassToken && config.headers) {
                    config.headers['X-Bypass'] = bypassToken;
                }

                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    // --- Auth ---

    async login(dto: AuthLoginDto): Promise<AxiosResponse<{ access_token: string }>> {
        return this.client.post('/auth/login', dto);
    }

    async getProfile(): Promise<AxiosResponse<User>> {
        // Note: Spec defines this as POST /auth/profile
        return this.client.post('/auth/profile');
    }

    async changePassword(dto: ChangePasswordDto): Promise<AxiosResponse<void>> {
        return this.client.post('/auth/change-password', dto);
    }

    // --- Users ---

    async findAllUsers(): Promise<AxiosResponse<User[]>> {
        return this.client.get('/users');
    }

    async findOneUser(id: number): Promise<AxiosResponse<User>> {
        return this.client.get(`/users/${id}`);
    }

    async createUser(dto: CreateUserDto): Promise<AxiosResponse<void>> {
        return this.client.post('/users', dto);
    }

    async updateUser(id: number, dto: UpdateUserDto): Promise<AxiosResponse<void>> {
        return this.client.patch(`/users/${id}`, dto);
    }

    async removeUser(id: number): Promise<AxiosResponse<void>> {
        return this.client.delete(`/users/${id}`);
    }

    // --- Events ---

    async findAllEvents(): Promise<AxiosResponse<Event[]>> {
        return this.client.get('/events');
    }

    async findOneEvent(id: number): Promise<AxiosResponse<Event>> {
        return this.client.get(`/events/${id}`);
    }

    async createEvent(dto: CreateEventDto): Promise<AxiosResponse<void>> {
        return this.client.post('/events', dto);
    }

    async deleteEvent(id: number): Promise<AxiosResponse<void>> {
        return this.client.delete(`/events/${id}`);
    }

    async joinEvent(id: number): Promise<AxiosResponse<void>> {
        return this.client.post(`/events/${id}/join`);
    }

    // --- Notifications ---

    async subscribeNotifications(token: string): Promise<AxiosResponse<void>> {
        return this.client.post('/notifications/subscribe', { token });
    }

    // --- Profile Picture ---

    async uploadProfilePicture(file: File): Promise<AxiosResponse<User>> {
        const formData = new FormData();
        formData.append('file', file);
        return this.client.post('/users/profile-picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    async removeProfilePicture(): Promise<AxiosResponse<void>> {
        return this.client.delete('/users/profile-picture');
    }
}

export default new API();