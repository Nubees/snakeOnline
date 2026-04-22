// =============================================================================
// RIVER FLOWS IN YOU - Yiruma
// Beautiful contemporary piano piece
// =============================================================================

class RiversFlowPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 72;
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
            this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.4, preDelay: 0.08 }).toDestination();
            this.delay = new Tone.FeedbackDelay('4n.', 0.3).connect(this.reverb);

            // Soft piano-like tones
            this.piano = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.005, decay: 0.6, sustain: 0.3, release: 1.5 }
            }).connect(this.delay);
            this.piano.volume.value = -10;

            // Gentle bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.05, decay: 0.5, sustain: 0.4, release: 1.0 },
                filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.4, baseFrequency: 80, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            this.initialized = true;
        } catch (e) {
            console.warn('[RiversFlow] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // A major flowing melody
            phraseA: [
                ['A5', '8n'], ['G#5', '8n'], ['A5', '8n'], ['G#5', '8n'],
                ['A5', '8n'], ['E5', '8n'], ['A5', '8n'], ['D5', '8n']
            ],
            phraseB: [
                ['C#5', '8n'], ['A5', '8n'], ['G#5', '8n'], ['A5', '8n'],
                ['G#5', '8n'], ['A5', '8n'], ['E5', '8n'], ['A5', '8n']
            ],
            phraseC: [
                ['D5', '8n'], ['C#5', '8n'], ['A5', '8n'], ['A5', '8n'],
                ['A4', '8n'], ['A5', '8n'], ['A4', '8n'], ['A5', '8n']
            ],
            phraseD: [
                ['A4', '8n'], ['D5', '8n'], ['C#5', '8n'], ['D5', '8n'],
                ['E5', '8n'], ['C#5', '8n'], ['B4', '8n'], ['B3', '8n']
            ],
            bassA: [['A2', '2n'], ['E3', '2n']],
            bassF: [['F#2', '2n'], ['C#3', '2n']],
            bassD: [['D2', '2n'], ['A2', '2n']],
            bassE: [['E2', '2n'], ['B2', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassA;
                break;
            case 2: case 3:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 4: case 5:
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                break;
            case 6: case 7:
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                break;
            case 8: case 9:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                break;
            case 10: case 11:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 12: case 13:
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                break;
            default:
                melody = patterns.phraseD;
                bassPattern = patterns.bassE;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.5 + (Math.random() * 0.1);
                this.piano.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.6);
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
        console.log('[RiversFlow] Started - Flowing like water');
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
    module.exports = { RiversFlowPlayer };
}
