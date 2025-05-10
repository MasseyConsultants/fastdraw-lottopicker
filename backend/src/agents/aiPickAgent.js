const axios = require('axios');

class AIPickAgent {
  constructor() {
    this.apiKey = process.env.XAI_API_KEY;
    this.apiEndpoint = process.env.XAI_API_ENDPOINT || 'https://api.xai.com/v1/generate';
  }

  /**
   * Generates AI-based lottery picks
   * @param {number} draws - Number of draws to generate
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @param {Object} analysis - Analysis results from AnalysisAgent
   * @returns {Promise<Array>} AI-generated picks
   */
  async generatePicks(draws, game, analysis) {
    try {
      const picks = [];
      const gameConfig = {
        lotto: { count: 6, max: 54 },
        powerball: { count: 5, max: 69, powerballMax: 26 }
      };

      const config = gameConfig[game];

      for (let i = 0; i < draws; i++) {
        const pick = await this.generateSinglePick(game, config, analysis);
        picks.push(pick);
      }

      return picks;
    } catch (error) {
      console.error('Error generating AI picks:', error);
      throw error;
    }
  }

  /**
   * Generates a single AI-based pick
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @param {Object} config - Game configuration
   * @param {Object} analysis - Analysis results
   * @returns {Promise<Object>} Generated pick
   */
  async generateSinglePick(game, config, analysis) {
    try {
      // Prepare context for AI
      const context = this.prepareContext(game, config, analysis);

      // Call AI API
      const response = await axios.post(
        this.apiEndpoint,
        {
          prompt: this.generatePrompt(context),
          max_tokens: 100,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Parse and validate AI response
      const numbers = this.parseAIResponse(response.data, config);

      return {
        Game: game === 'lotto' ? 'Lotto Texas' : 'Powerball',
        PickType: 'ai',
        Numbers: numbers.slice(0, config.count),
        Powerball: game === 'powerball' ? numbers[config.count] : undefined
      };
    } catch (error) {
      console.error('Error generating single AI pick:', error);
      // Fallback to frequency-based pick if AI fails
      return this.generateFallbackPick(game, config, analysis);
    }
  }

  /**
   * Prepares context for AI prompt
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @param {Object} config - Game configuration
   * @param {Object} analysis - Analysis results
   * @returns {Object} Context for AI
   */
  prepareContext(game, config, analysis) {
    return {
      game,
      config,
      frequency: {
        hot: Array.from(analysis.frequency.numbers.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([num]) => num),
        cold: Array.from(analysis.frequency.numbers.entries())
          .sort((a, b) => a[1] - b[1])
          .slice(0, 10)
          .map(([num]) => num)
      },
      patterns: {
        sumRange: analysis.patterns.sumRange,
        commonPairs: Array.from(analysis.patterns.pairs.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([pair]) => pair.split('-').map(Number))
      }
    };
  }

  /**
   * Generates prompt for AI
   * @param {Object} context - Context for AI
   * @returns {string} AI prompt
   */
  generatePrompt(context) {
    return `Generate ${context.game === 'lotto' ? 'Lotto Texas' : 'Powerball'} numbers based on the following analysis:
    - Hot numbers: ${context.frequency.hot.join(', ')}
    - Cold numbers: ${context.frequency.cold.join(', ')}
    - Common pairs: ${context.patterns.commonPairs.map(pair => pair.join('-')).join(', ')}
    - Sum range: ${context.patterns.sumRange.min} to ${context.patterns.sumRange.max}
    
    Generate ${context.config.count} unique numbers between 1 and ${context.config.max}${
      context.game === 'powerball' ? `, and a Powerball number between 1 and ${context.config.powerballMax}` : ''
    }.`;
  }

  /**
   * Parses AI response into valid numbers
   * @param {Object} response - AI API response
   * @param {Object} config - Game configuration
   * @returns {Array} Parsed numbers
   */
  parseAIResponse(response, config) {
    // Extract numbers from AI response
    const numbers = response.choices[0].text
      .match(/\d+/g)
      .map(Number)
      .filter(num => num >= 1 && num <= config.max);

    // Ensure unique numbers
    const uniqueNumbers = [...new Set(numbers)];

    // If we don't have enough numbers, generate random ones
    while (uniqueNumbers.length < config.count + (config.powerballMax ? 1 : 0)) {
      const randomNum = Math.floor(Math.random() * config.max) + 1;
      if (!uniqueNumbers.includes(randomNum)) {
        uniqueNumbers.push(randomNum);
      }
    }

    return uniqueNumbers;
  }

  /**
   * Generates a fallback pick using frequency analysis
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @param {Object} config - Game configuration
   * @param {Object} analysis - Analysis results
   * @returns {Object} Fallback pick
   */
  generateFallbackPick(game, config, analysis) {
    const weightedNumbers = analysis.generateWeightedNumbers(
      analysis.frequency,
      analysis.patterns,
      game
    );

    const numbers = weightedNumbers.slice(0, config.count);
    const powerball = game === 'powerball'
      ? weightedNumbers[config.count] || Math.floor(Math.random() * config.powerballMax) + 1
      : undefined;

    return {
      Game: game === 'lotto' ? 'Lotto Texas' : 'Powerball',
      PickType: 'frequency', // Mark as frequency since AI failed
      Numbers: numbers,
      Powerball: powerball
    };
  }
}

module.exports = AIPickAgent; 