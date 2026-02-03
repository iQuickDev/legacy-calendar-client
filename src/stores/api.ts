import { defineStore } from 'pinia'
import api from '../services/API'
export const useAPIStore = defineStore('api', {
  state: () => ({
    client: api
  }),

  actions: {

  }
})