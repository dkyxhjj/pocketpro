import { getServerUser } from '@/utils/server-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GameLedger from '@/components/GameLedger'

export default async function LedgerPage() {
  const user = await getServerUser()  
  if (!user) redirect('/auth')

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Ledger</h1>
          <p className="text-gray-600">Track player buy-ins and money in play</p>
        </div>
        <GameLedger />
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/dashboard"
            className="block bg-blue-500 text-white hover:bg-blue-600 py-2 px-4 rounded-md text-center"
          >
            Save and Exit
          </Link>
        </div>
      </div>
    </div>
  )
}
