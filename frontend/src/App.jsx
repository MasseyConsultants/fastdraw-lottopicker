import { useState } from 'react'
import LotteryDraw from './components/LotteryDraw'

function App() {
  const [game, setGame] = useState('lottotexas')
  const [numDraws, setNumDraws] = useState(1)
  const [picks, setPicks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const generatePicks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/lottery/picks?draws=${numDraws}&game=${game}`)
      if (!response.ok) {
        throw new Error('Failed to generate picks')
      }
      
      const data = await response.json()
      setPicks(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">FastDraw Lotto Picker</h1>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Selection */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Game Selection</h2>
            <select
              className="input mb-4"
              value={game}
              onChange={(e) => setGame(e.target.value)}
            >
              <option value="lottotexas">Lotto Texas</option>
              <option value="powerball">Powerball</option>
            </select>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Draws
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={numDraws}
                onChange={(e) => setNumDraws(parseInt(e.target.value))}
                className="input"
              />
            </div>

            <button 
              className="btn btn-primary w-full"
              onClick={generatePicks}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Picks'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Results Display */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Generated Picks</h2>
            <div className="space-y-4">
              {picks.length > 0 ? (
                picks.map((pick, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Draw {index + 1}</h3>
                    <LotteryDraw 
                      numbers={pick.Numbers} 
                      isSpinning={isLoading}
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Select game and number of draws to generate picks</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 