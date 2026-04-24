import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  idleRefreshMinutes: number
  setIdleRefreshMinutes: (minutes: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      idleRefreshMinutes: 5,
      setIdleRefreshMinutes: (minutes) => set(() => ({ idleRefreshMinutes: minutes })),
    }),
    { name: 'hubitat-settings' },
  ),
)
