import { Difficulty, GameConfig } from './types';

export const ASSETS = {
  playerBird: 'https://i.ibb.co/Wvyyxnyj/file-000000003ba072098c9aa8223875529c.png',
  enemyBird: 'https://i.ibb.co/fV2GbB87/Chat-GPT-Image-Jun-1-2025-09-53-38-AM.png',
  airplane1: 'https://i.ibb.co/QvwYnDT4/Cartoon-Airplane-in-Bold-Colours.png',
  airplane2: 'https://i.ibb.co/GQzNK10B/Chat-GPT-Image-Jun-1-2025-10-00-38-AM.png',
  cloud: 'https://i.ibb.co/DPHjwLQQ/Chat-GPT-Image-Jun-1-2025-09-53-42-AM.png',
  doracake: './assets/doracake.png',
  bgLayer1: 'https://i.ibb.co/NgmzVBW1/Cartoon-Platform-Landscape-with-Greenery.png', // Land
  bgLayer2: 'https://i.ibb.co/SDC0T4mR/Chat-GPT-Image-Jun-2-2025-11-05-32-PM.png', // Mountains
  bgLayer3: 'https://i.ibb.co/2YP8rv7J/Gentle-Cloudscape-in-Blue-Sky.png', // Sky
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  [Difficulty.EASY]: {
    gravity: 0.18, // Reduced from 0.25 (Looser)
    jumpStrength: -4.8, 
    spawnRate: 2000,
    gameSpeed: 3
  },
  [Difficulty.NORMAL]: {
    gravity: 0.22, // Reduced from 0.30 (Looser)
    jumpStrength: -5.8,
    spawnRate: 1600,
    gameSpeed: 3.8
  },
  [Difficulty.HARD]: {
    gravity: 0.32, // Reduced from 0.40 (Looser)
    jumpStrength: -7.0,
    spawnRate: 1200,
    gameSpeed: 5.5
  }
};

export const SHOOT_COOLDOWN = 1500;
export const RAPID_FIRE_COOLDOWN = 150; // Super fast shooting
export const SUPER_MODE_DURATION = 5000; // 5 Seconds of glory
export const STORAGE_KEY = 'doraemon_adventure_highscore';