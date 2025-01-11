import express from 'express';
import path from 'path';

const router = express.Router();

// Route to run a specific flag episode
router.post('/:season/:episode', async (req, res) => {
  try {
    const { season, episode } = req.params;
    const flagPath = `../flags/s${season.padStart(2, '0')}e${episode.padStart(2, '0')}/index.ts`;
    
    // Dynamic import of flag module
    const flag = await import(flagPath);
    const result = await flag.default();
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error running flag:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to list all available flag episodes
router.get('/', async (req, res) => {
  try {
    // You might want to implement flag discovery logic here
    // For now, just return the available flags
    res.json({ 
      success: true, 
      flags: [
        { season: '02', episode: '02', description: 'OCR and Message Decoding' }
      ]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to get specific season episodes
router.get('/:season', async (req, res) => {
  try {
    const { season } = req.params;
    // You can implement logic to list all episodes in a season
    res.json({ 
      success: true, 
      season: season.padStart(2, '0'),
      episodes: [
        { episode: '02', description: 'OCR and Message Decoding' }
      ]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Route to get specific episode details
router.get('/:season/:episode', async (req, res) => {
  try {
    const { season, episode } = req.params;
    const flagId = `s${season.padStart(2, '0')}e${episode.padStart(2, '0')}`;
    
    res.json({ 
      success: true, 
      flagId,
      description: 'OCR and Message Decoding',
      // You can add more metadata about the flag here
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
