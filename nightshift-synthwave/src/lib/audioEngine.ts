import * as Tone from 'tone';

export type Instrument = 'drums' | 'bass' | 'synth' | 'fx';
export type Intensity = 1 | 2 | 3 | 4;

export interface MatrixCell {
    instrument: Instrument;
    intensity: Intensity;
    state: 'stopped' | 'queued' | 'playing';
}

class AudioEngine {
    private players: Map<string, Tone.Player> = new Map();
    // Track active state per cell ID (e.g. "drums_1")
    private activeCellIds: Set<string> = new Set();
    private queuedCellIds: Map<string, boolean> = new Map(); // id -> isStarting (true=start, false=stop)
    private isInitialized = false;
    private isPlaying = false;
    private onStateChange: (() => void) | null = null;

    // Master FX
    private filter: Tone.Filter | null = null;
    private reverb: Tone.Reverb | null = null;
    private masterVol: Tone.Volume | null = null;

    constructor() {
        // No init needed for sets
    }

    async init() {
        if (this.isInitialized) return;

        await Tone.start();

        // Master Chain
        this.masterVol = new Tone.Volume(-5).toDestination();
        this.reverb = new Tone.Reverb({ decay: 4, wet: 0 }).connect(this.masterVol);
        this.filter = new Tone.Filter(20000, "lowpass").connect(this.reverb);

        // Load Players
        const instruments: Instrument[] = ['drums', 'bass', 'synth', 'fx'];
        const intensities: Intensity[] = [1, 2, 3, 4];

        for (const inst of instruments) {
            for (const level of intensities) {
                const id = `${inst}_${level}`;
                const player = new Tone.Player({
                    url: `/loops/matrix/${id}.mp3`,
                    loop: true,
                    fadeIn: 0.02,
                    fadeOut: 0.02,
                    onload: () => console.log(`Loaded ${id}`),
                    onerror: (e) => console.error(`Failed to load ${id}`, e)
                }).connect(this.filter);

                // Sync to Transport
                player.sync().start(0);

                // Mute initially (we unmute to "play")
                player.volume.value = -Infinity;

                this.players.set(id, player);
            }
        }

        await Tone.loaded();
        console.log("Audio buffers loaded");

        // Transport Schedule for Quantized Launching
        Tone.Transport.scheduleRepeat((time) => {
            Tone.Draw.schedule(() => {
                this.applyQueuedChanges();
            }, time);
        }, "1m"); // Check every measure (1 bar)

        Tone.Transport.bpm.value = 120;
        this.isInitialized = true;
    }

    private applyQueuedChanges() {
        let changed = false;

        this.queuedCellIds.forEach((shouldStart, id) => {
            const player = this.players.get(id);
            if (!player) return;

            if (shouldStart) {
                if (!this.activeCellIds.has(id)) {
                    player.volume.value = 0;
                    this.activeCellIds.add(id);
                    console.log(`Starting ${id}`);
                }
            } else {
                if (this.activeCellIds.has(id)) {
                    player.volume.value = -Infinity;
                    this.activeCellIds.delete(id);
                    console.log(`Stopping ${id}`);
                }
            }
            changed = true;
        });

        this.queuedCellIds.clear();

        if (changed && this.onStateChange) {
            this.onStateChange();
        }
    }

    queueCell(instrument: Instrument, intensity: Intensity) {
        const id = `${instrument}_${intensity}`;
        const isActive = this.activeCellIds.has(id);
        const isQueued = this.queuedCellIds.has(id);

        // Toggle Logic
        // If currently active:
        //   - If queued to stop (false) -> Cancel queue (remain active)
        //   - If not queued -> Queue to stop (false)
        // If currently inactive:
        //   - If queued to start (true) -> Cancel queue (remain inactive)
        //   - If not queued -> Queue to start (true)

        if (isActive) {
            if (isQueued && this.queuedCellIds.get(id) === false) {
                this.queuedCellIds.delete(id); // Cancel stop
            } else {
                this.queuedCellIds.set(id, false); // Queue stop
            }
        } else {
            if (isQueued && this.queuedCellIds.get(id) === true) {
                this.queuedCellIds.delete(id); // Cancel start
            } else {
                this.queuedCellIds.set(id, true); // Queue start
            }
        }

        if (this.onStateChange) this.onStateChange();

        if (!this.isPlaying) {
            this.start();
        }
    }

    getCellState(instrument: Instrument, intensity: Intensity): 'stopped' | 'queued' | 'playing' {
        const id = `${instrument}_${intensity}`;
        const isActive = this.activeCellIds.has(id);
        const queuedState = this.queuedCellIds.get(id);

        if (queuedState !== undefined) return 'queued'; // Queued to start OR stop
        if (isActive) return 'playing';
        return 'stopped';
    }

    setMasterFX(x: number, y: number) {
        // x: 0 = Lowpass (Muffle), 0.5 = Clean, 1 = Highpass (Thin)
        // y: Reverb Amount

        if (!this.filter || !this.reverb) return;

        // Filter Logic
        if (x < 0.5) {
            this.filter.type = "lowpass";
            this.filter.frequency.value = Math.max(100, x * 2 * 20000);
        } else {
            this.filter.type = "highpass";
            this.filter.frequency.value = (x - 0.5) * 2 * 5000;
        }

        // Reverb Logic
        this.reverb.wet.value = y * 0.5;
    }

    async start() {
        await Tone.start();
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
            this.isPlaying = true;
        }
    }

    stop() {
        Tone.Transport.stop();
        this.isPlaying = false;
        this.activeCellIds.clear();
        this.queuedCellIds.clear();
        this.players.forEach(p => p.volume.value = -Infinity);
        if (this.onStateChange) this.onStateChange();
    }

    setCallback(cb: () => void) {
        this.onStateChange = cb;
    }
}

export const audioEngine = new AudioEngine();
