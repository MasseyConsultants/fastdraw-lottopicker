import { useState, useEffect } from 'react'
import LotteryDraw from './components/LotteryDraw'
import SlotMachine from './components/SlotMachine'
import AnalyticsDashboard from './components/AnalyticsDashboard'

// Use absolute URL for API calls
const API_BASE_URL = 'https://api.robertwmassey.com';

function App() {
  const [game, setGame] = useState('lottotexas')
  const [numDraws, setNumDraws] = useState(1)
  const [picks, setPicks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only fetch initial picks when game changes
    fetch(`${API_BASE_URL}/api/lottery/picks?draws=1&game=${game}`, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log('Raw picks data:', data);
        console.log('First pick:', data[0]);
        
        // Ensure each pick has the correct structure
        const validatedPicks = data.map(pick => {
          if (pick.Type === 'powerball') {
            // For Powerball, ensure we have RegularNumbers and Powerball
            const regularNumbers = Array.isArray(pick.RegularNumbers) ? pick.RegularNumbers : [];
            const powerball = pick.Powerball || null;
            
            console.log('Processing Powerball pick:', {
              original: pick,
              regularNumbers,
              powerball
            });
            
            return {
              ...pick,
              Type: pick.Type || game,
              RegularNumbers: regularNumbers,
              Powerball: powerball
            };
          } else {
            // For Lotto Texas, ensure we have Numbers array
            const numbers = Array.isArray(pick.Numbers) ? pick.Numbers : [];
            
            console.log('Processing Lotto Texas pick:', {
              original: pick,
              numbers
            });
            
            return {
              ...pick,
              Type: pick.Type || game,
              Numbers: numbers
            };
          }
        });
        
        console.log('Validated picks:', validatedPicks);
        setPicks(validatedPicks);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching picks:', error);
        setIsLoading(false);
      });
  }, [game]); // Only depend on game changes

  const generatePicks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Calculate how many new picks we need
      const currentPicks = picks.length;
      const newPicksNeeded = numDraws - currentPicks;
      
      if (newPicksNeeded <= 0) {
        // If we're reducing the number of draws, just slice the array
        setPicks(picks.slice(0, numDraws));
        setIsLoading(false);
        return;
      }

      // Only fetch the number of new picks we need
      const response = await fetch(`${API_BASE_URL}/api/lottery/picks?draws=${newPicksNeeded}&game=${game}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error('Failed to generate picks')
      }
      
      const newPicks = await response.json()
      console.log('Received new picks:', newPicks)

      // Validate and structure the new picks
      const validatedNewPicks = newPicks.map(pick => {
        if (pick.Type === 'powerball') {
          return {
            ...pick,
            Type: pick.Type || game,
            RegularNumbers: Array.isArray(pick.RegularNumbers) ? pick.RegularNumbers : [],
            Powerball: pick.Powerball || null
          };
        } else {
          return {
            ...pick,
            Type: pick.Type || game,
            Numbers: Array.isArray(pick.Numbers) ? pick.Numbers : []
          };
        }
      });

      // Combine existing picks with new ones
      setPicks([...picks, ...validatedNewPicks])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyAllNumbers = () => {
    const allNumbers = picks.map((pick, index) => {
      let numbers = '';
      if (pick.Type === 'powerball') {
        let regularNumbers = pick.RegularNumbers || [];
        let powerball = pick.Powerball;
        // Fallback: if RegularNumbers is empty, try Numbers
        if ((!regularNumbers || regularNumbers.length === 0) && Array.isArray(pick.Numbers) && pick.Numbers.length >= 6) {
          regularNumbers = pick.Numbers.slice(0, 5);
          powerball = pick.Numbers[5];
        }
        numbers = `${regularNumbers.join(', ')} | Powerball: ${powerball || ''}`;
      } else {
        numbers = (pick.Numbers || []).join(', ');
      }
      return `Draw ${index + 1}: ${numbers}`;
    }).join('\n');
    
    console.log('Copying numbers:', allNumbers);
    navigator.clipboard.writeText(allNumbers);
    alert('All numbers copied to clipboard!');
  };

  const downloadAllNumbers = () => {
    const allNumbers = picks.map((pick, index) => {
      let numbers = '';
      if (pick.Type === 'powerball') {
        let regularNumbers = pick.RegularNumbers || [];
        let powerball = pick.Powerball;
        // Fallback: if RegularNumbers is empty, try Numbers
        if ((!regularNumbers || regularNumbers.length === 0) && Array.isArray(pick.Numbers) && pick.Numbers.length >= 6) {
          regularNumbers = pick.Numbers.slice(0, 5);
          powerball = pick.Numbers[5];
        }
        numbers = `${regularNumbers.join(', ')} | Powerball: ${powerball || ''}`;
      } else {
        numbers = (pick.Numbers || []).join(', ');
      }
      return `Draw ${index + 1}: ${numbers}`;
    }).join('\n');
    
    console.log('Downloading numbers:', allNumbers);
    const blob = new Blob([allNumbers], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FastDraw_Lotto_Picker_All_Numbers.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">FastDraw Lotto Picker</h1>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game Selection and Results */}
          <div className="space-y-6">
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
                onClick={generatePicks}
                className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
              >
                Generate Picks
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
                {picks.map((pick, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Draw {index + 1}</h3>
                    <SlotMachine 
                      numbers={pick.Type === 'powerball' ? {
                        RegularNumbers: pick.RegularNumbers,
                        Powerball: pick.Powerball
                      } : pick.Numbers} 
                      type={pick.Type ? pick.Type.toLowerCase() : game}
                    />
                    {index < picks.length - 1 && (
                      <div className="mt-4 border-b border-gray-200"></div>
                    )}
                  </div>
                ))}
                {picks.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium mb-4">All Numbers</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={copyAllNumbers}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Copy All Numbers
                      </button>
                      <button 
                        onClick={downloadAllNumbers}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                      >
                        Download All Numbers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Number Analytics</h2>
            <AnalyticsDashboard game={game} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 