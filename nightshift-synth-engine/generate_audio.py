import wave
import math
import struct
import random
import os

SAMPLE_RATE = 44100
BPM = 120
BARS = 2
DURATION = (60 / BPM) * 4 * BARS # 4 beats per bar
NUM_SAMPLES = int(SAMPLE_RATE * DURATION)

GENRES = ['synthwave', 'retrowave', 'synthpop', 'dreamwave', 'vaporwave']
FILES = {
    'synth': ['pad_1.wav', 'pad_2.wav', 'drone.wav', 'texture.wav', 'arp_1.wav', 'arp_2.wav', 'lead.wav'],
    'drums': ['pulse.wav', 'perctexture.wav', 'lofibeat.wav']
}

def write_wav(filename, samples):
    with wave.open(filename, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        # Normalize
        max_val = max(abs(s) for s in samples) if samples else 1
        if max_val == 0: max_val = 1
        
        # Apply fade in/out to avoid clicks
        fade_len = 1000
        for i in range(len(samples)):
            val = samples[i] / max_val
            if i < fade_len:
                val *= (i / fade_len)
            elif i > len(samples) - fade_len:
                val *= ((len(samples) - i) / fade_len)
            
            data = struct.pack('<h', int(val * 32767))
            w.writeframes(data)

def osc(freq, t, type='sine'):
    if type == 'sine':
        return math.sin(2 * math.pi * freq * t)
    elif type == 'saw':
        return 2 * ((freq * t) % 1) - 1
    elif type == 'square':
        return 1 if math.sin(2 * math.pi * freq * t) > 0 else -1
    elif type == 'noise':
        return random.uniform(-1, 1)
    return 0

def generate_pad(seed):
    random.seed(seed)
    base_freq = random.choice([110, 146.83, 164.81, 220]) # A2, D3, E3, A3
    samples = []
    mod_rate = random.uniform(0.1, 0.5)
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        # Add some slow modulation
        mod = math.sin(2 * math.pi * mod_rate * t) * 2
        val = osc(base_freq + mod, t, 'sine') * 0.5
        val += osc(base_freq * 1.5 + mod, t, 'sine') * 0.3
        val += osc(base_freq * 2 + mod, t, 'sine') * 0.2
        samples.append(val)
    return samples

def generate_drone(seed):
    random.seed(seed)
    base_freq = random.choice([55, 65.41, 73.42]) # A1, C2, D2
    samples = []
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        val = osc(base_freq, t, 'saw') * 0.3
        val += osc(base_freq * 1.01, t, 'saw') * 0.3 # Detune
        # Lowpass filter approximation (simple moving average would be better but expensive here, just keeping it simple)
        samples.append(val)
    return samples

def generate_texture(seed):
    random.seed(seed)
    samples = []
    # Bandpass noise
    last_val = 0
    freq = random.uniform(200, 800)
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        white = random.uniform(-1, 1)
        # Simple resonator
        val = last_val * 0.9 + white * 0.1
        # AM modulation
        val *= (math.sin(2 * math.pi * freq * t) + 1) / 2
        last_val = val
        samples.append(val)
    return samples

def generate_arp(seed):
    random.seed(seed)
    root = random.choice([220, 440])
    scale = [1, 1.2, 1.25, 1.5, 1.66] # Minor-ish
    sequence = [random.choice(scale) * root for _ in range(8)]
    samples = []
    step_len = NUM_SAMPLES // 16 # 16th notes
    for i in range(NUM_SAMPLES):
        step = (i // step_len) % 8
        t = i / SAMPLE_RATE
        freq = sequence[step]
        # Envelope
        local_t = (i % step_len) / SAMPLE_RATE
        env = max(0, 1 - local_t * 8) # Decay
        val = osc(freq, t, 'square') * env
        samples.append(val)
    return samples

def generate_lead(seed):
    random.seed(seed)
    root = random.choice([440, 523.25])
    samples = []
    for i in range(NUM_SAMPLES):
        t = i / SAMPLE_RATE
        freq = root + math.sin(2 * math.pi * 2 * t) * 5 # Vibrato
        val = osc(freq, t, 'saw')
        samples.append(val)
    return samples

def generate_drum(seed, type):
    random.seed(seed)
    samples = [0] * NUM_SAMPLES
    step_len = NUM_SAMPLES // 8 # 8th notes
    
    if type == 'pulse': # Kick-ish
        for step in [0, 4]: # Beats 1 and 3
            start = step * step_len * 2
            for i in range(4000): # Short kick
                if start + i >= NUM_SAMPLES: break
                t = i / SAMPLE_RATE
                freq = 150 * math.exp(-t * 20)
                val = math.sin(2 * math.pi * freq * t) * math.exp(-t * 10)
                samples[start + i] += val

    elif type == 'perc': # Hi-hats
        for step in range(16):
            start = step * (NUM_SAMPLES // 16)
            for i in range(1000):
                if start + i >= NUM_SAMPLES: break
                val = random.uniform(-1, 1) * math.exp(-i/200)
                samples[start + i] += val * 0.5
                
    elif type == 'lofi': # Snare/Clap
        for step in [2, 6]: # Beats 2 and 4
            start = step * step_len * 2
            for i in range(3000):
                if start + i >= NUM_SAMPLES: break
                t = i / SAMPLE_RATE
                val = random.uniform(-1, 1) * math.exp(-t * 15)
                samples[start + i] += val

    return samples

def main():
    base_path = "public/loops/genres"
    
    for genre in GENRES:
        print(f"Generating {genre}...")
        genre_seed = sum(ord(c) for c in genre)
        
        # Synths
        synth_path = os.path.join(base_path, genre, "synth")
        write_wav(os.path.join(synth_path, "pad_1.wav"), generate_pad(genre_seed))
        write_wav(os.path.join(synth_path, "pad_2.wav"), generate_pad(genre_seed + 1))
        write_wav(os.path.join(synth_path, "drone.wav"), generate_drone(genre_seed))
        write_wav(os.path.join(synth_path, "texture.wav"), generate_texture(genre_seed))
        write_wav(os.path.join(synth_path, "arp_1.wav"), generate_arp(genre_seed))
        write_wav(os.path.join(synth_path, "arp_2.wav"), generate_arp(genre_seed + 1))
        write_wav(os.path.join(synth_path, "lead.wav"), generate_lead(genre_seed))
        
        # Drums
        drum_path = os.path.join(base_path, genre, "drums")
        write_wav(os.path.join(drum_path, "pulse.wav"), generate_drum(genre_seed, 'pulse'))
        write_wav(os.path.join(drum_path, "perctexture.wav"), generate_drum(genre_seed, 'perc'))
        write_wav(os.path.join(drum_path, "lofibeat.wav"), generate_drum(genre_seed, 'lofi'))

if __name__ == "__main__":
    main()
