import { ref } from 'vue';
import api from '../services/API';
import type { User, CreateUserDto, UpdateUserDto } from '../types/User';

// Shared state for caching
const cachedUsers = ref<User[]>([]);
const lastFetchTime = ref<number | null>(null);
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export function useUsers() {
    const loading = ref(false);
    const error = ref<string | null>(null);

    async function fetchUsers(force = false) {
        // Return cached users if not force and cache is valid
        if (
            !force &&
            cachedUsers.value.length > 0 &&
            lastFetchTime.value &&
            Date.now() - lastFetchTime.value < CACHE_DURATION
        ) {
            return cachedUsers.value;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await api.findAllUsers();
            cachedUsers.value = response.data;
            lastFetchTime.value = Date.now();
            return cachedUsers.value;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch users';
            console.error('Failed to fetch users:', err);
            return [];
        } finally {
            loading.value = false;
        }
    }

    async function createUser(dto: CreateUserDto) {
        const response = await api.createUser(dto);
        await fetchUsers(true);
        return response.data;
    }

    async function updateUser(id: number, dto: UpdateUserDto) {
        const response = await api.updateUser(id, dto);
        await fetchUsers(true);
        return response.data;
    }

    async function removeUser(id: number) {
        await api.removeUser(id);
        await fetchUsers(true);
    }

    async function uploadProfilePicture(file: File, userId: number) {
        await api.uploadProfilePicture(file, userId);
        await fetchUsers(true);
    }

    async function removeProfilePicture(userId: number) {
        await api.removeProfilePicture(userId);
        await fetchUsers(true);
    }

    function clearCache() {
        cachedUsers.value = [];
        lastFetchTime.value = null;
    }

    return {
        users: cachedUsers,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        removeUser,
        uploadProfilePicture,
        removeProfilePicture,
        clearCache
    };
}
