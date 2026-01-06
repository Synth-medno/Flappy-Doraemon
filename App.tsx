import React, { useState, useEffect } from 'react';
import { GameEngine } from './components/GameEngine';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import { GameState, Difficulty } from './types';
import { STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setHighScore(parseInt(stored));
    }
  }, []);

  const handleStartGame = () => {
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const handleRestart = () => {
    setScore(0);
    setGameState(GameState.PLAYING);
  };

  const handleGoHome = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="w-full h-screen bg-gray-900 overflow-hidden relative font-sans select-none">
      {/* Game Layer */}
      <GameEngine
        gameState={gameState}
        setGameState={setGameState}
        difficulty={difficulty}
        score={score}
        setScore={setScore}
        setHighScore={setHighScore}
      />

      {/* UI Layer */}
      {gameState === GameState.MENU && (
        <MainMenu
          onStart={handleStartGame}
          highScore={highScore}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOver
          score={score}
          highScore={highScore}
          onRestart={handleRestart}
          onHome={handleGoHome}
        />
      )}
    </div>
  );
};

export default App;