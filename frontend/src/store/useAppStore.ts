import { create } from 'zustand'

interface AppState {
  activeSessionId: number
  objectiveFilter: 'all' | 'click' | 'cart' | 'order'
  weights: { click: number; cart: number; order: number }
  setActiveSession:  (id: number) => void
  setObjectiveFilter:(f: 'all' | 'click' | 'cart' | 'order') => void
  setWeight:         (key: 'click' | 'cart' | 'order', val: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSessionId:  0,
  objectiveFilter:  'all',
  weights:          { click: 33, cart: 33, order: 34 },

  setActiveSession:   (id)      => set({ activeSessionId: id }),
  setObjectiveFilter: (f)       => set({ objectiveFilter: f }),
  setWeight:          (key, val)=> set(s => ({ weights: { ...s.weights, [key]: val } })),
}))
