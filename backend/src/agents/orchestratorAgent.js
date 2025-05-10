const ParserAgent = require('./parserAgent');
const AnalysisAgent = require('./analysisAgent');
const AIPickAgent = require('./aiPickAgent');
const { savePick } = require('../services/csvService');

class OrchestratorAgent {
  constructor() {
    this.parserAgent = new ParserAgent();
    this.analysisAgent = new AnalysisAgent();
    this.aiPickAgent = new AIPickAgent();
    this.initialized = false;
  }

  /**
   * Initializes the orchestrator and loads data
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.parserAgent.loadData();
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing orchestrator:', error);
      throw error;
    }
  }

  /**
   * Generates frequency-based picks
   * @param {number} draws - Number of draws to generate
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Promise<Array>} Generated picks
   */
  async generateFrequencyPicks(draws, game) {
    try {
      await this.initialize();

      // Get and normalize data
      const rawData = this.parserAgent.getData(game);
      const normalizedData = this.parserAgent.normalizeData(rawData, game);

      // Analyze data
      const frequency = this.analysisAgent.analyzeFrequency(normalizedData, game);
      const patterns = this.analysisAgent.analyzePatterns(normalizedData, game);

      // Generate weighted numbers
      const weightedNumbers = this.analysisAgent.generateWeightedNumbers(
        frequency,
        patterns,
        game
      );

      // Generate picks
      const picks = [];
      const gameConfig = {
        lotto: { count: 6, max: 54 },
        powerball: { count: 5, max: 69, powerballMax: 26 }
      };
      const config = gameConfig[game];

      for (let i = 0; i < draws; i++) {
        const numbers = weightedNumbers.slice(0, config.count);
        const pick = {
          Game: game === 'lotto' ? 'Lotto Texas' : 'Powerball',
          PickType: 'frequency',
          Numbers: numbers
        };

        if (game === 'powerball') {
          pick.Powerball = weightedNumbers[config.count] || 
            Math.floor(Math.random() * config.powerballMax) + 1;
        }

        await savePick(pick);
        picks.push(pick);
      }

      return picks;
    } catch (error) {
      console.error('Error generating frequency picks:', error);
      throw error;
    }
  }

  /**
   * Generates AI-based picks
   * @param {number} draws - Number of draws to generate
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Promise<Array>} Generated picks
   */
  async generateAIPicks(draws, game) {
    try {
      await this.initialize();

      // Get and normalize data
      const rawData = this.parserAgent.getData(game);
      const normalizedData = this.parserAgent.normalizeData(rawData, game);

      // Analyze data
      const frequency = this.analysisAgent.analyzeFrequency(normalizedData, game);
      const patterns = this.analysisAgent.analyzePatterns(normalizedData, game);

      // Generate AI picks
      const analysis = { frequency, patterns };
      const picks = await this.aiPickAgent.generatePicks(draws, game, analysis);

      // Save picks
      for (const pick of picks) {
        await savePick(pick);
      }

      return picks;
    } catch (error) {
      console.error('Error generating AI picks:', error);
      // Fallback to frequency-based picks
      return this.generateFrequencyPicks(draws, game);
    }
  }

  /**
   * Gets analysis results for a game
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Object} Analysis results
   */
  async getAnalysis(game) {
    try {
      await this.initialize();

      const rawData = this.parserAgent.getData(game);
      const normalizedData = this.parserAgent.normalizeData(rawData, game);

      const frequency = this.analysisAgent.analyzeFrequency(normalizedData, game);
      const patterns = this.analysisAgent.analyzePatterns(normalizedData, game);

      return {
        frequency: {
          hot: Array.from(frequency.numbers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([num, count]) => ({ number: num, count })),
          cold: Array.from(frequency.numbers.entries())
            .sort((a, b) => a[1] - b[1])
            .slice(0, 10)
            .map(([num, count]) => ({ number: num, count }))
        },
        patterns: {
          sumRange: patterns.sumRange,
          commonPairs: Array.from(patterns.pairs.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([pair, count]) => ({
              numbers: pair.split('-').map(Number),
              count
            }))
        }
      };
    } catch (error) {
      console.error('Error getting analysis:', error);
      throw error;
    }
  }
}

module.exports = OrchestratorAgent; 