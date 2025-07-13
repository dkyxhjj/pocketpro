import { createClient } from '@/utils/supabase/client'

// Client-side auth functions
export const signUp = async (email: string, password: string) => {
  const supabase = createClient()
  return await supabase.auth.signUp({
    email,
    password,
  })
}

export const signIn = async (email: string, password: string) => {
  const supabase = createClient()
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export const signOut = async () => {
  const supabase = createClient()
  return await supabase.auth.signOut()
}

export const getCurrentUser = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
