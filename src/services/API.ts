// import { useSessionStore } from '../stores/session'

export const baseURL = import.meta.env.VITE_API_URL
export const baseAPIURL = `${baseURL}/api`

export default class API {
    // sessionStore = useSessionStore() 
    // Commented out to avoid circular dependency for now, or just leave it if it works in runtime (but TS might complain about initialization if not careful).
    // Actually, let's just make it compilation compliant.

    async getOwnProfile() {
        return { json: async () => ({ token: 'mock-token', user: 'mock-user' }) };
    }

    async logout(_token: string) {
        return;
    }
}