/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Space, ListOrdered, Heart, Terminal } from 'lucide-react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';
import NeonMusicPlayer from './components/NeonMusicPlayer';

interface ScoreEntry {
  name: string;
  score: number;
  difficulty?: string;
  date: string;
}

export default function App() {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const [ranking, setRanking] = useState<ScoreEntry[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);

  useEffect(() => {
    const loadRanking = async () => {
      const sheetUrl = "https://sheetdb.io/api/v1/6gn8xetirbn1d" || import.meta.env.VITE_SHEETDB_URL;
      setIsLoadingRanking(true);
      if (sheetUrl) {
        try {
          const res = await fetch(sheetUrl, { cache: 'no-store' });
          if (res.ok) {
            const data: any[] = await res.json();
            const parsed: ScoreEntry[] = data.map(row => ({
              name: String(row.name || 'ANON'),
              score: parseInt(row.score, 10) || 0,
              difficulty: String(row.difficulty || ''),
              date: String(row.date || '')
            }));
            const sorted = parsed.sort((a, b) => b.score - a.score).slice(0, 10);
            setRanking(sorted);
            setIsLoadingRanking(false);
            return;
          }
        } catch (error) {
          console.error("Fallo conectando a SheetDB", error);
        }
      }
      const saved = JSON.parse(localStorage.getItem('invaders_neon_ranking') || '[]');
      setRanking(saved);
      setIsLoadingRanking(false);
    };
    loadRanking();
    window.addEventListener('rankingUpdated', loadRanking);
    return () => window.removeEventListener('rankingUpdated', loadRanking);
  }, []);
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
    <div className="h-screen w-screen overflow-hidden bg-[#0c0c0e] flex flex-col font-sans selection:bg-cyan-500/30 relative">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-magenta-700/20 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full pt-1.5 sm:pt-3 pb-1 px-4 flex flex-col items-center z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-slate-900 flex-shrink-0"
      >
        <div className="flex items-baseline gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-2xl font-black italic text-slate-100 tracking-tighter uppercase relative">
            Space Invaders
            <span className="text-cyan-400 mx-1">Neón</span>
            <span className="absolute -top-1 -right-4 sm:-top-1.5 sm:-right-5 text-[6px] sm:text-[8px] font-mono text-magenta-500 font-bold bg-magenta-500/10 px-0.5 py-0.2 rounded border border-magenta-500/20">V1.1</span>
          </h1>
        </div>
        <p className="text-slate-500 font-mono tracking-[0.3em] text-[6px] sm:text-[8px] uppercase text-center leading-none">
          Hecho por <span className="text-cyan-400 font-bold">Galindez</span>
        </p>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full z-10 relative min-h-0">
        {/* Ranking Sidebar */}
        <motion.aside
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:absolute lg:left-0 lg:top-0 lg:bottom-0 z-20 lg:w-44 xl:w-52 p-2 sm:p-3 lg:border-r border-t lg:border-t-0 border-slate-800 bg-slate-900/40 backdrop-blur-xl flex flex-col flex-shrink-0"
        >
          <div className="flex items-center gap-2 mb-2">
            <ListOrdered className="w-3.5 h-3.5 text-magenta-500" />
            <h2 className="text-[10px] sm:text-xs font-bold text-slate-100 uppercase tracking-widest italic">Ranking</h2>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 max-h-[90px] lg:max-h-none">
            {isLoadingRanking ? (
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">Sincronizando...</p>
              </div>
            ) : ranking.length > 0 ? (
              ranking.map((entry, index) => (
                <div
                  key={index}
                  className="group flex flex-col p-1 bg-slate-800/20 border border-slate-700/30 rounded hover:border-magenta-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`font-mono font-black italic text-[10px] ${index < 3 ? 'text-cyan-400' : 'text-slate-600'}`}>
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-100 uppercase truncate max-w-[50px] sm:max-w-[70px]">{entry.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] sm:text-[10px] font-black text-magenta-500 leading-none">{entry.score}</p>
                    </div>
                  </div>
                  {entry.difficulty && (
                    <div className="flex justify-start ml-3">
                      <p className="text-[6px] sm:text-[7px] text-slate-500 uppercase tracking-wider">{entry.difficulty}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-2 border border-dashed border-slate-800 rounded">
                <p className="text-[7px] font-mono text-slate-600 uppercase">Vacío</p>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Game Area */}
        <main className="flex-1 flex flex-col items-center justify-center w-full h-full p-1 sm:p-2 lg:p-4 overflow-hidden relative bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:40px_40px]">
          
          <div className="relative z-10 flex flex-col items-center">
            
            <div className="w-full max-w-4xl flex justify-between items-center mb-2 z-10 glass-morphism p-2 rounded-xl">
              <div className="flex flex-col items-start px-2">
                <span className="text-[8px] uppercase tracking-widest text-cyan-400 font-mono">Puntuación</span>
                <span className="text-lg font-bold font-mono neon-shadow-cyan">{score.toString().padStart(5, '0')}</span>
              </div>
              <div className="flex flex-col items-end px-2">
                <span className="text-[8px] uppercase tracking-widest text-magenta-400 font-mono">Récord</span>
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-yellow-400" />
                  <span className="text-lg font-bold font-mono neon-shadow-magenta">{highScore.toString().padStart(5, '0')}</span>
                </div>
              </div>
            </div>

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
            
            {/* Controls Legend */}
            <div className="mt-4 flex gap-6 text-[10px] uppercase font-mono tracking-widest text-gray-500 z-10">
              <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded border border-white/20">LEFT</kbd> <kbd className="bg-white/10 px-1 rounded border border-white/20">RIGHT</kbd> Moverse</span>
              <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded border border-white/20">SPACE</kbd> Disparar</span>
            </div>

          </div>
        </main>
      </div>

      {/* Desktop & Mobile Music Player */}
      <div className="w-full flex-shrink-0 bg-[#0c0c0e]/95 backdrop-blur-md border-t border-slate-900 z-50 sm:fixed sm:bottom-4 sm:right-4 sm:w-72 lg:w-80 sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:flex-shrink">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="max-w-md mx-auto sm:max-w-none"
        >
          <NeonMusicPlayer playLoseTrack={status === 'gameover'} isGameStarted={status === 'playing'} />
        </motion.div>
      </div>

      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
    </div>
  );
}
