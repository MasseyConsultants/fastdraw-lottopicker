const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');
const OrchestratorAgent = require('../agents/orchestratorAgent');

// Constants for number ranges
const LOTTO_TEXAS_RANGE = { min: 1, max: 54, count: 6 };
const POWERBALL_RANGE = { min: 1, max: 69, count: 5, powerballMax: 26 };

const orchestrator = new OrchestratorAgent();

class LotteryService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../lottery-data');
    this.generatedPicksPath = path.join(this.dataPath, 'generated_picks.csv');
    this.initializeGeneratedPicksFile();
  }

  initializeGeneratedPicksFile() {
    if (!fs.existsSync(this.generatedPicksPath)) {
      const csvWriter = createObjectCsvWriter({
        path: this.generatedPicksPath,
        header: [
          { id: 'Game', title: 'Game' },
          { id: 'PickType', title: 'PickType' },
          { id: 'Numbers', title: 'Numbers' },
          { id: 'Powerball', title: 'Powerball' }
        ]
      });
      csvWriter.writeRecords([]);
    }
  }

  async loadLotteryData(game) {
    try {
      const filePath = path.join(this.dataPath, `${game.toLowerCase()}.csv`);
      console.log('Loading data from:', filePath);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`No data file found for game: ${game}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      return new Promise((resolve, reject) => {
        const records = [];
        parse(fileContent, {
          columns: game === 'powerball' ? true : ['Game Name', 'Month', 'Day', 'Year', 'Num1', 'Num2', 'Num3', 'Num4', 'Num5', 'Num6'],
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
          skip_records_with_error: true,
          from_line: 1,
          cast: true
        })
          .on('data', (record) => {
            try {
              // Validate required fields
              if (game === 'powerball') {
                // Powerball validation logic remains the same
                if (record.Num1 && record.Num2 && record.Num3 && record.Num4 && record.Num5 && record.Powerball) {
                  if (!record['Power Play']) {
                    record['Power Play'] = '2';
                  }
                  const numbers = [
                    parseInt(record.Num1),
                    parseInt(record.Num2),
                    parseInt(record.Num3),
                    parseInt(record.Num4),
                    parseInt(record.Num5)
                  ];
                  const powerball = parseInt(record.Powerball);
                  
                  if (numbers.every(n => !isNaN(n) && n >= 1 && n <= 69) && 
                      !isNaN(powerball) && powerball >= 1 && powerball <= 26) {
                    records.push(record);
                  } else {
                    console.warn('Skipping record with invalid number ranges:', record);
                  }
                } else {
                  console.warn('Skipping invalid Powerball record (missing required fields):', record);
                }
              } else {
                // Lotto Texas validation
                if (record.Num1 && record.Num2 && record.Num3 && record.Num4 && record.Num5 && record.Num6) {
                  const numbers = [
                    parseInt(record.Num1),
                    parseInt(record.Num2),
                    parseInt(record.Num3),
                    parseInt(record.Num4),
                    parseInt(record.Num5),
                    parseInt(record.Num6)
                  ];
                  
                  if (numbers.every(n => !isNaN(n) && n >= 1 && n <= 54)) {
                    records.push(record);
                  } else {
                    console.warn('Skipping record with invalid number ranges:', record);
                  }
                } else {
                  console.warn('Skipping invalid Lotto Texas record (missing required fields):', record);
                }
              }
            } catch (error) {
              console.warn('Error processing record:', error, record);
            }
          })
          .on('end', () => {
            if (records.length === 0) {
              reject(new Error('No valid records found in the CSV file'));
              return;
            }
            console.log(`Successfully loaded ${records.length} valid records`);
            resolve(records);
          })
          .on('error', (error) => {
            console.error('CSV parsing error:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('Error loading lottery data:', error);
      throw error;
    }
  }

  async generateFrequencyPicks(game, numDraws) {
    try {
      const data = await this.loadLotteryData(game);
      console.log(`Generating ${numDraws} frequency picks for ${game}`);

      if (!data || data.length === 0) {
        throw new Error('No historical data available');
      }

      // Count frequency of each number
      const frequency = {};
      data.forEach(record => {
        // Map the numeric fields to their actual values based on game type
        const numbers = game === 'powerball' ? [
          parseInt(record.Num1),
          parseInt(record.Num2),
          parseInt(record.Num3),
          parseInt(record.Num4),
          parseInt(record.Num5)
        ] : [
          parseInt(record.Num1),
          parseInt(record.Num2),
          parseInt(record.Num3),
          parseInt(record.Num4),
          parseInt(record.Num5),
          parseInt(record.Num6)
        ];

        // Count only valid numbers
        const maxNumber = game === 'powerball' ? 69 : 54;
        numbers.forEach(num => {
          if (!isNaN(num) && num >= 1 && num <= maxNumber) {
            frequency[num] = (frequency[num] || 0) + 1;
          }
        });

        // Count Powerball numbers if applicable
        if (game === 'powerball' && record.Powerball) {
          const powerball = parseInt(record.Powerball);
          if (!isNaN(powerball) && powerball >= 1 && powerball <= 26) {
            frequency[`powerball_${powerball}`] = (frequency[`powerball_${powerball}`] || 0) + 1;
          }
        }
      });

      // Generate picks based on frequency
      const picks = [];
      for (let i = 0; i < numDraws; i++) {
        const numbers = this.selectNumbersByFrequency(frequency, game);
        const pick = {
          Game: game === 'lottotexas' ? 'Lotto Texas' : 'Powerball',
          PickType: 'frequency',
          Numbers: numbers.slice(0, game === 'powerball' ? 5 : 6)
        };

        if (game === 'powerball') {
          pick.Powerball = numbers[5];
        }

        picks.push(pick);
      }

      // Save picks
      await this.savePicks(picks);
      return picks;
    } catch (error) {
      console.error('Error generating frequency picks:', error);
      throw error;
    }
  }

  selectNumbersByFrequency(frequency, game) {
    const maxNumber = game === 'powerball' ? 69 : 54;
    const numbers = [];
    const powerballNumbers = [];

    // Separate regular numbers and Powerball numbers
    Object.entries(frequency).forEach(([num, count]) => {
      if (num.startsWith('powerball_')) {
        powerballNumbers.push({
          number: parseInt(num.split('_')[1]),
          count
        });
      } else {
        numbers.push({
          number: parseInt(num),
          count
        });
      }
    });

    // Sort by frequency
    numbers.sort((a, b) => b.count - a.count);
    powerballNumbers.sort((a, b) => b.count - a.count);

    // Select regular numbers
    const selectedNumbers = new Set();
    while (selectedNumbers.size < (game === 'powerball' ? 5 : 6)) {
      const availableNumbers = numbers.filter(n => !selectedNumbers.has(n.number));
      if (availableNumbers.length === 0) break;

      // Weight by frequency
      const totalWeight = availableNumbers.reduce((sum, n) => sum + n.count, 0);
      let random = Math.random() * totalWeight;
      let selected;

      for (const num of availableNumbers) {
        random -= num.count;
        if (random <= 0) {
          selected = num.number;
          break;
        }
      }

      if (selected) {
        selectedNumbers.add(selected);
      }
    }

    // Add Powerball number if needed
    if (game === 'powerball' && powerballNumbers.length > 0) {
      const totalPowerballWeight = powerballNumbers.reduce((sum, n) => sum + n.count, 0);
      let random = Math.random() * totalPowerballWeight;
      let selectedPowerball;

      for (const num of powerballNumbers) {
        random -= num.count;
        if (random <= 0) {
          selectedPowerball = num.number;
          break;
        }
      }

      if (selectedPowerball) {
        selectedNumbers.add(selectedPowerball);
      } else {
        // Fallback to random Powerball if no frequency data
        selectedNumbers.add(Math.floor(Math.random() * 26) + 1);
      }
    }

    return Array.from(selectedNumbers);
  }

  async savePicks(picks) {
    try {
      const csvWriter = createObjectCsvWriter({
        path: this.generatedPicksPath,
        header: [
          { id: 'Game', title: 'Game' },
          { id: 'PickType', title: 'PickType' },
          { id: 'Numbers', title: 'Numbers' },
          { id: 'Powerball', title: 'Powerball' }
        ],
        append: true
      });

      await csvWriter.writeRecords(picks);
    } catch (error) {
      console.error('Error saving picks:', error);
      throw error;
    }
  }

  async getAnalysis(game) {
    try {
      const data = await this.loadLotteryData(game);
      if (!data || data.length === 0) {
        throw new Error('No historical data available');
      }

      const frequency = this.analyzeFrequency(data);
      const patterns = this.analyzePatterns(data);

      return {
        frequency,
        patterns
      };
    } catch (error) {
      console.error('Error getting analysis:', error);
      throw error;
    }
  }

  analyzeFrequency(data) {
    const frequency = {};
    
    // Count frequency of each number
    data.forEach(record => {
      // Map the numeric fields to their actual values based on game type
      const numbers = [
        parseInt(record.Num1),
        parseInt(record.Num2),
        parseInt(record.Num3),
        parseInt(record.Num4),
        parseInt(record.Num5),
        parseInt(record.Num6 || 0)
      ];

      // Count only valid numbers
      numbers.forEach(num => {
        if (!isNaN(num) && num >= 1 && num <= 69) {
          frequency[num] = (frequency[num] || 0) + 1;
        }
      });

      // Count Powerball if present
      if (record.Powerball) {
        const powerball = parseInt(record.Powerball);
        if (!isNaN(powerball) && powerball >= 1 && powerball <= 26) {
          frequency[`powerball_${powerball}`] = (frequency[`powerball_${powerball}`] || 0) + 1;
        }
      }
    });

    // Convert to array and sort by frequency
    const sortedNumbers = Object.entries(frequency)
      .filter(([key]) => !key.startsWith('powerball_'))
      .map(([number, count]) => ({ number: parseInt(number), count }))
      .sort((a, b) => b.count - a.count);

    const sortedPowerball = Object.entries(frequency)
      .filter(([key]) => key.startsWith('powerball_'))
      .map(([key, count]) => ({ number: parseInt(key.split('_')[1]), count }))
      .sort((a, b) => b.count - a.count);

    return {
      hot: sortedNumbers.slice(0, 10).map(item => item.number),
      cold: sortedNumbers.slice(-10).reverse().map(item => item.number),
      powerball: {
        hot: sortedPowerball.slice(0, 5).map(item => item.number),
        cold: sortedPowerball.slice(-5).reverse().map(item => item.number)
      }
    };
  }

  analyzePatterns(data) {
    // Calculate sum ranges
    const sums = data.map(record => {
      const numbers = [
        parseInt(record.Num1),
        parseInt(record.Num2),
        parseInt(record.Num3),
        parseInt(record.Num4),
        parseInt(record.Num5),
        parseInt(record.Num6 || 0)
      ];

      // Sum only valid numbers
      return numbers.reduce((sum, num) => {
        return !isNaN(num) && num >= 1 && num <= 69 ? sum + num : sum;
      }, 0);
    }).filter(sum => sum > 0);

    // Calculate common pairs
    const pairs = {};
    data.forEach(record => {
      const numbers = [
        parseInt(record.Num1),
        parseInt(record.Num2),
        parseInt(record.Num3),
        parseInt(record.Num4),
        parseInt(record.Num5),
        parseInt(record.Num6 || 0)
      ].filter(num => !isNaN(num) && num >= 1 && num <= 69);

      // Generate all possible pairs
      for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = [numbers[i], numbers[j]].sort();
          const key = pair.join('-');
          pairs[key] = (pairs[key] || 0) + 1;
        }
      }
    });

    const commonPairs = Object.entries(pairs)
      .map(([numbers, count]) => ({
        numbers: numbers.split('-').map(Number),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(pair => pair.numbers);

    return {
      sumRange: {
        min: sums.length > 0 ? Math.min(...sums) : 0,
        max: sums.length > 0 ? Math.max(...sums) : 0,
        average: sums.length > 0 ? Math.round(sums.reduce((a, b) => a + b, 0) / sums.length) : 0
      },
      commonPairs
    };
  }
}

module.exports = new LotteryService(); 