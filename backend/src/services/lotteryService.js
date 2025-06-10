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
    console.log('Data path:', this.dataPath);
    console.log('Generated picks path:', this.generatedPicksPath);
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
      console.log('File exists:', fs.existsSync(filePath));
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`No data file found for game: ${game}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      console.log('File content length:', fileContent.length);

      return new Promise((resolve, reject) => {
        const records = [];
        parse(fileContent, {
          columns: false,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
          skip_records_with_error: true,
          from_line: 1,
          cast: true,
          delimiter: ','
        })
          .on('data', (record) => {
            try {
              if (game === 'powerball') {
                // Powerball validation - handle regular numbers and Powerball separately
                if (record[4] && record[5] && record[6] && record[7] && record[8] && record[9]) {
                  const regularNumbers = [
                    parseInt(record[4]),
                    parseInt(record[5]),
                    parseInt(record[6]),
                    parseInt(record[7]),
                    parseInt(record[8])
                  ];
                  const powerball = parseInt(record[9]);
                  
                  // Validate regular numbers (1-69) and Powerball (1-26) separately
                  const validRegularNumbers = regularNumbers.every(n => !isNaN(n) && n >= 1 && n <= 69);
                  const validPowerball = !isNaN(powerball) && powerball >= 1 && powerball <= 26;
                  
                  if (validRegularNumbers && validPowerball) {
                    records.push({
                      Type: 'powerball',
                      RegularNumbers: regularNumbers,
                      Powerball: powerball
                    });
                  } else {
                    console.warn('Skipping record with invalid numbers:', {
                      regularNumbers,
                      powerball,
                      validRegularNumbers,
                      validPowerball
                    });
                  }
                } else {
                  console.warn('Skipping invalid Powerball record (missing required fields):', record);
                }
              } else {
                // Lotto Texas validation
                if (record[4] && record[5] && record[6] && record[7] && record[8] && record[9]) {
                  const numbers = [
                    parseInt(record[4]),
                    parseInt(record[5]),
                    parseInt(record[6]),
                    parseInt(record[7]),
                    parseInt(record[8]),
                    parseInt(record[9])
                  ];
                  
                  if (numbers.every(n => !isNaN(n) && n >= 1 && n <= 54)) {
                    records.push({
                      Type: 'lottotexas',
                      Numbers: numbers
                    });
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
            this.lotteryData = {
              [game]: records
            };
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

  async generateFrequencyPicks(type, count) {
    console.log(`Generating ${count} frequency picks for ${type}`);
    
    const gameData = this.lotteryData[type];
    if (!gameData) {
      throw new Error(`No game data available for ${type}`);
    }

    const picks = [];
    for (let i = 0; i < count; i++) {
      if (type === 'powerball') {
        // Generate regular numbers (1-69)
        const regularNumbers = [];
        const usedNumbers = new Set();

        // Generate 5 unique regular numbers between 1 and 69
        while (regularNumbers.length < 5) {
          const num = Math.floor(Math.random() * 69) + 1;
          if (!usedNumbers.has(num)) {
            usedNumbers.add(num);
            regularNumbers.push(num);
          }
        }

        // Sort regular numbers
        regularNumbers.sort((a, b) => a - b);

        // Generate Powerball number (1-26) completely independently
        const powerballNumber = Math.floor(Math.random() * 26) + 1;

        console.log('Generated Powerball pick:', {
          regularNumbers,
          powerballNumber
        });

        picks.push({
          Type: 'powerball',
          RegularNumbers: regularNumbers,
          Powerball: powerballNumber
        });
      } else {
        // For Lotto Texas, generate 6 numbers
        const numbers = [];
        const usedNumbers = new Set();

        while (numbers.length < 6) {
          const num = Math.floor(Math.random() * 54) + 1;
          if (!usedNumbers.has(num)) {
            usedNumbers.add(num);
            numbers.push(num);
          }
        }

        picks.push({
          Type: type,
          Numbers: numbers.sort((a, b) => a - b)
        });
      }
    }

    console.log('Generated picks:', picks);
    return picks;
  }

  selectNumbersByFrequency(type) {
    const gameData = this.lotteryData[type];
    if (!gameData) {
      throw new Error(`No game data available for ${type}`);
    }

    // Filter valid records based on game type
    const validRecords = gameData.filter(record => {
      if (type === 'powerball') {
        // For Powerball, check if all numbers are within valid ranges
        const regularNumbers = [record.Num1, record.Num2, record.Num3, record.Num4, record.Num5];
        const powerball = record.Powerball;
        
        // Check if all regular numbers are between 1 and 69
        const validRegularNumbers = regularNumbers.every(num => num >= 1 && num <= 69);
        // Check if Powerball is between 1 and 26
        const validPowerball = powerball >= 1 && powerball <= 26;
        
        return validRegularNumbers && validPowerball;
      } else {
        // For Lotto Texas, check if all numbers are between 1 and 54
        const numbers = [record.Num1, record.Num2, record.Num3, record.Num4, record.Num5, record.Num6];
        return numbers.every(num => num >= 1 && num <= 54);
      }
    });

    console.log(`Found ${validRecords.length} valid records for ${type}`);

    // Calculate frequency of each number
    const frequency = {};
    validRecords.forEach(record => {
      if (type === 'powerball') {
        // Count regular numbers (1-69)
        [record.Num1, record.Num2, record.Num3, record.Num4, record.Num5].forEach(num => {
          if (num >= 1 && num <= 69) {
            frequency[num] = (frequency[num] || 0) + 1;
          }
        });
        // Count Powerball numbers (1-26)
        if (record.Powerball >= 1 && record.Powerball <= 26) {
          frequency[`pb_${record.Powerball}`] = (frequency[`pb_${record.Powerball}`] || 0) + 1;
        }
      } else {
        // Count Lotto Texas numbers (1-54)
        [record.Num1, record.Num2, record.Num3, record.Num4, record.Num5, record.Num6].forEach(num => {
          if (num >= 1 && num <= 54) {
            frequency[num] = (frequency[num] || 0) + 1;
          }
        });
      }
    });

    // Select numbers based on frequency
    const selectedNumbers = [];
    const usedNumbers = new Set();

    if (type === 'powerball') {
      // Select 5 regular numbers (1-69)
      const regularFrequencies = Object.entries(frequency)
        .filter(([key]) => !key.startsWith('pb_'))
        .map(([num, freq]) => ({ num: parseInt(num), freq }))
        .sort((a, b) => b.freq - a.freq);

      while (selectedNumbers.length < 5 && regularFrequencies.length > 0) {
        const { num } = regularFrequencies.shift();
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          selectedNumbers.push(num);
        }
      }

      // Select 1 Powerball number (1-26)
      const powerballFrequencies = Object.entries(frequency)
        .filter(([key]) => key.startsWith('pb_'))
        .map(([key, freq]) => ({ num: parseInt(key.replace('pb_', '')), freq }))
        .sort((a, b) => b.freq - a.freq);

      if (powerballFrequencies.length > 0) {
        const { num } = powerballFrequencies[0];
        selectedNumbers.push(num);
      }
    } else {
      // Select 6 Lotto Texas numbers
      const sortedFrequencies = Object.entries(frequency)
        .map(([num, freq]) => ({ num: parseInt(num), freq }))
        .sort((a, b) => b.freq - a.freq);

      while (selectedNumbers.length < 6 && sortedFrequencies.length > 0) {
        const { num } = sortedFrequencies.shift();
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          selectedNumbers.push(num);
        }
      }
    }

    console.log('Selected numbers:', selectedNumbers);
    return selectedNumbers;
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

      const frequency = {};
      
      // Count frequency of each number
      data.forEach(record => {
        if (game === 'powerball') {
          // Count regular numbers (1-69)
          if (record.RegularNumbers) {
            record.RegularNumbers.forEach(num => {
              if (num >= 1 && num <= 69) {
                frequency[num] = (frequency[num] || 0) + 1;
              }
            });
          }
          // Count Powerball (1-26)
          if (record.Powerball >= 1 && record.Powerball <= 26) {
            frequency[`pb_${record.Powerball}`] = (frequency[`pb_${record.Powerball}`] || 0) + 1;
          }
        } else {
          // Count Lotto Texas numbers (1-54)
          if (record.Numbers) {
            record.Numbers.forEach(num => {
              if (num >= 1 && num <= 54) {
                frequency[num] = (frequency[num] || 0) + 1;
              }
            });
          }
        }
      });

      return {
        frequency,
        totalDraws: data.length,
        game
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