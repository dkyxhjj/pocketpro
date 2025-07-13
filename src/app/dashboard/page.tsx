import { getServerUser } from '@/utils/server-auth'
import UserProfile from '@/components/UserProfile'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Dashboard() {
  const user = await getServerUser()  
  if (!user) redirect('/auth')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to PocketPro</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div><UserProfile /></div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl text-black font-semibold mb-4">Poker Tools</h2>
            <div className="space-y-3">
              <Link
                href="/ledger"
                className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 text-center transition-colors"
              >
                Game Ledger
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              <Link
                href="/income"
                className="block w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 text-center transition-colors"
              >
                Poker Income
              </Link>
           
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
