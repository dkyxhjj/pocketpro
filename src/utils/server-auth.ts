import { createClient } from '@/utils/supabase/server'

// Server-side auth functions
export const getServerUser = async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
