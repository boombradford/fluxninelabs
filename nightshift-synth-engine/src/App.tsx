import { useState, useEffect } from 'react';
import { audioEngine, type Genre, LOOPS } from './lib/audioEngine';
import { LoopGrid } from './components/LoopGrid';
import { GenreSelector } from './components/GenreSelector';
import { BpmControl } from './components/BpmControl';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<Genre>('synthwave');
  const [activeLoops, setActiveLoops] = useState<Set<string>>(new Set());
  const [bpm, setBpm] = useState(100);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isStarted) {
      handleGenreChange('synthwave');
    }
  }, [isStarted]);

  const handleStart = async () => {
    await audioEngine.init();
    setIsStarted(true);
  };

  const handleGenreChange = async (genre: Genre) => {
    setIsLoading(true);
    setActiveLoops(new Set()); // Reset active loops
    await audioEngine.loadGenre(genre);
    setCurrentGenre(genre);
    setIsLoading(false);
  };

  const handleToggleLoop = (id: string) => {
    audioEngine.toggleLoop(id);
    setActiveLoops(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioEngine.setBpm(newBpm);
  };

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleStart}
          className="px-12 py-6 bg-transparent border-2 border-neon-pink text-neon-pink text-2xl font-bold tracking-[0.5em] uppercase rounded-lg shadow-[0_0_30px_rgba(255,0,255,0.3)] hover:bg-neon-pink hover:text-white transition-all duration-300"
        >
          Initialize Engine
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white p-8 flex flex-col items-center gap-12">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/10 pb-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-pink to-neon-cyan tracking-tighter mb-2">
            NIGHTSHIFT
          </h1>
          <p className="text-neon-purple tracking-[0.3em] text-sm font-bold uppercase">
            Synth Ambience Engine
          </p>
        </div>

        <GenreSelector
          currentGenre={currentGenre}
          onSelect={handleGenreChange}
        />
      </header>

      <main className="w-full flex-1 flex flex-col items-center gap-12 relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10 bg-dark-bg/80 backdrop-blur-sm"
            >
              <div className="text-neon-cyan font-mono animate-pulse">LOADING MODULES...</div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <LoopGrid
          loops={LOOPS}
          activeLoops={activeLoops}
          onToggle={handleToggleLoop}
        />

        <BpmControl bpm={bpm} onChange={handleBpmChange} />
      </main>

      <footer className="text-white/20 text-xs font-mono tracking-widest">
        SYSTEM READY // V1.0.0
      </footer>
    </div>
  );
}

export default App;
