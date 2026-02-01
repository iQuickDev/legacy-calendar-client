import { defineStore } from 'pinia'
import type { Session } from '../types/Session'
import { useAPIStore } from './api'

export const useSessionStore = defineStore('session', {
    state: () => ({
        session: {} as Session,
    }),
    getters: {},
    actions: {
        save() {
            localStorage.setItem('token', this.session.token)
        },
        async load() {
            const token = localStorage.getItem('token') ?? null
            if (!token) {
                return
            }
            this.session.token = token
            const { client } = useAPIStore()
            this.session = await (await client.getOwnProfile()).json()
            this.session.token = token
        },
        async logout() {
            const { client } = useAPIStore()
            await client.logout(this.session.token)
            this.session = {} as Session
            localStorage.removeItem('token')
        }
    }
})