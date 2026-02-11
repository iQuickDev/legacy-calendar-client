import { defineStore } from 'pinia'
import type { Session } from '../types/Session'
import { useAPIStore } from './api'
import type { AuthLoginDto } from '../services/API'

export const useSessionStore = defineStore('session', {
    state: () => ({
        session: {} as Session,
        bypassToken: null as string | null,
        loading: false,
        error: null as string | null,
    }),
    getters: {
        isAuthenticated: (state) => !!state.session.token,
        currentUser: (state) => state.session.user,
    },
    actions: {
        save() {
            localStorage.setItem('token', this.session.token)
            if (this.bypassToken) {
                localStorage.setItem('bypass_token', this.bypassToken)
            }
        },
        setBypassToken(token: string) {
            this.bypassToken = token
            localStorage.setItem('bypass_token', token)
        },
        clearBypassToken() {
            this.bypassToken = null
            localStorage.removeItem('bypass_token')
        },
        async login(credentials: AuthLoginDto) {
            this.loading = true
            this.error = null
            try {
                const { client } = useAPIStore()
                const loginResponse = await client.login(credentials)
                const token = loginResponse.data.access_token

                // Store token
                localStorage.setItem('token', token)
                this.session.token = token

                // Fetch user profile
                const profileResponse = await client.getProfile()
                this.session.user = profileResponse.data

                return true
            } catch (err: any) {
                this.error = err.response?.data?.message || 'Login failed. Please check your credentials.'
                localStorage.removeItem('token')
                this.session = {} as Session
                return false
            } finally {
                this.loading = false
            }
        },
        async load() {
            const token = localStorage.getItem('token') ?? null
            this.bypassToken = localStorage.getItem('bypass_token') ?? null

            if (!token) {
                return false
            }
            this.loading = true
            this.error = null
            try {
                this.session.token = token
                const { client } = useAPIStore()
                const response = await client.getProfile()
                this.session = {
                    token,
                    user: response.data
                }
                return true
            } catch (err: any) {
                // Token is invalid or expired
                this.error = 'Session expired. Please log in again.'
                localStorage.removeItem('token')
                this.session = {} as Session
                return false
            } finally {
                this.loading = false
            }
        },
        async logout() {
            this.session = {} as Session
            this.bypassToken = null
            localStorage.removeItem('token')
            localStorage.removeItem('bypass_token')
        },
        clearError() {
            this.error = null
        },
        async updateProfile(updates: any) {
            if (this.session.user) {
                this.session.user = { ...this.session.user, ...updates };
                // In a real app, this would make an API call
            }
        },
        async changePassword(currentPassword: string, newPassword: string) {
            try {
                this.loading = true;
                const { client } = useAPIStore();
                await client.changePassword({ currentPassword, newPassword });
                return true;
            } catch (error: any) {
                console.error('Failed to change password:', error);
                throw error; // Re-throw to let the component handle the error toast
            } finally {
                this.loading = false;
            }
        },
        async uploadProfilePicture(file: File) {
            try {
                const { client } = useAPIStore();
                const response = await client.uploadProfilePicture(file);
                // Update local session with a new object to ensure reactivity
                if (this.session.user) {
                    this.session.user = {
                        ...this.session.user,
                        profilePicture: `${response.data.profilePicture}?t=${Date.now()}`
                    };
                }
                return true;
            } catch (error) {
                console.error('Failed to upload profile picture:', error);
                throw error;
            }
        },
        async removeProfilePicture() {
            try {
                const { client } = useAPIStore();
                await client.removeProfilePicture();
                // Update local session explicitly for reactivity
                if (this.session.user) {
                    this.session.user = {
                        ...this.session.user,
                        profilePicture: undefined
                    };
                }
                return true;
            } catch (error) {
                console.error('Failed to remove profile picture:', error);
                throw error;
            }
        }
    }
})