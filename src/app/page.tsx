import { getServerUser } from '@/utils/server-auth'
import { PokerHero } from '@/components/ui/poker-hero'

export default async function Home() {
  const user = await getServerUser()
  const username = user?.email?.split('@')[0]

  return (
    <PokerHero user={user} username={username} />
  )
}
