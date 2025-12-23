import numpy as np
import scipy.io.wavfile as wav
import os
import random

# Constants
SAMPLE_RATE = 44100
BPM = 120
BARS = 2
DURATION = (60 / BPM) * 4 * BARS  # 4 seconds
SAMPLES = int(SAMPLE_RATE * DURATION)

# Output Directory
OUTPUT_DIR = "public/loops/matrix"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_wav(filename, data):
    # Normalize to 16-bit PCM
    data = data / np.max(np.abs(data)) * 32767
    wav.write(os.path.join(OUTPUT_DIR, filename), SAMPLE_RATE, data.astype(np.int16))
    print(f"Generated {filename}")

def generate_kick_pattern(intensity):
    t = np.linspace(0, DURATION, SAMPLES, endpoint=False)
    audio = np.zeros(SAMPLES)
    
    # Basic 4/4 Kick
    steps = 4 * BARS
    step_len = SAMPLES // steps
    
    for i in range(steps):
        if i % 4 == 0: # Downbeat
            start = i * step_len
            # Kick synthesis (Sine sweep) - Louder and punchier
            kt = np.linspace(0, 0.2, int(SAMPLE_RATE * 0.2))
            freq = 150 * np.exp(-15 * kt)
            kick = np.sin(2 * np.pi * freq * kt) * np.exp(-3 * kt) # Less decay for more body
            
            # Add punch based on intensity
            gain = 1.0
            if intensity > 1: gain = 1.5
            if intensity > 2: gain = 2.0
            
            kick *= gain
            
            end = min(start + len(kick), SAMPLES)
            audio[start:end] += kick[:end-start]
            
            # Extra kicks for higher intensity
            if intensity >= 3 and i % 4 == 0:
                # Ghost kick
                ghost_start = start + int(step_len * 2.5)
                if ghost_start < SAMPLES:
                     audio[ghost_start:ghost_start+len(kick)] += kick * 0.6

    # Normalize to max volume (0.9 to avoid clipping)
    if np.max(np.abs(audio)) > 0:
        audio = audio / np.max(np.abs(audio)) * 0.9
        
    return audio

def generate_bass_pattern(intensity):
    t = np.linspace(0, DURATION, SAMPLES, endpoint=False)
    audio = np.zeros(SAMPLES)
    
    # Frequencies for A Minor (A2, C3, E3, G3)
    notes = [110, 130.81, 164.81, 196.00] 
    
    steps = 8 * BARS
    step_len = SAMPLES // steps
    
    for i in range(steps):
        # Pattern logic
        play = False
        if intensity == 1: play = (i % 8 == 0) # Long notes
        elif intensity == 2: play = (i % 4 == 0) # Quarter notes
        elif intensity == 3: play = (i % 2 == 0) # Eighth notes
        elif intensity == 4: play = True # 16th notes (rolling)

        if play:
            start = i * step_len
            freq = notes[0] # Root
            if intensity > 2 and i % 4 == 2: freq = notes[2] # Variation
            
            # Sawtooth wave
            bt = np.linspace(0, step_len/SAMPLE_RATE, step_len)
            wave = (2 * (bt * freq % 1) - 1) * 0.5
            
            # Filter envelope simulation (Low pass)
            env = np.exp(-5 * bt)
            wave *= env
            
            end = min(start + len(wave), SAMPLES)
            audio[start:end] += wave[:end-start]

    return audio

def generate_synth_pattern(intensity):
    t = np.linspace(0, DURATION, SAMPLES, endpoint=False)
    audio = np.zeros(SAMPLES)
    
    # Chords (A Minor)
    chord = [440, 523.25, 659.25] # A4, C5, E5
    
    if intensity == 1:
        # Pad (Drone)
        for freq in chord:
            audio += np.sin(2 * np.pi * freq * t) * 0.1
        # Tremolo
        audio *= (1 + 0.5 * np.sin(2 * np.pi * 4 * t))
        
    elif intensity >= 2:
        # Arpeggio
        steps = 16 * BARS
        step_len = SAMPLES // steps
        for i in range(steps):
            if intensity == 2 and i % 2 != 0: continue
            
            start = i * step_len
            note_idx = i % 3
            freq = chord[note_idx]
            if intensity == 4: freq *= 2 # Octave up
            
            st = np.linspace(0, step_len/SAMPLE_RATE, step_len)
            wave = np.sin(2 * np.pi * freq * st) * np.exp(-10 * st)
            
            end = min(start + len(wave), SAMPLES)
            audio[start:end] += wave[:end-start] * 0.3

    return audio

def generate_fx_pattern(intensity):
    t = np.linspace(0, DURATION, SAMPLES, endpoint=False)
    audio = np.zeros(SAMPLES)
    
    # White Noise
    noise = np.random.uniform(-0.1, 0.1, SAMPLES)
    
    if intensity == 1:
        # Ocean waves
        lfo = (1 + np.sin(2 * np.pi * 0.2 * t)) * 0.5
        audio = noise * lfo
    elif intensity == 2:
        # Risers every bar
        riser = np.linspace(0, 1, SAMPLES // 2)
        audio[:len(riser)] = noise[:len(riser)] * riser
        audio[len(riser):] = noise[len(riser):] * riser[::-1]
    elif intensity >= 3:
        # Glitchy rhythm
        steps = 16 * BARS
        step_len = SAMPLES // steps
        for i in range(steps):
            if random.random() > 0.7:
                start = i * step_len
                end = start + step_len
                audio[start:end] = noise[start:end] * 0.5

    return audio

# Generate All Loops
instruments = ['drums', 'bass', 'synth', 'fx']
intensities = [1, 2, 3, 4]

for inst in instruments:
    for level in intensities:
        if inst == 'drums': data = generate_kick_pattern(level)
        elif inst == 'bass': data = generate_bass_pattern(level)
        elif inst == 'synth': data = generate_synth_pattern(level)
        elif inst == 'fx': data = generate_fx_pattern(level)
        
        filename = f"{inst}_{level}.wav"
        save_wav(filename, data)

print("All loops generated successfully.")
