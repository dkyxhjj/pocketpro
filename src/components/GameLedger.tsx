'use client'

import { useState, useEffect } from 'react'
import { saveGame, fetchGame } from '@/lib/database'
import { toast } from 'react-hot-toast'

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
  const [totalMoneyInPlay, setTotalMoneyInPlay] = useState(0)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [buyInAmount, setBuyInAmount] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [showCashoutModal, setShowCashoutModal] = useState(false)
  const [cashoutPlayerId, setCashoutPlayerId] = useState('')
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [gameId, setGameId] = useState<string | null>(null)

  // Load game data from Supabase on component mount
  useEffect(() => {
    const loadGame = async () => {
      setLoading(true)
      try {
        const game = await fetchGame()
        if (game) {
          setPlayers(game.players || [])
          setTotalMoneyInPlay(game.total_money_in_play || 0)
          setGameId(game.id || null)
        }
      } catch (error) {
        console.error('Error loading game:', error)
        toast.error('Failed to load game data')
      } finally {
        setLoading(false)
      }
    }

    loadGame()
  }, [])

  // Save game data to Supabase whenever state changes
  useEffect(() => {
    // Don't save on initial load
    if (loading) return

    const saveGameData = async () => {
      try {
        const id = await saveGame(players, totalMoneyInPlay)
        if (id && !gameId) {
          setGameId(id)
        }
      } catch (error) {
        console.error('Error saving game:', error)
        // Don't show toast on every auto-save to avoid spamming the user
      }
    }

    // Debounce save operations to avoid too many API calls
    const timeoutId = setTimeout(saveGameData, 1000)
    return () => clearTimeout(timeoutId)
  }, [players, totalMoneyInPlay, gameId, loading])

  const addPlayer = () => {
    if (!newPlayerName.trim()) return
    
    // Check if name already exists (including inactive players)
    const nameExists = players.some(player => 
      player.name.toLowerCase() === newPlayerName.trim().toLowerCase()
    )
    
    if (nameExists) {
      toast.error('A player with this name already exists!')
      return
    }
    
    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      buyIns: [],
      totalBuyIn: 0,
      isActive: true
    }
    
    setPlayers([...players, newPlayer])
    setNewPlayerName('')
    toast.success(`${newPlayer.name} added to the game`)
  }

  const addBuyIn = () => {
    const amount = parseFloat(buyInAmount)
    if (!selectedPlayerId || !amount || amount <= 0) return

    // Add to total pot
    setTotalMoneyInPlay(prev => prev + amount)

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
    toast.success(`Buy-in added successfully`)
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
      toast.error('Please enter a valid cashout amount')
      return
    }

    if (amount > totalMoneyInPlay) {
      toast.error(`Not enough money in the pot! Available: $${totalMoneyInPlay.toFixed(2)}`)
      return
    }

    // Find the cashing out player
    const cashingOutPlayer = players.find(p => p.id === cashoutPlayerId)
    if (!cashingOutPlayer) return

    // Subtract from total pot
    setTotalMoneyInPlay(prev => prev - amount)
    
    setPlayers(players.map(player => {
      if (player.id === cashoutPlayerId) {
        // Mark player as inactive and record their final cashout
        return { 
          ...player, 
          isActive: false,
          cashout: amount
        }
      }
      // All other players remain unchanged
      return player
    }))

    closeCashoutModal()
    toast.success(`${cashingOutPlayer.name} cashed out successfully`)
  }

  const activePlayers = players.filter(player => player.isActive)
  const cashedOutPlayers = players.filter(player => !player.isActive && player.cashout !== undefined)
  
  // Reset pot to 0 if no active players
  if (activePlayers.length === 0 && totalMoneyInPlay > 0) {
    setTotalMoneyInPlay(0)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-light text-black mb-2">Poker Game</h1>
        <div className="flex justify-center space-x-8 text-sm text-black">
          <span>Pot: <strong>${totalMoneyInPlay.toFixed(2)}</strong></span>
          <span>Players: <strong>{activePlayers.length}</strong></span>
        </div>
      </div>

      {/* Add Player */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Player name"
            className="flex-1 px-3 py-2 text-black border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
            onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
          />
          <button
            onClick={addPlayer}
            disabled={!newPlayerName.trim()}
            className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Add Buy-in */}
      {activePlayers.length > 0 && (
        <div className="mb-6">
          <div className="flex space-x-2">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="flex-1 px-3 py-2 border text-black border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="">Select player</option>
              {activePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={buyInAmount}
              onChange={(e) => setBuyInAmount(e.target.value)}
              placeholder="$0"
              min="0"
              step="0.01"
              className="w-20 px-3 py-2 text-black border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && addBuyIn()}
            />
            <button
              onClick={addBuyIn}
              disabled={!selectedPlayerId || !buyInAmount || parseFloat(buyInAmount) <= 0}
              className="px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Buy-in
            </button>
          </div>
        </div>
      )}

      {players.length === 0 ? (
        <div className="text-center py-16 text-black">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-lg font-medium mb-2 text-black">Ready to start?</h3>
          <p className="text-black">Add players to begin tracking the game</p>
        </div>
      ) : (
        <div>
          {/* Active Players */}
          {activePlayers.length > 0 && (
            <div className="mb-8 border border-gray-300 rounded p-4">
              <h3 className="text-sm font-medium text-black mb-3 uppercase tracking-wide">Active Players</h3>
              <div className="space-y-2">
                {activePlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded border border-gray-300">
                    <div>
                      <div className="font-medium text-black">{player.name}</div>
                      <div className="text-sm text-black">${player.totalBuyIn.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => openCashoutModal(player.id)}
                      className="text-sm text-black hover:text-gray-600"
                    >
                      Cash Out
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Cashed Out Players */}
          {cashedOutPlayers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-black mb-3 uppercase tracking-wide">Finished</h3>
              <div className="space-y-2">
                {cashedOutPlayers.map((player) => {
                  const net = player.cashout! - player.totalBuyIn;
                  return (
                    <div key={player.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-black">{player.name}</div>
                        <div className="text-sm text-black">
                          ${player.totalBuyIn.toFixed(2)} → ${player.cashout!.toFixed(2)}
                        </div>
                      </div>
                      <div className={`font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {net >= 0 ? '+' : ''}${net.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cashout Modal */}
      {showCashoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-80 mx-4">
            <h3 className="font-medium text-black mb-4">
              Cash out {players.find(p => p.id === cashoutPlayerId)?.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">Amount</label>
              <input
                type="number"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                placeholder="Amount"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-black border border-gray-300 rounded text-sm focus:outline-none focus:border-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCashout()}
                autoFocus
              />
              <div className="text-xs text-black mt-1">
                Available: ${totalMoneyInPlay.toFixed(2)}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={closeCashoutModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-black rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCashout}
                disabled={!cashoutAmount || parseFloat(cashoutAmount) <= 0}
                className="flex-1 px-4 py-2 bg-black text-white rounded text-sm hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
