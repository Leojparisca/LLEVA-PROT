import { createClient } from './supabase'
import { createServerSupabaseClient } from './supabase'
import { User } from '@supabase/supabase-js'

// Client-side auth utilities
export const signUp = async (email: string, password: string, fullName: string, userType: 'customer' | 'driver' | 'delivery_person') => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: userType,
      }
    }
  })
  
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

export const signOut = async () => {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  return { error }
}

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}

// Server-side auth utilities
export const getServerUser = async (): Promise<User | null> => {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}

export const getServerSession = async () => {
  const supabase = await createServerSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  return session
}

// Profile utilities
export const getUserProfile = async (userId: string) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const updateUserProfile = async (userId: string, updates: any) => {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Auth state management for React components
export const useAuth = () => {
  const supabase = createClient()
  
  return {
    supabase,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getUserProfile,
    updateUserProfile,
  }
}
