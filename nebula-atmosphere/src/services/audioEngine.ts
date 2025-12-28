import * as Tone from 'tone';

export interface NebulaParams {
    grainSize: number;       // 0.01 to 0.5
    overlap: number;         // 0.1 to 4.0
    playbackPosition: number; // 0 to 1 (normalized)
    detune: number;          // -1200 to 1200
    density: number;         // 0 to 1 (controls playback rate/jitter)
    reverbSize: number;      // 0 to 1
}

class GrainAudioService {
    private player: Tone.GrainPlayer | null = null;
    public analyser: Tone.Analyser | null = null;
    private reverb: Tone.Reverb | null = null;
    private delay: Tone.PingPongDelay | null = null;
    private filter: Tone.Filter | null = null;
    private limiter: Tone.Limiter | null = null;
    private isInitialized = false;
    private buffer: Tone.ToneAudioBuffer | null = null;

    // Default sample: A lush choir texture
    private sampleUrl = "https://tonejs.github.io/audio/berklee/choir_sust_2.mp3";

    constructor() { }

    async initialize() {
        if (this.isInitialized) return;

        await Tone.start();

        // Create Effects Chain
        this.reverb = new Tone.Reverb({
            decay: 10,
            preDelay: 0.2,
            wet: 0.5
        }).toDestination();
        await this.reverb.generate(); // Impulse response generation

        this.delay = new Tone.PingPongDelay({
            delayTime: "4n",
            feedback: 0.4,
            wet: 0.3
        });

        this.filter = new Tone.Filter({
            frequency: 2000,
            type: "lowpass",
            rolloff: -24
        });

        // Load Buffer
        this.buffer = new Tone.ToneAudioBuffer(this.sampleUrl, () => {
            this.createPlayer();
        });

        this.isInitialized = true;
    }

    private createPlayer() {
        if (!this.buffer) return;

        // Dispose old player if exists
        if (this.player) {
            this.player.dispose();
        }

        this.player = new Tone.GrainPlayer({
            url: this.buffer,
            loop: true,
            grainSize: 0.2,
            overlap: 2.0, // High overlap = lush clouds
            playbackRate: 1, // Start normal
            reverse: false,
        });

        // Chain: Player -> Filter -> Delay -> Reverb -> Limiter -> Analyser -> Master
        this.limiter = new Tone.Limiter(-1).toDestination();
        this.analyser = new Tone.Analyser("fft", 2048);

        this.player.connect(this.filter!);
        this.filter!.connect(this.delay!);
        this.delay!.connect(this.reverb!);
        this.reverb!.connect(this.limiter);
        this.limiter.connect(this.analyser);

        console.log("Nebula Engine Ready");
    }

    start() {
        if (this.player && this.player.state !== 'started') {
            this.player.start();
        }
    }

    stop() {
        if (this.player) {
            this.player.stop();
        }
    }

    // File Loader using Native Decode for better compatibility (M4A/AAC)
    async loadUserFile(file: File) {
        console.log(`Loading file: ${file.name}, Type: ${file.type}, Size: ${file.size}`);

        // Ensure Audio Context is Running (Mobile/Safari requirement)
        if (Tone.context.state !== 'running') {
            await Tone.context.resume();
        }

        // Stop current playback
        if (this.player) {
            this.player.stop();
        }

        try {
            const arrayBuffer = await file.arrayBuffer();

            // Use Raw Context to bypass any Tone.js wrappers for decoding
            // This is the most direct access to the browser's codec engine
            const audioBuffer = await Tone.context.rawContext.decodeAudioData(arrayBuffer);

            this.buffer = new Tone.ToneAudioBuffer(audioBuffer);
            this.createPlayer();
            this.start();
            console.log("Buffer loaded successfully via native decode");
        } catch (err: any) {
            console.error("Error loading buffer:", err);
            const msg = err.message || "Unknown decoding error";

            // Check if it looks like an Apple file
            const isAppleFile = file.name.toLowerCase().endsWith('.m4a') || file.type.includes('m4a') || file.type.includes('mp4');

            let advice = "\n\nEnsure it is a valid audio format (MP3, WAV, AAC).";
            if (isAppleFile) {
                advice = "\n\n⚠️ IMPORTANT: Browsers CANNOT play 'Apple Lossless' (ALAC) files. \nIf this is an iPhone recording, ensure it is saved as 'Compressed' (AAC), or convert it to WAV/MP3.";
            }

            alert(`Could not decode audio file: ${file.name}.\nError: ${msg}${advice}`);
        }
    }

    // Real-time parameter updates
    updateParams(params: Partial<NebulaParams>) {
        if (!this.player || !this.isInitialized) return;

        if (params.grainSize !== undefined) {
            this.player.grainSize = params.grainSize;
        }

        if (params.overlap !== undefined) {
            this.player.overlap = params.overlap;
        }

        if (params.detune !== undefined) {
            this.player.detune = params.detune;
        }

        if (params.playbackPosition !== undefined && this.buffer) {
            // Scrub through the buffer
            // GrainPlayer handles position differently (loopStart/loopEnd)
            // or just 'offset' param if not looping? 
            // Best approach for texture scrubbing is setting the loop points 
            // to a small window around the position, or relying on loop.

            // Actually, GrainPlayer has a 'loopStart' and 'loopEnd'. 
            // Let's drift the loop window.
            const duration = this.buffer.duration;
            const windowSize = 0.5; // 0.5 seconds window
            const center = params.playbackPosition * duration;

            let start = center - (windowSize / 2);
            let end = center + (windowSize / 2);

            // Clamp
            if (start < 0) { start = 0; end = windowSize; }
            if (end > duration) { end = duration; start = duration - windowSize; }

            this.player.loopStart = start;
            this.player.loopEnd = end;
        }

        // Density maps to filter + playback rate jitter
        if (params.density !== undefined && this.filter) {
            // Low density = muffled, slow. High density = bright, jittery.
            this.filter.frequency.rampTo(200 + (params.density * 8000), 0.1);
            // this.player.playbackRate = 0.5 + (params.density * 1.5); 
        }

        if (params.reverbSize !== undefined && this.reverb) {
            this.reverb.wet.value = params.reverbSize;
        }
    }
}

export const audioService = new GrainAudioService();
