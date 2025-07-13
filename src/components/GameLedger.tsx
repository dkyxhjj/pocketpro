'use client'

import { useState } from 'react'

interface Player {
  id: string
  name: string
  buyIns: number[]
  totalBuyIn: number
  isActive: boolean
  cashout?: number
}

export default function GameLedger() {
  const [players, setPlayers] = useState<Player[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [buyInAmount, setBuyInAmount] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [showCashoutModal, setShowCashoutModal] = useState(false)
  const [cashoutPlayerId, setCashoutPlayerId] = useState('')
  const [cashoutAmount, setCashoutAmount] = useState('')

  const addPlayer = () => {
    if (!newPlayerName.trim()) return
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      buyIns: [],
      totalBuyIn: 0,
      isActive: true
    }
    
    setPlayers([...players, newPlayer])
    setNewPlayerName('')
  }

  const addBuyIn = () => {
    const amount = parseFloat(buyInAmount)
    if (!selectedPlayerId || !amount || amount <= 0) return

    setPlayers(players.map(player => {
      if (player.id === selectedPlayerId) {
        const newBuyIns = [...player.buyIns, amount]
        return {
          ...player,
          buyIns: newBuyIns,
          totalBuyIn: newBuyIns.reduce((sum, buyIn) => sum + buyIn, 0)
        }
      }
      return player
    }))
    
    setBuyInAmount('')
    setSelectedPlayerId('')
  }

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter(player => player.id !== playerId))
  }

  const togglePlayerStatus = (playerId: string) => {
    setPlayers(players.map(player => 
      player.id === playerId 
        ? { ...player, isActive: !player.isActive }
        : player
    ))
  }

  const openCashoutModal = (playerId: string) => {
    setCashoutPlayerId(playerId)
    setShowCashoutModal(true)
  }

  const closeCashoutModal = () => {
    setShowCashoutModal(false)
    setCashoutPlayerId('')
    setCashoutAmount('')
  }

  const handleCashout = () => {
    const amount = parseFloat(cashoutAmount)
    if (!amount || amount <= 0) {
      alert('Please enter a valid cashout amount')
      return
    }

    if (amount > totalMoneyInPlay) {
      alert(`Not enough money in the pot! Available: $${totalMoneyInPlay.toFixed(2)}`)
      return
    }

    // Find the cashing out player
    const cashingOutPlayer = players.find(p => p.id === cashoutPlayerId)
    if (!cashingOutPlayer) return

    // Calculate how much to reduce from each player proportionally
    const totalBuyIns = players.reduce((sum, player) => sum + player.totalBuyIn, 0)
    
    setPlayers(players.map(player => {
      if (player.id === cashoutPlayerId) {
        // Mark player as inactive and record their final cashout
        return { 
          ...player, 
          isActive: false,
          // Add a cashout record (optional - for tracking)
          cashout: amount
        }
      } else if (player.totalBuyIn > 0) {
        // Reduce each remaining player's total proportionally
        const proportion = player.totalBuyIn / totalBuyIns
        const reduction = amount * proportion
        const newTotal = Math.max(0, player.totalBuyIn - reduction)
        
        // Scale down their buy-ins proportionally
        const scaleFactor = newTotal / player.totalBuyIn
        return {
          ...player,
          totalBuyIn: newTotal,
          buyIns: player.buyIns.map(buyIn => buyIn * scaleFactor)
        }
      }
      return player
    }))

    closeCashoutModal()
  }

  const totalMoneyInPlay = players.reduce((sum, player) => sum + player.totalBuyIn, 0)
  const activePlayers = players.filter(player => player.isActive)
  const inactivePlayers = players.filter(player => !player.isActive)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Stats Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex space-x-8">
          <div>
            <span className="text-slate-400 text-sm">Pot Size</span>
            <div className="text-2xl font-bold text-green-400">${totalMoneyInPlay.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-slate-400 text-sm">Players</span>
            <div className="text-xl font-semibold text-white">{activePlayers.length}/{players.length}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Game Status</div>
          <div className="text-green-400 font-semibold">{players.length > 0 ? 'Active' : 'Waiting'}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-x border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            />
          </div>
          <button 
            onClick={addPlayer}
            disabled={!newPlayerName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            Add Player
          </button>
        </div>
        
        {players.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-gray-100">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              <option value="">Choose player...</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} {!player.isActive && '(Out)'}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              placeholder="$0.00"
              min="0"
              step="0.01"
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
              onKeyPress={(e) => e.key === 'Enter' && addBuyIn()}
            />
            <button
              onClick={addBuyIn}
              disabled={!selectedPlayerId || !buyInAmount || parseFloat(buyInAmount) <= 0}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Buy In
            </button>
          </div>
        )}
      </div>

      {/* Players List */}
      <div className="bg-white border border-gray-200 rounded-b-lg">
        {players.length === 0 ? (
          <div className="text-center py-16 text-black">
            <div className="text-6xl mb-4">🃏</div>
            <h3 className="text-lg font-medium mb-2 text-black">Ready to start?</h3>
            <p className="text-black">Add players to begin tracking the game</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Active Players */}
            {activePlayers.map((player, index) => (
              <div key={player.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-700">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">{player.name}</h4>
                      <div className="text-sm text-black">
                        {player.buyIns.length} buy-in{player.buyIns.length !== 1 ? 's' : ''} • 
                        <span className="font-medium text-green-600">${player.totalBuyIn.toFixed(2)}</span>
                        {player.buyIns.length > 1 && (
                          <span className="ml-2 text-black">
                            ({player.buyIns.map(amount => `$${amount.toFixed(2)}`).join(' + ')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openCashoutModal(player.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Cash Out
                    </button>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Inactive Players */}
            {inactivePlayers.map((player) => (
              <div key={player.id} className="p-4 bg-gray-50 opacity-75">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-500">
                      —
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">{player.name} <span className="text-sm font-normal text-black">(Out)</span></h4>
                      <div className="text-sm text-black">
                        {player.cashout ? (
                          <span>Cashed out: <span className="font-medium text-green-600">${player.cashout.toFixed(2)}</span></span>
                        ) : (
                          <span>Final: <span className="font-medium text-black">${player.totalBuyIn.toFixed(2)}</span></span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => togglePlayerStatus(player.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Rejoin
                    </button>
                    <button
                      onClick={() => removePlayer(player.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cashout Model */}
      {showCashoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">Cash Out Player</h3>
            <div className="mb-4">
              <p className="text-sm text-black mb-2">
                Player: <span className="font-medium">
                  {players.find(p => p.id === cashoutPlayerId)?.name}
                </span>
              </p>
              <p className="text-sm text-black mb-4">
                Available in pot: <span className="font-medium text-green-600">
                  ${totalMoneyInPlay.toFixed(2)}
                </span>
              </p>
              <label className="block text-sm font-medium text-black mb-2">
                Cashout Amount:
              </label>
              <input
                type="number"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                placeholder="$0.00"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                onKeyPress={(e) => e.key === 'Enter' && handleCashout()}
                autoFocus
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={closeCashoutModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-black rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCashout}
                disabled={!cashoutAmount || parseFloat(cashoutAmount) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Cashout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
