export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  rotation: number;
}

export interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'bird' | 'airplane1' | 'airplane2' | 'cloud' | 'doracake';
  falling?: boolean;
  rotation?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface GameConfig {
  gravity: number;
  jumpStrength: number;
  spawnRate: number;
  gameSpeed: number;
}