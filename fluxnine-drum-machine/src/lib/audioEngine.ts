import * as Tone from 'tone';

export type Instrument = 'kick' | 'snare' | 'hat' | 'clap' | 'perc';
export type KitName = '808' | 'trap';

export const INSTRUMENTS: Instrument[] = ['kick', 'snare', 'hat', 'clap', 'perc'];

class AudioEngine {
    private players: Tone.Players | null = null;
    private filter: Tone.Filter | null = null;
    private crusher: Tone.BitCrusher | null = null;
    private limiter: Tone.Limiter | null = null;

    private loopId: number | null = null;
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;
        await Tone.start();

        // Master FX Chain
        this.limiter = new Tone.Limiter(-1).toDestination();
        this.filter = new Tone.Filter(20000, "lowpass").connect(this.limiter);
        this.crusher = new Tone.BitCrusher(16).connect(this.filter); // Start clean (16 bits)
        // Crusher wet/dry can be used, or just bits. 
        // BitCrusher doesn't have a wet/dry, so we'll just control bits. 16 = clean, 4 = crushed.

        console.log('Audio Engine Initialized');
        this.isInitialized = true;
    }

    async loadKit(kit: KitName) {
        return new Promise<void>((resolve) => {
            const newPlayers = new Tone.Players({
                kick: `/kits/${kit}/kick.wav`,
                snare: `/kits/${kit}/snare.wav`,
                hat: `/kits/${kit}/hat.wav`,
                clap: `/kits/${kit}/clap.wav`,
                perc: `/kits/${kit}/perc.wav`,
            }, () => {
                console.log(`Kit ${kit} loaded`);
                // Connect to our FX chain instead of destination
                if (this.crusher) {
                    newPlayers.connect(this.crusher);
                } else {
                    newPlayers.toDestination();
                }

                // Swap safely
                const oldPlayers = this.players;
                this.players = newPlayers;
                if (oldPlayers) {
                    oldPlayers.dispose();
                }
                resolve();
            });
        });
    }

    playInstrument(instrument: Instrument, time?: number) {
        if (this.players && this.players.has(instrument)) {
            // If time is provided, schedule it, otherwise play immediately
            if (time !== undefined) {
                this.players.player(instrument).start(time);
            } else {
                this.players.player(instrument).start();
            }
        }
    }

    setSwing(amount: number) {
        // Tone.Transport.swing is 0 to 1
        Tone.Transport.swing = amount;
        Tone.Transport.swingSubdivision = "16n"; // Swing 16th notes
    }

    setFilter(frequency: number) {
        if (this.filter) {
            // Map 0-100 to frequency? Or just pass Hz.
            // Let's assume input is 0-1 for UI, map to 100Hz - 20000Hz log
            // Actually, let's just take Hz for simplicity or handle mapping here.
            // Let's take 0-1 value from UI.
            const min = 100;
            const max = 20000;
            // Exponential mapping
            const hz = min * Math.pow(max / min, frequency);
            this.filter.frequency.rampTo(hz, 0.1);
        }
    }

    setCrush(amount: number) {
        if (this.crusher) {
            // amount 0 (clean) to 1 (destroyed)
            // bits: 16 down to 1
            const bits = 16 - (amount * 14); // 16 to 2
            this.crusher.bits.value = Math.max(1, bits);
        }
    }

    setBpm(bpm: number) {
        Tone.Transport.bpm.value = bpm;
    }

    start() {
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }
    }

    stop() {
        Tone.Transport.stop();
    }

    // Schedule the loop
    // callback receives (stepIndex, time)
    // We use Tone.Draw to schedule UI updates if needed, but here we just emit the event
    // The callback is responsible for triggering sounds (using playInstrument(inst, time))
    // AND updating UI.
    // Note: UI updates should be scheduled with Tone.Draw to sync with audio, 
    // or we can just update React state (which might be slightly laggy but usually fine for visual).
    // Better: The callback triggers the sound. The UI highlight is separate?
    // Actually, the prompt says "Emits current step index to UI".
    // We'll pass a callback that does both.
    onStep(callback: (step: number, time: number) => void) {
        if (this.loopId !== null) {
            Tone.Transport.clear(this.loopId);
        }

        // Reset transport to ensure we start at 0
        // Tone.Transport.position = 0; 

        // Use a counter that resets on transport start? 
        // Actually, scheduleRepeat passes the time.
        // We can calculate step from Transport.position or just maintain a counter.
        // Since we want 16 steps, we can use the tick count.

        this.loopId = Tone.Transport.scheduleRepeat((time) => {
            // Calculate 16th note index
            // Tone.Transport.position is "bars:quarters:sixteenths"
            // But it's easier to just increment a counter if we are sure it starts at 0.
            // Or use:

            // PPQ is usually 192. 16th note is PPQ/4 = 48 ticks.
            // ticks / 48 % 16.

            // Let's use a safer way:
            // Just keep a local counter? No, that might drift if we pause/resume?
            // Tone.Transport.position is reliable.

            // Let's use the callback.
            // We need to make sure we are precise.
            // We will trust the caller to handle the logic or just pass the step.

            // Let's try to parse position.
            // Actually, `Tone.Transport.position` is a string or number depending on setting.
            // By default it's Bars:Beats:Sixteenths.
            // We can just use a counter that we increment.
            // But `scheduleRepeat` might fire slightly ahead of time (lookahead).
            // So `Tone.Transport.seconds` is the scheduled time.

            // Let's use a closure variable that we reset on start?
            // But `onStep` is called once.

            // Let's use the math approach with ticks.
            const sixteenths = Tone.Transport.position.toString().split(':');
            const bar = parseInt(sixteenths[0]);
            const beat = parseInt(sixteenths[1]);
            const sixteenth = parseFloat(sixteenths[2]);

            const currentStep = (bar * 16 + beat * 4 + Math.round(sixteenth)) % 16;

            callback(currentStep, time);
        }, "16n");
    }
}

export const audioEngine = new AudioEngine();
