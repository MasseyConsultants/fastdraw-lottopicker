const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

const csvWriter = createCsvWriter({
  path: path.join(__dirname, '../../lottery-data/generated_picks.csv'),
  header: [
    { id: 'Game', title: 'Game' },
    { id: 'PickType', title: 'PickType' },
    { id: 'Date', title: 'Date' },
    { id: 'Num1', title: 'Num1' },
    { id: 'Num2', title: 'Num2' },
    { id: 'Num3', title: 'Num3' },
    { id: 'Num4', title: 'Num4' },
    { id: 'Num5', title: 'Num5' },
    { id: 'Num6', title: 'Num6' },
    { id: 'Powerball', title: 'Powerball' }
  ],
  append: true
});

/**
 * Saves lottery picks to the CSV file
 * @param {Object} pick - The pick object to save
 * @param {string} pick.Game - The game type (Lotto Texas or Powerball)
 * @param {string} pick.PickType - The type of pick (frequency or ai)
 * @param {number[]} pick.Numbers - Array of numbers
 * @param {number} [pick.Powerball] - Powerball number (for Powerball game)
 * @returns {Promise<void>}
 */
async function savePick(pick) {
  try {
    const record = {
      Game: pick.Game,
      PickType: pick.PickType,
      Date: new Date().toISOString().split('T')[0],
      Num1: pick.Numbers[0],
      Num2: pick.Numbers[1],
      Num3: pick.Numbers[2],
      Num4: pick.Numbers[3],
      Num5: pick.Numbers[4],
      Num6: pick.Game === 'Lotto Texas' ? pick.Numbers[5] : '',
      Powerball: pick.Game === 'Powerball' ? pick.Powerball : ''
    };

    await csvWriter.writeRecords([record]);
  } catch (error) {
    console.error('Error saving pick to CSV:', error);
    throw error;
  }
}

module.exports = {
  savePick
}; 