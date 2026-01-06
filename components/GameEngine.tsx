import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Difficulty, Player, Entity, Particle, Bullet } from '../types';
import { ASSETS, DIFFICULTY_CONFIGS, STORAGE_KEY, SHOOT_COOLDOWN, RAPID_FIRE_COOLDOWN, SUPER_MODE_DURATION } from '../constants';
import { Volume2, VolumeX, Pause, Play, Target, Zap } from 'lucide-react';

interface GameEngineProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  difficulty: Difficulty;
  score: number;
  setScore: (score: number) => void;
  setHighScore: (score: number) => void;
}

// Base resolution height for scaling calculations
const BASE_HEIGHT = 600;

export const GameEngine: React.FC<GameEngineProps> = ({
  gameState,
  setGameState,
  difficulty,
  score,
  setScore,
  setHighScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const cooldownRef = useRef<HTMLDivElement>(null); // For direct DOM manipulation of cooldown UI
  
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSuperMode, setIsSuperMode] = useState(false); // React state for UI feedback
  const [countdown, setCountdown] = useState<number | null>(null);

  // Mutable Game State (Refs for performance)
  const playerRef = useRef<Player>({ x: 80, y: 300, width: 85, height: 68, velocity: 0, rotation: 0 });
  const enemiesRef = useRef<Entity[]>([]);
  const cloudsRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  
  const lastTimeRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastCloudTimeRef = useRef<number>(0);
  const lastShootTimeRef = useRef<number>(0);
  const scoreAccumulatorRef = useRef<number>(0);
  const superModeEndTimeRef = useRef<number>(0);
  
  // Images Refs
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const bgOffsetsRef = useRef<number[]>([0, 0, 0]);

  // Scale Ref
  const scaleRef = useRef<number>(1);

  // Initialize Images
  useEffect(() => {
    const loadImages = () => {
      const urls = Object.entries(ASSETS);
      urls.forEach(([key, url]) => {
        const img = new Image();
        img.src = url;
        imagesRef.current[key] = img;
      });
    };
    loadImages();
  }, []);

  const getScaleFactor = (height: number) => {
    const rawScale = height / BASE_HEIGHT;
    return Math.max(0.6, Math.min(2.5, rawScale)); 
  };

  // Reset Game Logic
  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Update scale based on current height
    scaleRef.current = getScaleFactor(canvas.height);
    const scale = scaleRef.current;

    playerRef.current = { 
      x: canvas.width * 0.1, 
      y: canvas.height / 2, 
      width: 85 * scale, 
      height: 68 * scale, 
      velocity: 0, 
      rotation: 0 
    };
    enemiesRef.current = [];
    cloudsRef.current = [];
    particlesRef.current = [];
    bulletsRef.current = [];
    scoreAccumulatorRef.current = 0;
    lastShootTimeRef.current = 0; 
    superModeEndTimeRef.current = 0;
    setIsSuperMode(false);
    setScore(0);
    
    // Initial clouds
    for(let i=0; i<3; i++) {
        cloudsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.4),
            width: (80 + Math.random() * 40) * scale,
            height: 50 * scale,
            speed: (0.5 + Math.random()) * scale,
            type: 'cloud'
        });
    }
  }, [setScore]);

  // Initialize on game start with countdown
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      resetGame();
      setIsPaused(false);
      setCountdown(3);
    }
  }, [gameState, resetGame]);

  // Countdown Logic
  useEffect(() => {
      if (countdown !== null && countdown > 0) {
          const timer = setTimeout(() => {
              setCountdown(c => (c !== null ? c - 1 : null));
          }, 1000);
          return () => clearTimeout(timer);
      } else if (countdown === 0) {
          // Countdown finished, Start Game
          const timer = setTimeout(() => {
              setCountdown(null);
              lastTimeRef.current = performance.now();
              lastSpawnTimeRef.current = performance.now();
          }, 500); // Brief moment to show "0" or "GO" if we wanted, but here we just wait slightly
          return () => clearTimeout(timer);
      }
  }, [countdown]);

  // Particle System
  const createExplosion = (x: number, y: number, color: string, count = 15) => {
    const scale = scaleRef.current;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12 * scale,
        vy: (Math.random() - 0.5) * 12 * scale,
        life: 1.0,
        color,
        size: (Math.random() * 5 + 2) * scale
      });
    }
  };

  const createJumpParticles = (x: number, y: number) => {
    const scale = scaleRef.current;
    for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
            x,
            y: y + (30 * scale),
            vx: (Math.random() - 0.5) * 4 * scale,
            vy: Math.random() * 3 * scale,
            life: 0.6,
            color: '#ffffff',
            size: (Math.random() * 4 + 2) * scale
        });
    }
  }

  // Input Handling
  const handleJump = useCallback(() => {
    if (gameState !== GameState.PLAYING || isPaused || countdown !== null) return;
    
    const config = DIFFICULTY_CONFIGS[difficulty];
    playerRef.current.velocity = config.jumpStrength * scaleRef.current;
    createJumpParticles(playerRef.current.x, playerRef.current.y);
  }, [gameState, isPaused, difficulty, countdown]);

  const handleShoot = useCallback(() => {
      if (gameState !== GameState.PLAYING || isPaused || countdown !== null) return;
      
      const now = performance.now();
      const isSuper = now < superModeEndTimeRef.current;
      const cooldown = isSuper ? RAPID_FIRE_COOLDOWN : SHOOT_COOLDOWN;

      if (now - lastShootTimeRef.current < cooldown) return;

      const scale = scaleRef.current;
      
      // Recoil (Reduced recoil in super mode for stability)
      playerRef.current.velocity += (isSuper ? 0.2 : 0.5) * scale;
      
      // Bullet properties
      const bulletSpeed = isSuper ? 25 * scale : 18 * scale;
      const bulletSize = isSuper ? 1.5 : 1.0;

      bulletsRef.current.push({
          x: playerRef.current.x + playerRef.current.width * 0.8,
          y: playerRef.current.y + playerRef.current.height * 0.5,
          width: 35 * scale * bulletSize,
          height: 25 * scale * bulletSize,
          speed: bulletSpeed
      });
      
      lastShootTimeRef.current = now;

  }, [gameState, isPaused, countdown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') handleJump();
      if (e.key === 's' || e.key === 'S' || e.key === 'Shift') handleShoot();
      if (e.key === 'p' || e.key === 'P') setIsPaused(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, handleShoot]);

  // Collision Detection
  const checkCollision = (p: {x:number, y:number, width:number, height:number}, e: {x:number, y:number, width:number, height:number}) => {
    const pad = 10 * scaleRef.current; 
    return p.x + pad < e.x + e.width - pad && 
           p.x + p.width - pad > e.x + pad && 
           p.y + pad < e.y + e.height - pad && 
           p.y + p.height - pad > e.y + pad;
  };

  // Main Game Loop
  const update = useCallback((time: number) => {
    if (gameState !== GameState.PLAYING || isPaused) {
      // If paused, just keep requesting frames but don't update physics (unless we want to draw pause screen underneath)
      // Actually we still need to draw if we want to see the frozen game behind pause menu
      if (gameState === GameState.PLAYING && isPaused) {
          // Fall through to draw but skip logic
      } else if (gameState !== GameState.PLAYING) {
          // If menu or game over, stop loop
          requestRef.current = requestAnimationFrame(update);
          return;
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Time management
    let deltaTime = 0;
    if (countdown === null && !isPaused) {
        deltaTime = time - lastTimeRef.current;
    }
    lastTimeRef.current = time;

    const scale = scaleRef.current;
    const config = DIFFICULTY_CONFIGS[difficulty];
    
    // Super Mode Check
    const isSuper = time < superModeEndTimeRef.current;
    if (isSuper !== isSuperMode) {
        setIsSuperMode(isSuper);
    }

    // --- Update Cooldown UI ---
    if (cooldownRef.current) {
        const cooldown = isSuper ? RAPID_FIRE_COOLDOWN : SHOOT_COOLDOWN;
        const elapsed = time - lastShootTimeRef.current;
        const progress = Math.min(1, elapsed / cooldown);
        const degrees = progress * 360;
        
        // Gold for super mode, default transparent black for normal
        const color = isSuper ? 'rgba(255, 215, 0, 0.5)' : 'rgba(0,0,0,0.7)';
        cooldownRef.current.style.background = `conic-gradient(transparent ${degrees}deg, ${color} ${degrees}deg)`;
        
        if (progress >= 1) {
            cooldownRef.current.parentElement?.classList.add('scale-105', isSuper ? 'shadow-yellow-500/80' : 'shadow-red-500/50');
            cooldownRef.current.parentElement?.classList.remove('opacity-50');
        } else {
            cooldownRef.current.parentElement?.classList.remove('scale-105', isSuper ? 'shadow-yellow-500/80' : 'shadow-red-500/50');
            cooldownRef.current.parentElement?.classList.add('opacity-50');
        }
    }

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Backgrounds ---
    // If countdown or paused, backgrounds don't move
    const moveBg = !isPaused && countdown === null;
    const bgSpeeds = [0.2, 0.5, 2].map(s => s * scale); 
    const layers = ['bgLayer3', 'bgLayer2', 'bgLayer1'];
    
    layers.forEach((layerKey, index) => {
      const img = imagesRef.current[layerKey];
      if (img) {
        if (moveBg) {
             bgOffsetsRef.current[index] = (bgOffsetsRef.current[index] - bgSpeeds[index] * (deltaTime / 16)) % canvas.width;
        }
        ctx.drawImage(img, bgOffsetsRef.current[index], 0, canvas.width, canvas.height);
        ctx.drawImage(img, bgOffsetsRef.current[index] + canvas.width, 0, canvas.width, canvas.height);
      }
    });

    // --- Logic Updates (Only if running) ---
    const isRunning = !isPaused && countdown === null;

    if (isRunning) {
        // Player Physics
        playerRef.current.velocity += (config.gravity * scale);
        playerRef.current.y += playerRef.current.velocity;
        
        const normalizedVel = playerRef.current.velocity / scale;
        playerRef.current.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (normalizedVel * 0.08)));

        if (playerRef.current.y + playerRef.current.height > canvas.height) {
            playerRef.current.y = canvas.height - playerRef.current.height;
            gameOver();
            return;
        }
        if (playerRef.current.y < 0) {
            playerRef.current.y = 0;
            playerRef.current.velocity = 0.5 * scale;
        }

        // Spawning
        if (time - lastSpawnTimeRef.current > config.spawnRate) {
            const typeRand = Math.random();
            let type: Entity['type'] = 'bird';
            let width = 55;
            let height = 55;
            let speed = config.gameSpeed;

            if (Math.random() < 0.10) {
                type = 'doracake';
                width = 40; height = 40; speed = config.gameSpeed * 0.8;
            } else {
                if (score > 10 && typeRand > 0.65) {
                    if (Math.random() > 0.5) {
                        type = 'airplane1';
                        width = 95; height = 60; speed += 4.5; // Significantly faster
                    } else {
                        type = 'airplane2';
                        width = 95; height = 60; speed += 6.5; // Significantly faster
                    }
                }
            }

            enemiesRef.current.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - (100 * scale)),
                width: width * scale,
                height: height * scale,
                speed: speed * scale,
                type,
                falling: false,
                rotation: 0
            });
            lastSpawnTimeRef.current = time;
        }

        if (time - lastCloudTimeRef.current > 3000) {
            cloudsRef.current.push({
                x: canvas.width,
                y: Math.random() * (canvas.height * 0.5),
                width: (80 + Math.random() * 40) * scale,
                height: 50 * scale,
                speed: (1 + Math.random()) * scale,
                type: 'cloud'
            });
            lastCloudTimeRef.current = time;
        }
    }

    // --- Entity Drawing & Collision Logic ---
    
    // Bullets
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        const b = bulletsRef.current[i];
        
        if (isRunning) {
             const oldX = b.x;
             b.x += b.speed;
             
             // Check collisions
             for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
                const e = enemiesRef.current[j];
                if (!e.falling && e.type !== 'doracake') {
                    if (checkCollision(b, e) || (oldX < e.x + e.width && b.x > e.x && Math.abs(b.y - (e.y+e.height/2)) < e.height/2)) {
                        e.falling = true;
                        createExplosion(e.x + e.width/2, e.y + e.height/2, '#FFF', 8);
                        bulletsRef.current.splice(i, 1);
                        break;
                    }
                }
            }
        }

        ctx.save();
        ctx.shadowBlur = isSuper ? 15 : 10;
        ctx.shadowColor = isSuper ? "#FFD700" : "white";
        ctx.fillStyle = isSuper ? "#FFFACD" : "rgba(180, 220, 255, 0.9)";
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.width/2, b.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isSuper ? "#FFA500" : "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        
        if (isRunning && b.x > canvas.width) {
            bulletsRef.current.splice(i, 1);
        }
    }

    // Clouds
    cloudsRef.current.forEach((cloud, index) => {
        if (isRunning) cloud.x -= cloud.speed;
        const img = imagesRef.current['cloud'];
        if (img) {
            ctx.globalAlpha = 0.8;
            ctx.drawImage(img, cloud.x, cloud.y, cloud.width, cloud.height);
            ctx.globalAlpha = 1.0;
        }
        if (isRunning && cloud.x + cloud.width < 0) cloudsRef.current.splice(index, 1);
    });

    // Enemies
    enemiesRef.current.forEach((enemy, index) => {
        if (isRunning) {
            if (enemy.falling) {
                enemy.y += 10 * scale;
                enemy.x -= 2 * scale;
                enemy.rotation = (enemy.rotation || 0) + 0.2;
            } else {
                enemy.x -= enemy.speed;
                if (checkCollision(playerRef.current, enemy)) {
                    if (enemy.type === 'doracake') {
                        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FFD700', 30);
                        superModeEndTimeRef.current = performance.now() + SUPER_MODE_DURATION;
                        setScore(score + 5);
                        enemiesRef.current.splice(index, 1);
                        return;
                    } else if (isSuper) {
                        enemy.falling = true;
                        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FFA500', 15);
                        return;
                    } else {
                        createExplosion(playerRef.current.x, playerRef.current.y, '#ff0000', 20);
                        gameOver();
                        return;
                    }
                }
            }
        }
      
        // DRAWING LOGIC FOR ALL ENTITIES INCLUDING DORACAKE
        let imgKey = 'enemyBird';
        if (enemy.type === 'airplane1') imgKey = 'airplane1';
        if (enemy.type === 'airplane2') imgKey = 'airplane2';
        if (enemy.type === 'doracake') imgKey = 'doracake';
        
        const img = imagesRef.current[imgKey];
        if (img) {
            ctx.save();
            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            if (enemy.rotation) ctx.rotate(enemy.rotation);
            
            // Special glow effect for doracake
            if (enemy.type === 'doracake') {
                 ctx.shadowColor = '#FFD700';
                 ctx.shadowBlur = 15;
            }
            
            ctx.drawImage(img, -enemy.width/2, -enemy.height/2, enemy.width, enemy.height);
            ctx.restore();
        } else if (enemy.type === 'doracake') {
            // Fallback for doracake if image fails to load
            ctx.save();
            ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            ctx.fillStyle = '#CD853F'; 
            ctx.beginPath();
            ctx.ellipse(0, 0, enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (isRunning && (enemy.x + enemy.width < -100 || enemy.y > canvas.height)) {
            enemiesRef.current.splice(index, 1);
        }
    });

    // Player
    ctx.save();
    ctx.translate(playerRef.current.x + playerRef.current.width/2, playerRef.current.y + playerRef.current.height/2);
    ctx.rotate(playerRef.current.rotation);
    if (isSuper) {
        ctx.shadowColor = `hsl(${(time / 5) % 360}, 100%, 50%)`;
        ctx.shadowBlur = 20;
    }
    const pImg = imagesRef.current['playerBird'];
    if (pImg) {
      ctx.drawImage(pImg, -playerRef.current.width/2, -playerRef.current.height/2, playerRef.current.width, playerRef.current.height);
    } 
    ctx.restore();

    // Particles
    particlesRef.current.forEach((p, i) => {
      if (isRunning) {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      if (isRunning && p.life <= 0) particlesRef.current.splice(i, 1);
    });

    // Score
    if (isRunning) {
        scoreAccumulatorRef.current += deltaTime;
        if (scoreAccumulatorRef.current >= 500) {
            const newScore = score + 1;
            setScore(newScore);
            scoreAccumulatorRef.current = 0;
        }
    }

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, isPaused, score, setScore, difficulty, isSuperMode, countdown]);

  const gameOver = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const currentHigh = stored ? parseInt(stored) : 0;
    if (score > currentHigh) {
      localStorage.setItem(STORAGE_KEY, score.toString());
      setHighScore(score);
    }
    setGameState(GameState.GAME_OVER);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [update]);

  // Handle Resize
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current) {
              const prevHeight = canvasRef.current.height;
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = window.innerHeight;
              scaleRef.current = getScaleFactor(window.innerHeight);
              
              if (gameState === GameState.PLAYING && prevHeight > 0) {
                  const yRatio = playerRef.current.y / prevHeight;
                  playerRef.current.y = window.innerHeight * yRatio;
                  const scale = scaleRef.current;
                  playerRef.current.width = 85 * scale;
                  playerRef.current.height = 68 * scale;
              }
          }
      }
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
            if (e.button === 0) handleJump();
        }}
        onTouchStart={(e) => {
            handleJump();
        }}
        className="block w-full h-full cursor-pointer touch-none"
      />
      
      {/* Countdown Overlay */}
      {countdown !== null && gameState === GameState.PLAYING && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
              <span className="text-8xl md:text-9xl font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-bounce">
                  {countdown > 0 ? countdown : "GO!"}
              </span>
          </div>
      )}

      {/* Super Mode Indicator */}
      {isSuperMode && gameState === GameState.PLAYING && countdown === null && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none animate-pulse z-10">
              <span className="text-yellow-400 font-black text-2xl tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border-2 border-yellow-400 bg-black/40 px-4 py-1 rounded-full uppercase">
                  Hyper Mode!
              </span>
          </div>
      )}

      {/* Top HUD */}
      {gameState === GameState.PLAYING && (
        <>
            <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }} 
                    className="glass-btn p-3 rounded-full text-white hover:bg-white/20 transition-colors">
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
            </div>
            
             <div className="absolute top-6 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
                 <div className="bg-white/10 backdrop-blur-md px-10 py-2 rounded-full border border-white/20 shadow-xl">
                    <span className="text-4xl font-fredoka font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                        {score}
                    </span>
                 </div>
             </div>
        </>
      )}

      {/* Shoot Button (Bottom Right) */}
      {gameState === GameState.PLAYING && (
          <div 
            className="absolute bottom-8 right-8 z-20 flex flex-col items-center select-none"
            onTouchStart={(e) => {
                e.preventDefault(); // Prevent accidental mouse emulation / double firing
                e.stopPropagation();
                handleShoot();
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                if (e.button === 0) handleShoot();
            }}
          >
              <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 shadow-[0_0_20px_rgba(255,0,0,0.6)] cursor-pointer active:scale-90 transition-all duration-100 overflow-hidden group ${isSuperMode ? 'bg-yellow-500 border-yellow-200 shadow-[0_0_30px_rgba(255,215,0,0.8)]' : 'bg-red-600 border-white'}`}>
                  {/* Cooldown Overlay */}
                  <div 
                    ref={cooldownRef} 
                    className="absolute inset-0 z-20 pointer-events-none"
                    style={{ background: 'transparent' }}
                  />
                  
                  {/* Icon */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                      {isSuperMode ? (
                          <Zap className="text-white w-10 h-10 md:w-12 md:h-12 drop-shadow-md animate-pulse" fill="white" />
                      ) : (
                          <Target className="text-white w-10 h-10 md:w-12 md:h-12 drop-shadow-md" />
                      )}
                  </div>
                  
                  {/* Gloss Effect */}
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              </div>
              <span className={`mt-2 font-bold text-sm tracking-widest drop-shadow-md opacity-80 ${isSuperMode ? 'text-yellow-400' : 'text-white'}`}>
                  {isSuperMode ? 'RAPID FIRE' : 'SHOOT'}
              </span>
          </div>
      )}
      
      {/* Pause Overlay */}
      {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
              <h2 className="text-6xl font-black text-white tracking-widest drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">PAUSED</h2>
          </div>
      )}
    </div>
  );
};