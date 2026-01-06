import React from 'react';
import { Difficulty } from '../types';
import { Play, Trophy } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore, difficulty, setDifficulty }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 animate-fade-in-up overflow-hidden">
        
        {/* Background shine effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-blue-100 to-blue-500 mb-3 drop-shadow-sm tracking-tight">
            FLAPPY<br/>DORAEMON
          </h1>
          <div className="inline-block bg-blue-500/20 px-4 py-1 rounded-full border border-blue-400/30">
             <p className="text-blue-100 text-sm font-bold tracking-widest uppercase">Pro Edition</p>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          {/* Difficulty Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-end px-2">
                <label className="text-white/90 text-xs font-bold uppercase tracking-widest">Difficulty</label>
            </div>
            <div className="grid grid-cols-3 gap-3 bg-black/30 p-2 rounded-2xl border border-white/5">
              {Object.values(Difficulty).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    difficulty === d
                      ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/40 transform scale-100'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onStart}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-400 to-emerald-600 p-5 rounded-2xl shadow-xl transition-all hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
                <Play className="w-8 h-8 text-white fill-current" />
                <span className="text-2xl font-black text-white tracking-wide">START MISSION</span>
            </div>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          </button>

          <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                <span className="text-white/80 font-bold text-sm">BEST SCORE</span>
            </div>
            <span className="text-2xl font-black text-yellow-400 font-mono tracking-wider">{highScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
};