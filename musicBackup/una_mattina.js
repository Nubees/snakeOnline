// =============================================================================
// UNA MATTINA - Ludovico Einaudi
// Gentle, flowing piano piece from "The Intouchables"
// Key: A minor, gentle arpeggios with a nostalgic melody
// =============================================================================

class UnaMattinaPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 80;
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
            this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.45, preDelay: 0.08 }).toDestination();
            this.delay = new Tone.FeedbackDelay('8n', 0.2).connect(this.reverb);

            // Warm, intimate piano tone
            this.piano = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.015, decay: 0.7, sustain: 0.35, release: 1.8 }
            }).connect(this.delay);
            this.piano.volume.value = -11;

            // Subtle bass support
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.03, decay: 0.5, sustain: 0.4, release: 1.2 },
                filterEnvelope: { attack: 0.02, decay: 0.3, sustain: 0.4, baseFrequency: 80, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -13;

            this.initialized = true;
        } catch (e) {
            console.warn('[UnaMattina] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // Opening arpeggio - A minor
            phraseA: [
                ['E4', '8n'], ['A4', '8n'], ['C5', '8n'], ['E5', '8n'],
                ['E5', '8n'], ['C5', '8n'], ['A4', '8n'], ['E4', '8n']
            ],
            // Main theme - gentle descent
            phraseB: [
                ['E5', '8n'], ['D5', '8n'], ['C5', '8n'], ['B4', '8n'],
                ['A4', '8n'], ['G4', '8n'], ['A4', '8n'], ['C5', '8n']
            ],
            // Variation with higher notes
            phraseC: [
                ['A5', '8n'], ['G5', '8n'], ['E5', '8n'], ['D5', '8n'],
                ['C5', '8n'], ['B4', '8n'], ['C5', '8n'], ['E5', '8n']
            ],
            // Melodic return
            phraseD: [
                ['D5', '8n'], ['C5', '8n'], ['B4', '8n'], ['A4', '8n'],
                ['G4', '8n'], ['A4', '8n'], ['B4', '8n'], ['C5', '8n']
            ],
            // Lower register contemplative
            phraseE: [
                ['C4', '8n'], ['E4', '8n'], ['G4', '8n'], ['B4', '8n'],
                ['A4', '8n'], ['G4', '8n'], ['E4', '8n'], ['C4', '8n']
            ],
            // Resolution phrase
            phraseF: [
                ['A3', '4n'], ['E4', '4n'], ['A4', '4n'], ['E5', '4n']
            ],
            bassA: [['A2', '1n']],
            bassC: [['C3', '1n']],
            bassE: [['E2', '1n']],
            bassF: [['F2', '1n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 20;
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
                bassPattern = patterns.bassC;
                break;
            case 6: case 7:
                melody = patterns.phraseD;
                bassPattern = patterns.bassA;
                break;
            case 8: case 9:
                melody = patterns.phraseE;
                bassPattern = patterns.bassE;
                break;
            case 10: case 11:
                melody = patterns.phraseA;
                bassPattern = patterns.bassA;
                break;
            case 12: case 13:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                break;
            case 14: case 15:
                melody = patterns.phraseC;
                bassPattern = patterns.bassC;
                break;
            case 16: case 17:
                melody = patterns.phraseD;
                bassPattern = patterns.bassF;
                break;
            default:
                melody = patterns.phraseF;
                bassPattern = patterns.bassA;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.45 + (Math.random() * 0.1);
                this.piano.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 4);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.55);
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
        console.log('[UnaMattina] Started - One morning');
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
    module.exports = { UnaMattinaPlayer };
}
