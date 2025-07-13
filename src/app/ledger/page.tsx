import { getServerUser } from '@/utils/server-auth'
import UserProfile from '@/components/UserProfile'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const user = await getServerUser()  
  if (!user) redirect('/auth')

  return (
   <div>ledger</div>
  )
}
