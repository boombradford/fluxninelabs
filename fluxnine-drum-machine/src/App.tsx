import { useState, useEffect, useRef } from 'react';
import { audioEngine, INSTRUMENTS } from './lib/audioEngine';
import type { KitName } from './lib/audioEngine';
import { SequencerGrid } from './components/SequencerGrid';
import { TransportControls } from './components/TransportControls';
import { KitSelector } from './components/KitSelector';
import { BpmSlider } from './components/BpmSlider';
import * as Tone from 'tone';

const createEmptyPattern = () => Array(5).fill(null).map(() => Array(16).fill(false));

const PRESETS: Record<string, boolean[][]> = {
  'Trap Basic': [
    [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], // Kick
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
    [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true], // Hat
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Perc
  ],
  'Phonk Bounce': [
    [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false], // Kick
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
    [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false], // Hat
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Clap
    [false, true, false, false, false, true, false, false, false, true, false, false, false, true, false, false], // Perc
  ],
  'Four-On-The-Floor': [
    [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false], // Kick
    [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // Snare
    [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false], // Hat
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Clap
    [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false], // Perc
  ]
};

function App() {
  const [pattern, setPattern] = useState<boolean[][]>(() => PRESETS['Trap Basic'].map(row => [...row]));
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [kit, setKit] = useState<KitName>('808');
  const [activePreset, setActivePreset] = useState<string>('Trap Basic');

  // FX State
  const [swing, setSwing] = useState(0);
  const [filter, setFilter] = useState(1); // 1 = Open (20khz)
  const [crush, setCrush] = useState(0); // 0 = Clean

  const patternRef = useRef(pattern);
  useEffect(() => { patternRef.current = pattern; }, [pattern]);

  useEffect(() => {
    const init = async () => {
      await audioEngine.loadKit(kit);
    };
    init();

    audioEngine.onStep((step, time) => {
      const currentPattern = patternRef.current;
      currentPattern.forEach((row, instrumentIndex) => {
        if (row[step]) {
          audioEngine.playInstrument(INSTRUMENTS[instrumentIndex], time);
        }
      });

      Tone.Draw.schedule(() => {
        setCurrentStep(step);
      }, time);
    });
  }, []);

  // Update FX
  useEffect(() => { audioEngine.setSwing(swing); }, [swing]);
  useEffect(() => { audioEngine.setFilter(filter); }, [filter]);
  useEffect(() => { audioEngine.setCrush(crush); }, [crush]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngine.loadKit(kit);
  }, [kit]);

  const toggleStep = (instrumentIndex: number, stepIndex: number) => {
    const newPattern = pattern.map((row, i) =>
      i === instrumentIndex
        ? row.map((val, j) => j === stepIndex ? !val : val)
        : row
    );
    setPattern(newPattern);
    setActivePreset('Custom');
  };

  const handlePlayPause = async () => {
    if (!isPlaying) {
      await audioEngine.init();
      audioEngine.start();
      setIsPlaying(true);
    } else {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    }
  };

  const loadPreset = (name: string) => {
    if (PRESETS[name]) {
      setPattern(PRESETS[name].map(row => [...row]));
      setActivePreset(name);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col items-center justify-center p-2 md:p-4 font-sans selection:bg-neon-blue selection:text-black">
      <div className="max-w-5xl w-full flex flex-col gap-4 md:gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-6 border-b border-white/10 pb-4 md:pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
              FLUXNINE
            </h1>
            <p className="text-neon-blue text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase mt-1 md:mt-2 pl-1">
              Mobile Drum Machine
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-start md:justify-end w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {Object.keys(PRESETS).map(preset => (
              <button
                key={preset}
                onClick={() => loadPreset(preset)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap
                  ${activePreset === preset
                    ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}
                `}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 bg-dark-surface/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <TransportControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onClear={() => {
                setPattern(createEmptyPattern());
                setActivePreset('Custom');
              }}
            />
            {/* Mobile Kit Selector moved here for better access? No, keep layout consistent but flexible */}
          </div>

          <div className="flex flex-col justify-center gap-4">
            <BpmSlider bpm={bpm} onChange={setBpm} />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Swing</span>
                <span>{Math.round(swing * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="0.5" step="0.01" value={swing}
                onChange={e => setSwing(Number(e.target.value))}
                className="w-full h-4 bg-transparent appearance-none cursor-pointer 
                   [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-dark-bg [&::-webkit-slider-runnable-track]:rounded-full
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            {/* FX Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Filter</span>
                <span>{Math.round(filter * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={filter}
                onChange={e => setFilter(Number(e.target.value))}
                className="w-full h-4 bg-transparent appearance-none cursor-pointer 
                   [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-dark-bg [&::-webkit-slider-runnable-track]:rounded-full
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-green [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,255,0,0.5)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Crush</span>
                <span>{Math.round(crush * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={crush}
                onChange={e => setCrush(Number(e.target.value))}
                className="w-full h-4 bg-transparent appearance-none cursor-pointer 
                   [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-dark-bg [&::-webkit-slider-runnable-track]:rounded-full
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-pink [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,0,255,0.5)]"
              />
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end w-full">
            <div className="w-full md:max-w-[220px]">
              <KitSelector currentKit={kit} onChange={setKit} />
            </div>
          </div>
        </div>

        {/* Sequencer */}
        <SequencerGrid
          pattern={pattern}
          currentStep={currentStep}
          onToggleStep={toggleStep}
          isPlaying={isPlaying}
        />
      </div>
    </div>
  );
}

export default App;
