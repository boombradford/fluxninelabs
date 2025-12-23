import * as Tone from 'tone';

export type Genre = 'synthwave' | 'retrowave' | 'synthpop' | 'dreamwave' | 'vaporwave';

export interface LoopConfig {
    id: string;
    type: 'synth' | 'drum';
    role: 'pad' | 'drone' | 'texture' | 'arp' | 'lead' | 'pulse' | 'perc' | 'lofi';
    filename: string;
    isSynced: boolean;
}

export const GENRES: Genre[] = ['synthwave', 'retrowave', 'synthpop', 'dreamwave', 'vaporwave'];

export const LOOPS: LoopConfig[] = [
    // Synths (Ambient - Web Audio API)
    { id: 'pad_1', type: 'synth', role: 'pad', filename: 'pad_1.wav', isSynced: false },
    { id: 'pad_2', type: 'synth', role: 'pad', filename: 'pad_2.wav', isSynced: false },
    { id: 'drone', type: 'synth', role: 'drone', filename: 'drone.wav', isSynced: false },
    { id: 'texture', type: 'synth', role: 'texture', filename: 'texture.wav', isSynced: false },
    // Synths (Rhythmic - Tone.js)
    { id: 'arp_1', type: 'synth', role: 'arp', filename: 'arp_1.wav', isSynced: true },
    { id: 'arp_2', type: 'synth', role: 'arp', filename: 'arp_2.wav', isSynced: true },
    { id: 'lead', type: 'synth', role: 'lead', filename: 'lead.wav', isSynced: true },
    // Drums (Rhythmic - Tone.js)
    { id: 'pulse', type: 'drum', role: 'pulse', filename: 'pulse.wav', isSynced: true },
    { id: 'perctexture', type: 'drum', role: 'perc', filename: 'perctexture.wav', isSynced: true },
    { id: 'lofibeat', type: 'drum', role: 'lofi', filename: 'lofibeat.wav', isSynced: true },
];

class AudioEngine {

    private buffers: Map<string, AudioBuffer> = new Map();
    private activeSources: Map<string, {
        source?: AudioBufferSourceNode,
        gain: GainNode,
        player?: Tone.Player
    }> = new Map();

    private reverb: Tone.Reverb;
    private masterGain: Tone.Gain;
    private isInitialized = false;

    constructor() {
        this.masterGain = new Tone.Gain(1).toDestination();
        this.reverb = new Tone.Reverb({
            decay: 4,
            wet: 0.3,
            preDelay: 0.1
        }).connect(this.masterGain);
    }

    async init() {
        if (this.isInitialized) return;
        await Tone.start();
        Tone.Transport.start();
        this.isInitialized = true;
    }

    async loadGenre(genre: Genre) {

        // Stop all current loops
        this.stopAll();

        // Load new buffers
        const promises = LOOPS.map(async (loop) => {
            const url = `/loops/genres/${genre}/${loop.type === 'synth' ? 'synth' : 'drums'}/${loop.filename}`;
            const buffer = await new Tone.Buffer().load(url);
            this.buffers.set(loop.id, buffer.get() as AudioBuffer);
        });

        await Promise.all(promises);
        console.log(`Loaded genre: ${genre}`);
    }

    stopAll() {
        this.activeSources.forEach((_, id) => {
            this.toggleLoop(id, false);
        });
    }

    toggleLoop(loopId: string, forceState?: boolean) {
        const loop = LOOPS.find(l => l.id === loopId);
        if (!loop) return;

        const currentState = this.activeSources.get(loopId);
        const isPlaying = !!currentState;
        const shouldPlay = forceState !== undefined ? forceState : !isPlaying;

        if (shouldPlay) {
            if (isPlaying) return; // Already playing

            const buffer = this.buffers.get(loopId);
            if (!buffer) {
                console.warn(`Buffer not found for ${loopId}`);
                return;
            }

            if (loop.isSynced) {
                // Tone.js implementation for synced loops
                const player = new Tone.Player(buffer).sync().start(0);
                player.loop = true;
                player.fadeIn = 0.1;
                player.fadeOut = 0.1;

                // Connect to reverb
                player.connect(this.reverb);

                this.activeSources.set(loopId, {
                    gain: player.volume as any, // Tone.Player volume is in dB, but we track existence
                    player
                });
            } else {
                // Raw Web Audio API implementation for ambient loops
                const ctx = Tone.context.rawContext;
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const gainNode = ctx.createGain();
                gainNode.gain.value = 0;

                source.connect(gainNode);
                // Connect to Tone's reverb node (which is a Web Audio node)
                Tone.connect(gainNode, this.reverb);

                source.start();

                // Smooth fade in
                gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 2);

                this.activeSources.set(loopId, { source, gain: gainNode });
            }
        } else {
            if (!isPlaying) return; // Already stopped

            if (loop.isSynced) {
                // Tone.js stop
                const { player } = currentState!;
                player?.dispose(); // This stops and disconnects
                this.activeSources.delete(loopId);
            } else {
                // Web Audio stop
                const { source, gain } = currentState!;
                const ctx = Tone.context.rawContext;

                // Smooth fade out
                gain.gain.cancelScheduledValues(ctx.currentTime);
                gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);

                setTimeout(() => {
                    source?.stop();
                    source?.disconnect();
                    gain.disconnect();
                }, 2000);

                this.activeSources.delete(loopId);
            }
        }
    }

    setBpm(bpm: number) {
        Tone.Transport.bpm.rampTo(bpm, 0.5);
    }

    getLoopState(loopId: string): boolean {
        return this.activeSources.has(loopId);
    }
}

export const audioEngine = new AudioEngine();
