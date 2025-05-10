const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');

class ParserAgent {
  constructor() {
    this.lottoTexasData = [];
    this.powerballData = [];
  }

  /**
   * Parses a CSV file and returns structured data
   * @param {string} filePath - Path to the CSV file
   * @returns {Promise<Array>} Parsed data
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  /**
   * Loads and parses lottery data files
   * @returns {Promise<void>}
   */
  async loadData() {
    try {
      const dataDir = path.join(__dirname, '../../lottery-data');
      
      // Load Lotto Texas data
      const lottoTexasPath = path.join(dataDir, 'lottotexas.csv');
      if (fs.existsSync(lottoTexasPath)) {
        this.lottoTexasData = await this.parseCSV(lottoTexasPath);
      }

      // Load Powerball data
      const powerballPath = path.join(dataDir, 'powerball.csv');
      if (fs.existsSync(powerballPath)) {
        this.powerballData = await this.parseCSV(powerballPath);
      }
    } catch (error) {
      console.error('Error loading lottery data:', error);
      throw error;
    }
  }

  /**
   * Gets parsed data for a specific game
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Array} Parsed data
   */
  getData(game) {
    return game === 'lotto' ? this.lottoTexasData : this.powerballData;
  }

  /**
   * Normalizes data based on date ranges and format changes
   * @param {Array} data - Raw parsed data
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Array} Normalized data
   */
  normalizeData(data, game) {
    return data.map(row => {
      const normalized = {
        date: new Date(`${row.Year}-${row.Month}-${row.Day}`),
        numbers: []
      };

      // Extract numbers based on game and date
      if (game === 'lotto') {
        // Lotto Texas format changes
        if (row.BonusBall) {
          normalized.numbers = [
            parseInt(row.Num1),
            parseInt(row.Num2),
            parseInt(row.Num3),
            parseInt(row.Num4),
            parseInt(row.Num5),
            parseInt(row.BonusBall)
          ];
        } else {
          normalized.numbers = [
            parseInt(row.Num1),
            parseInt(row.Num2),
            parseInt(row.Num3),
            parseInt(row.Num4),
            parseInt(row.Num5),
            parseInt(row.Num6)
          ];
        }
      } else {
        // Powerball format
        normalized.numbers = [
          parseInt(row.Num1),
          parseInt(row.Num2),
          parseInt(row.Num3),
          parseInt(row.Num4),
          parseInt(row.Num5)
        ];
        normalized.powerball = parseInt(row.Powerball);
      }

      return normalized;
    });
  }
}

module.exports = ParserAgent; 