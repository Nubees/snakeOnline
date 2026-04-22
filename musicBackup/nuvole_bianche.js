// =============================================================================
// NUVOLE BIANCHE - Ludovico Einaudi
// Ethereal, flowing contemporary piano piece
// =============================================================================

class NuvoleBianchePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 65;
        this.currentBar = 0;
        this.loop = null;
        this.piano = null;
        this.bass = null;
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 4.0, wet: 0.5, preDelay: 0.1 }).toDestination();
            this.delay = new Tone.FeedbackDelay('8n', 0.25).connect(this.reverb);

            // Soft, ethereal piano
            this.piano = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.02, decay: 0.8, sustain: 0.4, release: 2.0 }
            }).connect(this.delay);
            this.piano.volume.value = -12;

            // Deep, resonant bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.6, sustain: 0.5, release: 1.5 },
                filterEnvelope: { attack: 0.02, decay: 0.4, sustain: 0.4, baseFrequency: 60, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -14;

            this.initialized = true;
        } catch (e) {
            console.warn('[NuvoleBianche] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // Opening motif - gentle rising
            phraseA: [
                ['C4', '8n'], ['C#4', '8n'], ['C4', '8n'], ['A#3', '8n'],
                ['C4', '8n'], ['C#4', '8n'], ['D#4', '8n'], ['D#4', '8n']
            ],
            // Main theme - repetitive G# oscillation
            phraseB: [
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'],
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n']
            ],
            // Variation
            phraseC: [
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'],
                ['C#5', '8n'], ['C5', '8n'], ['C5', '8n'], ['D#4', '8n']
            ],
            // Descending resolution
            phraseD: [
                ['C5', '8n'], ['A#4', '8n'], ['A#4', '8n'], ['D#4', '8n'],
                ['C#5', '8n'], ['C5', '8n'], ['A#4', '8n'], ['D#4', '8n']
            ],
            // Lower register variation
            phraseE: [
                ['A#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'],
                ['G4', '8n'], ['F4', '8n'], ['F4', '8n'], ['F4', '8n']
            ],
            // Closing phrase
            phraseF: [
                ['D#4', '8n'], ['C5', '8n'], ['C5', '8n'], ['C5', '8n'],
                ['C#5', '8n'], ['C5', '8n'], ['C5', '8n'], ['D#4', '8n']
            ],
            bassC: [['C3', '1n']],
            bassG: [['G#2', '1n']],
            bassD: [['D#3', '1n']],
            bassF: [['F3', '1n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 24;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassC;
                break;
            case 2: case 3:
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                break;
            case 4: case 5:
                melody = patterns.phraseC;
                bassPattern = patterns.bassG;
                break;
            case 6: case 7:
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                break;
            case 8: case 9:
                melody = patterns.phraseE;
                bassPattern = patterns.bassG;
                break;
            case 10: case 11:
                melody = patterns.phraseF;
                bassPattern = patterns.bassC;
                break;
            case 12: case 13:
                melody = patterns.phraseA;
                bassPattern = patterns.bassC;
                break;
            case 14: case 15:
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                break;
            case 16: case 17:
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                break;
            case 18: case 19:
                melody = patterns.phraseC;
                bassPattern = patterns.bassG;
                break;
            case 20: case 21:
                melody = patterns.phraseD;
                bassPattern = patterns.bassF;
                break;
            default:
                melody = patterns.phraseE;
                bassPattern = patterns.bassC;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.4 + (Math.random() * 0.15);
                this.piano.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 4);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.5);
            });
        }
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;
        this.init();
        if (!this.initialized) return;
        await Tone.start();
        Tone.Transport.bpm.value = this.bpm;
        this.currentBar = 0;
        this.loop = new Tone.Loop((time) => {
            this.playBar(time, this.currentBar);
            this.currentBar++;
        }, '1m').start(0);
        Tone.Transport.start();
        this.isPlaying = true;
        console.log('[NuvoleBianche] Started - White clouds drifting');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) { this.loop.dispose(); this.loop = null; }
        }
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NuvoleBianchePlayer };
}
