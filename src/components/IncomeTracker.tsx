'use client'

import { useState, useEffect } from 'react'
import { saveSessions, fetchSessions } from '@/lib/database'
import { toast } from 'react-hot-toast'

interface PokerSession {
  id: string
  date: string
  hours: number
  profit: number
  notes?: string
}

export default function IncomeTracker() {
  const [sessions, setSessions] = useState<PokerSession[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    hours: '',
    profit: '',
    notes: ''
  })

  // Load sessions from localStorage on component mount
  useEffect(() => {
    // Try to load from Supabase first
    (async () => {
        const cloudSessions = await fetchSessions()
        if (cloudSessions && cloudSessions.length > 0) {
          setSessions(cloudSessions)
          toast.success('Loaded sessions from cloud')
          return
        }

      // Fallback: load from localStorage
      const savedSessions = localStorage.getItem('pokerSessions')
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions))
      }
    })()
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('pokerSessions', JSON.stringify(sessions))
  }, [sessions])

  // Calculate stats
  const totalSessions = sessions.length
  const totalHours = sessions.reduce((sum, session) => sum + session.hours, 0)
  const totalProfit = sessions.reduce((sum, session) => sum + session.profit, 0)
  const hourlyRate = totalHours > 0 ? totalProfit / totalHours : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const hours = parseFloat(formData.hours)
    const profit = parseFloat(formData.profit)
    
    if (isNaN(hours) || isNaN(profit) || hours <= 0) {
      alert('Please enter valid hours and profit/loss amounts')
      return
    }

    const newSession: PokerSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      hours,
      profit,
      notes: formData.notes.trim() || undefined
    }

    setSessions([newSession, ...sessions])
    setFormData({ hours: '', profit: '', notes: '' })
    setShowAddForm(false)
  }

  const deleteSession = (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      setSessions(sessions.filter(session => session.id !== id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }

  return (
    <div className="space-y-6 text-black">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-black uppercase tracking-wide">
            Total Sessions
          </h3>
          <p className="mt-2 text-3xl font-bold text-black">{totalSessions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-black uppercase tracking-wide">
            Total Hours
          </h3>
          <p className="mt-2 text-3xl font-bold text-black">{formatHours(totalHours)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-black uppercase tracking-wide">
            Net Profit/Loss
          </h3>
          <p className={`mt-2 text-3xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-black uppercase tracking-wide">
            Hourly Rate
          </h3>
          <p className={`mt-2 text-3xl font-bold ${hourlyRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(hourlyRate)}/h
          </p>
        </div>
      </div>

      {/* Add Session Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-black">Session History</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const ok = await saveSessions(sessions)
              if (ok) {
                toast.success('Sessions saved to Supabase!')
              } else {
                toast.error('Failed to save sessions. Are you logged in?')
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Save to Cloud
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Session'}
          </button>
        </div>
      </div>

      {/* Add Session Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-black mb-4">Add New Session</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hours" className="block text-sm font-medium text-black mb-1">
                  Hours Played *
                </label>
                <input
                  type="number"
                  id="hours"
                  step="0.1"
                  min="0.1"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 3.5"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="profit" className="block text-sm font-medium text-black mb-1">
                  Profit/Loss ($) *
                </label>
                <input
                  type="number"
                  id="profit"
                  step="0.01"
                  value={formData.profit}
                  onChange={(e) => setFormData({ ...formData, profit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 150 or -75"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-black mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Game type, location, key hands, etc."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save Session
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-black">
            <p className="text-lg mb-2">No sessions recorded yet</p>
            <p>Click &quot;Add Session&quot; to start tracking your poker income!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hourly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {formatHours(session.hours)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      session.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(session.profit)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      (session.profit / session.hours) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(session.profit / session.hours)}/h
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {session.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
