import { useState } from 'react';
import { audioEngine } from './lib/audioEngine';
import { LiveMatrix } from './components/LiveMatrix';
import { Square } from 'lucide-react';

function App() {
  const [started, setStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await audioEngine.init();
      audioEngine.start();

      setStarted(true);
    } catch (err: any) {
      console.error('Failed to initialize:', err);
      setError(err.message || 'Failed to start');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-retro-dark flex flex-col items-center justify-center p-4 relative overflow-hidden font-retro">
        <div className="z-10 text-center space-y-12">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-bold text-retro-sand tracking-tighter">
              MATRIX
            </h1>
            <p className="text-retro-pink tracking-[0.5em] text-sm uppercase">
              Live Remix System
            </p>
          </div>

          {error && (
            <div className="text-retro-pink bg-retro-pink/10 p-4 rounded border border-retro-pink/50">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="group relative px-12 py-6 bg-transparent overflow-hidden transition-transform active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 border-2 border-retro-sand group-hover:bg-retro-sand/10 transition-all duration-300" />
            <div className="relative flex items-center gap-4 text-retro-sand font-bold text-xl tracking-widest uppercase">
              {isLoading ? 'Loading...' : 'Enter Booth'}
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-retro-dark text-retro-sand font-retro overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-retro-space/30 bg-retro-dark/90 backdrop-blur z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tighter">
            MATRIX
          </h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStop}
            className="p-3 rounded-full bg-retro-space/20 hover:text-retro-pink hover:bg-retro-pink/10 transition-colors"
          >
            <Square size={20} fill="currentColor" />
          </button>
        </div>
      </header>

      {/* Main Matrix Area */}
      <main className="flex-1 relative overflow-hidden">
        <LiveMatrix />
      </main>
    </div>
  );
}

export default App;
