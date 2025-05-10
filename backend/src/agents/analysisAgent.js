class AnalysisAgent {
  constructor() {
    this.frequencyCache = new Map();
    this.patternCache = new Map();
  }

  /**
   * Analyzes number frequency in historical data
   * @param {Array} data - Normalized lottery data
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Object} Frequency analysis results
   */
  analyzeFrequency(data, game) {
    const cacheKey = `${game}_frequency`;
    if (this.frequencyCache.has(cacheKey)) {
      return this.frequencyCache.get(cacheKey);
    }

    const frequency = {
      numbers: new Map(),
      powerball: game === 'powerball' ? new Map() : null,
      recent: {
        numbers: new Map(),
        powerball: game === 'powerball' ? new Map() : null
      }
    };

    // Calculate overall frequency
    data.forEach(draw => {
      draw.numbers.forEach(num => {
        frequency.numbers.set(num, (frequency.numbers.get(num) || 0) + 1);
      });
      if (game === 'powerball' && draw.powerball) {
        frequency.powerball.set(draw.powerball, (frequency.powerball.get(draw.powerball) || 0) + 1);
      }
    });

    // Calculate recent frequency (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    data
      .filter(draw => draw.date >= thirtyDaysAgo)
      .forEach(draw => {
        draw.numbers.forEach(num => {
          frequency.recent.numbers.set(num, (frequency.recent.numbers.get(num) || 0) + 1);
        });
        if (game === 'powerball' && draw.powerball) {
          frequency.recent.powerball.set(draw.powerball, (frequency.recent.powerball.get(draw.powerball) || 0) + 1);
        }
      });

    this.frequencyCache.set(cacheKey, frequency);
    return frequency;
  }

  /**
   * Analyzes number patterns in historical data
   * @param {Array} data - Normalized lottery data
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Object} Pattern analysis results
   */
  analyzePatterns(data, game) {
    const cacheKey = `${game}_patterns`;
    if (this.patternCache.has(cacheKey)) {
      return this.patternCache.get(cacheKey);
    }

    const patterns = {
      pairs: new Map(),
      triplets: new Map(),
      sumRange: {
        min: Infinity,
        max: -Infinity,
        average: 0
      },
      oddEvenRatio: []
    };

    // Analyze pairs and triplets
    data.forEach(draw => {
      const numbers = draw.numbers;
      
      // Analyze pairs
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pair = [numbers[i], numbers[j]].sort((a, b) => a - b);
          const pairKey = pair.join('-');
          patterns.pairs.set(pairKey, (patterns.pairs.get(pairKey) || 0) + 1);
        }
      }

      // Analyze triplets
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          for (let k = j + 1; k < numbers.length; k++) {
            const triplet = [numbers[i], numbers[j], numbers[k]].sort((a, b) => a - b);
            const tripletKey = triplet.join('-');
            patterns.triplets.set(tripletKey, (patterns.triplets.get(tripletKey) || 0) + 1);
          }
        }
      }

      // Analyze sum range
      const sum = numbers.reduce((a, b) => a + b, 0);
      patterns.sumRange.min = Math.min(patterns.sumRange.min, sum);
      patterns.sumRange.max = Math.max(patterns.sumRange.max, sum);
      patterns.sumRange.average = (patterns.sumRange.average * (data.indexOf(draw)) + sum) / (data.indexOf(draw) + 1);

      // Analyze odd-even ratio
      const oddCount = numbers.filter(n => n % 2 === 1).length;
      const evenCount = numbers.length - oddCount;
      patterns.oddEvenRatio.push({ odd: oddCount, even: evenCount });
    });

    this.patternCache.set(cacheKey, patterns);
    return patterns;
  }

  /**
   * Generates weighted numbers based on analysis
   * @param {Object} frequency - Frequency analysis results
   * @param {Object} patterns - Pattern analysis results
   * @param {string} game - Game type ('lotto' or 'powerball')
   * @returns {Array} Weighted numbers
   */
  generateWeightedNumbers(frequency, patterns, game) {
    const weights = new Map();
    const maxNumber = game === 'lotto' ? 54 : 69;

    // Apply frequency weights
    for (let i = 1; i <= maxNumber; i++) {
      const freqWeight = frequency.numbers.get(i) || 0;
      const recentWeight = frequency.recent.numbers.get(i) || 0;
      weights.set(i, (freqWeight * 0.7) + (recentWeight * 0.3));
    }

    // Adjust weights based on patterns
    const avgSum = patterns.sumRange.average;
    const sumWeight = 0.2; // Weight for sum-based adjustments

    weights.forEach((weight, number) => {
      // Adjust weight based on sum range
      const sumContribution = number / avgSum;
      weights.set(number, weight * (1 + (sumContribution * sumWeight)));
    });

    return Array.from(weights.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([number]) => number);
  }
}

module.exports = AnalysisAgent; 