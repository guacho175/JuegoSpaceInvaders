/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Space } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';

export default function App() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persistence: High Score
  useEffect(() => {
    const saved = localStorage.getItem('invaders_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Anti-close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'playing') {
        const msg = '¿Estás seguro de que quieres salir? Perderás tu progreso actual.';
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  // Audio Logic
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'); // Example LoFi track
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    
    if (status === 'playing' && !isMuted) {
      audioRef.current.play().catch(() => {
          // Ignore autoplay restriction errors
      });
    } else if (status !== 'playing') {
      // Keep playing in menu but lower volume? Or stop? 
      // User asked for "LoFi global", let's keep it playing if not muted
      if(!isMuted) {
          audioRef.current.play().catch(() => {});
      }
    }
  }, [status, isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      if (!isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleGameOver = useCallback((victory: boolean, finalScore: number) => {
    setStatus(victory ? 'victory' : 'gameover');
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('invaders_highscore', finalScore.toString());
    }
  }, [highScore]);

  const startGame = () => {
    setStatus('playing');
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Neon Glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-700/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-magenta-700/10 blur-[120px] rounded-full" />
      </div>

      {/* Header / Stats */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 z-10 glass-morphism p-4 rounded-xl border border-white/10">
        <div className="flex flex-col items-start px-4">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono">Puntuación</span>
          <span className="text-2xl font-bold font-mono neon-shadow-cyan">{score.toString().padStart(5, '0')}</span>
        </div>
        <div className="text-center">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                <Space className="w-8 h-8 text-cyan-400" />
                Invaders <span className="text-magenta-500">Neon</span>
            </h1>
        </div>
        <div className="flex flex-col items-end px-4">
          <span className="text-xs uppercase tracking-widest text-magenta-400 font-mono">Récord</span>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-2xl font-bold font-mono neon-shadow-magenta">{highScore.toString().padStart(5, '0')}</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <main className="relative z-10 flex flex-col items-center">
        <GameCanvas 
          status={status} 
          gameOver={handleGameOver} 
          updateScore={setScore} 
        />

        {/* Overlays */}
        <AnimatePresence>
          {status !== 'playing' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl p-8 text-center border-2 border-white/5"
            >
              {status === 'idle' && (
                <>
                  <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter text-white">Listos para el Despegue</h2>
                  <p className="text-gray-400 mb-8 max-w-md">Defiende la base arcade del asalto digital. Usa flechas para moverte y espacio para disparar.</p>
                  <button 
                    onClick={startGame}
                    className="group flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-full font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                  >
                    <Play className="fill-black" /> Iniciar Partida
                  </button>
                </>
              )}

              {status === 'gameover' && (
                <>
                  <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter text-red-500 neon-shadow-magenta">Game Over</h2>
                  <p className="text-gray-400 mb-8">Los invasores han conquistado el sistema.</p>
                  <div className="text-3xl font-mono mb-8">Puntuación Final: <span className="text-cyan-400">{score}</span></div>
                  <button 
                    onClick={startGame}
                    className="flex items-center gap-3 bg-magenta-600 hover:bg-magenta-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest transition-all hover:scale-105"
                  >
                    <RotateCcw /> Reintentar
                  </button>
                </>
              )}

              {status === 'victory' && (
                <>
                  <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter text-cyan-400 neon-shadow-cyan">¡Victoria!</h2>
                  <p className="text-gray-400 mb-8">El código ha sido purificado. Eres el guardián del sistema.</p>
                  <div className="text-3xl font-mono mb-8 text-yellow-400">¡Nuevo Récord! {score}</div>
                  <button 
                    onClick={startGame}
                    className="flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-full font-black uppercase tracking-widest transition-all hover:scale-105"
                  >
                    <RotateCcw className="fill-black" /> Jugar de Nuevo
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Controls Legend / Mute */}
      <footer className="mt-8 w-full max-w-4xl flex justify-between items-center z-10 opacity-50 hover:opacity-100 transition-opacity">
        <div className="flex gap-6 text-[10px] uppercase font-mono tracking-widest text-gray-500">
            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded border border-white/20">LEFT</kbd> <kbd className="bg-white/10 px-1 rounded border border-white/20">RIGHT</kbd> Moverse</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded border border-white/20">SPACE</kbd> Disparar</span>
        </div>
        
        <button 
          onClick={toggleMute}
          className="p-3 rounded-full glass-morphism hover:bg-white/10 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-cyan-500" />}
        </button>
      </footer>
    </div>
  );
}
