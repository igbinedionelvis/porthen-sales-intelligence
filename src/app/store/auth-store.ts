
import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  initializeAuth: () => Promise<void>
  signUp: (fullName: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initializeAuth: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    set({
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        isAuthenticated: !!session,
        isLoading: false,
      })
    })
  },

  signUp: async (fullName, email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) throw error
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error
  },
}))
