import { getServerUser } from '@/utils/server-auth'
import { redirect } from 'next/navigation'
import IncomeTracker from '@/components/IncomeTracker'

export default async function IncomePage() {
  const user = await getServerUser()  
  if (!user) redirect('/auth')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-black mb-2">
              Poker Income Tracker
            </h1>
            <a href="/dashboard" className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300">Home</a>
          </div>
          <p className="text-black">
            Track your poker sessions and monitor your long-term performance
          </p>
        </div>
        <IncomeTracker />
      </div>
    </div>
  )
}
