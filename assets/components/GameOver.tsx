import React from 'react';
import { RotateCcw, Home } from 'lucide-react';

interface GameOverProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ score, highScore, onRestart, onHome }) => {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-red-900/40 backdrop-blur-md">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-4 text-center animate-bounce-in">
        
        <h2 className="text-5xl font-black text-white mb-6 drop-shadow-md tracking-wide">
          GAME OVER
        </h2>

        <div className="mb-8 space-y-4">
            <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-blue-200 text-sm font-bold uppercase mb-1">Your Score</p>
                <p className="text-6xl font-black text-white">{score}</p>
            </div>
            
            {isNewRecord && (
                <div className="animate-pulse bg-yellow-500/20 rounded-xl p-2 border border-yellow-400/50">
                    <p className="text-yellow-300 font-bold">🎉 NEW HIGH SCORE! 🎉</p>
                </div>
            )}
            
            <div className="flex justify-between items-center px-4 py-2 bg-white/5 rounded-xl">
                <span className="text-white/70">Best Score</span>
                <span className="text-xl font-bold text-yellow-400">{highScore}</span>
            </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1"
          >
            <Home size={20} />
            Menu
          </button>
          <button
            onClick={onRestart}
            className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-1"
          >
            <RotateCcw size={20} />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};