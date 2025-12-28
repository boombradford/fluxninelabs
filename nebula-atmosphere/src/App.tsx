import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, Upload } from 'lucide-react';
import { audioService } from './services/audioEngine';
import { PageLayout } from './components/layout/PageLayout';
import { XYPad } from './components/visuals/XYPad';
import type { NebulaParams } from './services/audioEngine';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Params State
  const [params, setParams] = useState<NebulaParams>({
    playbackPosition: 0.5,
    density: 0.5,
    grainSize: 0.2,
    overlap: 2.0,
    detune: 0,
    reverbSize: 0.5
  });

  // Init Engine on interaction
  const handleStart = async () => {
    if (!isReady) {
      await audioService.initialize();
      setIsReady(true);
    }

    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      audioService.start();
      setIsPlaying(true);
    }
  };

  const handleXYChange = useCallback((x: number, y: number) => {
    const newParams = {
      ...params,
      playbackPosition: x,
      density: y,
      overlap: 0.1 + (y * 3.9)
    };
    setParams(newParams);
    audioService.updateParams(newParams);
  }, [params]);

  const handleReverbChange = (val: number) => {
    const newParams = { ...params, reverbSize: val };
    setParams(newParams);
    audioService.updateParams({ reverbSize: val });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audioService.loadUserFile(file);
      if (!isPlaying && isReady) {
        audioService.start();
        setIsPlaying(true);
      }
    }
  };

  return (
    <PageLayout>
      <div className="w-full max-w-5xl h-[80vh] flex flex-col gap-6">

        {/* Header */}
        <header className="flex justify-between items-center py-4 border-b border-[var(--border-subtle)] relative z-50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-[var(--accent-cyan)] to-[var(--accent-purple)] rounded-full" />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              NEBULA <span className="text-[var(--text-tertiary)] font-normal ml-2 text-sm uppercase tracking-widest">Atmosphere Engine</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={triggerFileUpload}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-pink)] hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Upload size={14} />
              <span>Import Sample</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,audio/mp4,audio/x-m4a"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </header>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

          {/* Left: Controls */}
          <div className="lg:col-span-1 flex flex-col gap-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6">

            {/* Master Control */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Master Transport</label>
              <button
                onClick={handleStart}
                className={`
                            h-16 rounded-xl flex items-center justify-center gap-3 text-lg font-bold tracking-wide transition-all
                            ${isPlaying
                    ? 'bg-[var(--bg-elevated)] text-[var(--accent-pink)] border border-[var(--accent-pink)] shadow-[0_0_20px_-5px_var(--accent-pink)]'
                    : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-[1.02]'}
                        `}
              >
                {isPlaying ? <><Pause fill="currentColor" /> PAUSE STREAM</> : <><Play fill="currentColor" /> INITIATE ENGINE</>}
              </button>
            </div>

            {/* Macro Sliders */}
            <div className="flex flex-col gap-6 flex-1">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)] uppercase">
                  <span>Reverb Space</span>
                  <span>{Math.round(params.reverbSize * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.01"
                  value={params.reverbSize}
                  onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--accent-purple)] [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                />
              </div>

              <div className="space-y-3 opacity-50 pointer-events-none filter blur-[1px]">
                {/* Placeholder for Pitch - Enabled later */}
                <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)] uppercase">
                  <span>Pitch Shift</span>
                  <span>0 st</span>
                </div>
                <input type="range" className="w-full h-2 bg-[var(--bg-elevated)] rounded-lg appearance-none" disabled />
              </div>
            </div>

            <div className="mt-auto p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] mb-1">ENGINE STATUS</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                    {isReady ? 'ACTIVE // GRAIN_BUFFER_01' : 'STANDBY // AWAITING INPUT'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right: XY Pad Visualization */}
          <div className="lg:col-span-2 relative">
            <XYPad
              x={params.playbackPosition}
              y={params.density}
              onChange={handleXYChange}
              label="TEXTURE FIELD // X=POSITION Y=DENSITY"
            />
          </div>

        </div>
      </div>
    </PageLayout>
  );
}

export default App;
