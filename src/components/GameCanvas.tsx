import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT, 
  PLAYER_SPEED, 
  ENEMY_COLS, 
  ENEMY_ROWS, 
  ENEMY_WIDTH, 
  ENEMY_HEIGHT, 
  ENEMY_PADDING, 
  ENEMY_OFFSET_TOP, 
  ENEMY_OFFSET_LEFT,
  PROJECTILE_SPEED,
  ENEMY_PROJECTILE_SPEED,
  ENEMY_FIRE_RATE,
  COLORS
} from '../constants';
import { Enemy, Projectile, GameStatus } from '../types';

interface GameCanvasProps {
  status: GameStatus;
  gameOver: (victory: boolean, score: number) => void;
  updateScore: (score: number) => void;
}

export default function GameCanvas({ status, gameOver, updateScore }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  
  // Game State Refs (for performance in loop)
  const playerX = useRef(CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2);
  const enemies = useRef<Enemy[]>([]);
  const projectiles = useRef<Projectile[]>([]);
  const score = useRef(0);
  const enemyDirection = useRef(1); // 1 = right, -1 = left
  const enemyStepDown = useRef(false);
  const lastTime = useRef(0);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const initEnemies = useCallback(() => {
    const newEnemies: Enemy[] = [];
    for (let r = 0; r < ENEMY_ROWS; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        newEnemies.push({
          x: c * (ENEMY_WIDTH + ENEMY_PADDING) + ENEMY_OFFSET_LEFT,
          y: r * (ENEMY_HEIGHT + ENEMY_PADDING) + ENEMY_OFFSET_TOP,
          width: ENEMY_WIDTH,
          height: ENEMY_HEIGHT,
          alive: true,
          row: r,
          type: r % 2 === 0 ? 'red' : 'magenta'
        });
      }
    }
    enemies.current = newEnemies;
  }, []);

  const resetGame = useCallback(() => {
    playerX.current = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    projectiles.current = [];
    score.current = 0;
    updateScore(0);
    enemyDirection.current = 1;
    enemyStepDown.current = false;
    initEnemies();
  }, [initEnemies, updateScore]);

  useEffect(() => {
    if (status === 'playing') {
      resetGame();
    }
  }, [status, resetGame]);

  const handleShoot = useCallback(() => {
    if (status !== 'playing') return;
    
    // Limit player projectiles (e.g., max 3 at a time)
    const playerProjectiles = projectiles.current.filter(p => p.fromPlayer && p.active);
    if (playerProjectiles.length < 3) {
      projectiles.current.push({
        x: playerX.current + PLAYER_WIDTH / 2 - 2,
        y: CANVAS_HEIGHT - PLAYER_HEIGHT - 10,
        width: 4,
        height: 15,
        active: true,
        fromPlayer: true
      });
    }
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp') {
        handleShoot();
        e.preventDefault();
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleShoot]);

  const update = useCallback((deltaTime: number) => {
    if (status !== 'playing') return;

    // Player move
    if (keysPressed.current['ArrowLeft'] && playerX.current > 0) {
      playerX.current -= PLAYER_SPEED;
    }
    if (keysPressed.current['ArrowRight'] && playerX.current < CANVAS_WIDTH - PLAYER_WIDTH) {
      playerX.current += PLAYER_SPEED;
    }

    // Enemies move logic
    let shouldChangeDirection = false;
    enemies.current.forEach(enemy => {
      if (!enemy.alive) return;
      
      const nextX = enemy.x + (enemyDirection.current * 1.5);
      if (nextX <= 0 || nextX + ENEMY_WIDTH >= CANVAS_WIDTH) {
        shouldChangeDirection = true;
      }
    });

    if (shouldChangeDirection) {
      enemyDirection.current *= -1;
      enemies.current.forEach(enemy => {
        if (enemy.alive) enemy.y += 20;
      });
    } else {
      enemies.current.forEach(enemy => {
        if (enemy.alive) enemy.x += enemyDirection.current * 1.5;
      });
    }

    // Check if enemies reached bottom or player
    enemies.current.forEach(enemy => {
      if (enemy.alive && (enemy.y + ENEMY_HEIGHT >= CANVAS_HEIGHT - PLAYER_HEIGHT || 
          (enemy.y + ENEMY_HEIGHT >= CANVAS_HEIGHT - PLAYER_HEIGHT && 
           enemy.x < playerX.current + PLAYER_WIDTH && 
           enemy.x + ENEMY_WIDTH > playerX.current))) {
        gameOver(false, score.current);
      }
    });

    // Enemy shooting
    enemies.current.forEach(enemy => {
      if (enemy.alive && Math.random() < ENEMY_FIRE_RATE) {
        projectiles.current.push({
          x: enemy.x + ENEMY_WIDTH / 2,
          y: enemy.y + ENEMY_HEIGHT,
          width: 3,
          height: 12,
          active: true,
          fromPlayer: false
        });
      }
    });

    // Projectiles move & collision
    projectiles.current.forEach(p => {
      if (!p.active) return;
      
      if (p.fromPlayer) {
        p.y -= PROJECTILE_SPEED;
        if (p.y < -20) p.active = false;

        // Collision with enemies
        for (const enemy of enemies.current) {
          if (enemy.alive && p.x < enemy.x + enemy.width && p.x + p.width > enemy.x &&
              p.y < enemy.y + enemy.height && p.y + p.height > enemy.y) {
            enemy.alive = false;
            p.active = false;
            score.current += 100;
            updateScore(score.current);
            break; // One bullet hits one enemy
          }
        }
      } else {
        p.y += ENEMY_PROJECTILE_SPEED;
        if (p.y > CANVAS_HEIGHT) p.active = false;

        // Collision with player
        if (p.x < playerX.current + PLAYER_WIDTH && 
            p.x + p.width > playerX.current &&
            p.y + p.height >= CANVAS_HEIGHT - PLAYER_HEIGHT - 10 &&
            p.y <= CANVAS_HEIGHT - 10) {
          gameOver(false, score.current);
        }
      }
    });

    // Clean up inactive projectiles
    projectiles.current = projectiles.current.filter(p => p.active);

    // Check Victory
    if (enemies.current.every(enemy => !enemy.alive)) {
      gameOver(true, score.current);
    }
  }, [status, gameOver, updateScore]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars Background (Dynamic)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for(let i=0; i<50; i++) {
        ctx.fillRect((Math.random() * CANVAS_WIDTH), (Math.random() * CANVAS_HEIGHT), 1, 1);
    }

    // Draw Player
    ctx.fillStyle = COLORS.player;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.player;
    
    // Ship Shape
    ctx.beginPath();
    ctx.moveTo(playerX.current + PLAYER_WIDTH / 2, CANVAS_HEIGHT - PLAYER_HEIGHT - 10);
    ctx.lineTo(playerX.current, CANVAS_HEIGHT - 10);
    ctx.lineTo(playerX.current + PLAYER_WIDTH, CANVAS_HEIGHT - 10);
    ctx.closePath();
    ctx.fill();

    // Draw Enemies
    enemies.current.forEach(enemy => {
      if (!enemy.alive) return;
      ctx.fillStyle = enemy.type === 'red' ? COLORS.enemyRow1 : COLORS.enemyRow2;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      
      // Alien Shape
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      // Small eyes
      ctx.fillStyle = 'black';
      ctx.shadowBlur = 0;
      ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4);
      ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 8, 4, 4);
    });

    // Draw Projectiles
    projectiles.current.forEach(p => {
      if (!p.active) return;
      ctx.fillStyle = p.fromPlayer ? COLORS.projectile : COLORS.enemyProjectile;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    ctx.shadowBlur = 0;
  }, []);

  const loop = useCallback((time: number) => {
    const deltaTime = time - lastTime.current;
    lastTime.current = time;

    update(deltaTime);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);

    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      <div className="relative glass-morphism p-2 rounded-xl border-cyan-500/30 overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={CANVAS_WIDTH} 
          height={CANVAS_HEIGHT}
          className="bg-black/80 rounded-lg max-w-full h-auto cursor-none shadow-2xl"
        />
        
        {/* Mobile Controls Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end md:hidden pointer-events-none">
          <div className="flex gap-4 pointer-events-auto">
            <button 
              onPointerDown={() => keysPressed.current['ArrowLeft'] = true}
              onPointerUp={() => keysPressed.current['ArrowLeft'] = false}
              onPointerLeave={() => keysPressed.current['ArrowLeft'] = false}
              className="w-16 h-16 rounded-full glass-morphism flex items-center justify-center active:scale-95 transition-transform border-2 border-cyan-500/50"
            >
              <span className="text-2xl text-cyan-500">←</span>
            </button>
            <button 
              onPointerDown={() => keysPressed.current['ArrowRight'] = true}
              onPointerUp={() => keysPressed.current['ArrowRight'] = false}
              onPointerLeave={() => keysPressed.current['ArrowRight'] = false}
              className="w-16 h-16 rounded-full glass-morphism flex items-center justify-center active:scale-95 transition-transform border-2 border-cyan-500/50"
            >
              <span className="text-2xl text-cyan-500">→</span>
            </button>
          </div>
          <button 
            onPointerDown={(e) => {
                e.preventDefault();
                handleShoot();
            }}
            className="w-24 h-24 rounded-full glass-morphism flex items-center justify-center active:scale-95 transition-transform border-2 border-magenta-500/50 pointer-events-auto"
          >
            <span className="text-sm font-bold text-magenta-500 uppercase">FIRE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
