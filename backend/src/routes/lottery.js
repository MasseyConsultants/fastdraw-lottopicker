const express = require('express');
const router = express.Router();
const lotteryService = require('../services/lotteryService');

// Generate frequency-based picks
router.get('/picks', async (req, res) => {
  try {
    const { draws = 1, game = 'lottotexas' } = req.query;
    // Load lottery data first
    await lotteryService.loadLotteryData(game);
    const picks = await lotteryService.generateFrequencyPicks(game, parseInt(draws));
    res.json(picks);
  } catch (error) {
    console.error('Error in /picks route:', error);
    res.status(500).json({ error: error.message || 'Failed to generate picks' });
  }
});

// Generate AI-based picks
router.get('/ai-picks', async (req, res) => {
  try {
    const { draws = 1, game = 'lottotexas' } = req.query;
    // For now, fall back to frequency-based picks
    const picks = await lotteryService.generateFrequencyPicks(game, parseInt(draws));
    res.json(picks);
  } catch (error) {
    console.error('Error in /ai-picks route:', error);
    res.status(500).json({ error: error.message || 'Failed to generate AI picks' });
  }
});

// Get analytics (renamed from analysis to match frontend)
router.get('/analytics', async (req, res) => {
  try {
    const { game = 'lottotexas' } = req.query;
    const analysis = await lotteryService.getAnalysis(game);
    res.json(analysis);
  } catch (error) {
    console.error('Error in /analytics route:', error);
    res.status(500).json({ error: error.message || 'Failed to get analytics' });
  }
});

module.exports = router; 