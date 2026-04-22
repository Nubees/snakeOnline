// =============================================================================
// TETRIS THEME ALT - Alternative arrangement
// Synthwave/electronic version of Korobeiniki
// =============================================================================

class TetrisThemeAltPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 130;
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;
        this.bass = null;
        this.pad = null;
        this.reverb = null;
        this.delay = null;
        this.filter = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 2.0, wet: 0.3, preDelay: 0.08 }).toDestination();
            this.delay = new Tone.FeedbackDelay('8n.', 0.3).connect(this.reverb);
            this.filter = new Tone.Filter(800, 'lowpass').connect(this.delay);

            // Synthwave lead - sawtooth with filter
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.6 }
            }).connect(this.filter);
            this.lead.volume.value = -12;

            // Electronic bass - punchy
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 },
                filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, baseFrequency: 80, octaves: 3 }
            }).connect(this.reverb);
            this.bass.volume.value = -8;

            // Synth pad
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.5, decay: 0.8, sustain: 0.4, release: 1.5 }
            }).connect(this.reverb);
            this.pad.volume.value = -18;

            this.initialized = true;
        } catch (e) {
            console.warn('[TetrisThemeAlt] Init failed:', e);
        }
    }

    // Alternative arrangement - different patterns
    getMelodyPatterns() {
        return {
            // Variation with different note patterns
            phraseA: [
                ['E5', '8n'], ['B4', '8n'], ['C5', '8n'], ['D5', '8n'],
                ['C5', '8n'], ['B4', '8n'], ['A4', '8n'], ['A4', '8n']
            ],
            phraseA2: [
                ['C5', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n'],
                ['B4', '4n'], ['A4', '4n'], ['B4', '8n'], ['G4', '8n']
            ],
            phraseB: [
                ['B4', '8n'], ['D5', '8n'], ['E5', '8n'], ['D5', '8n'],
                ['B4', '8n'], ['C5', '8n'], ['B4', '8n'], ['G4', '8n']
            ],
            phraseC: [
                ['A4', '8n'], ['C5', '8n'], ['E5', '8n'], ['A4', '8n'],
                ['C5', '8n'], ['E5', '8n'], ['F5', '8n'], ['E5', '8n']
            ],
            phraseD: [
                ['D5', '8n'], ['F5', '8n'], ['A5', '8n'], ['D5', '8n'],
                ['F5', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n']
            ],
            phraseEnd: [
                ['E5', '4n'], ['C5', '4n'], ['A4', '2n'], ['G4', '2n']
            ],
            bassE: [['E2', '2n'], ['B2', '2n']],
            bassA: [['A2', '2n'], ['E3', '2n']],
            bassG: [['G2', '2n'], ['D3', '2n']],
            bassD: [['D3', '2n'], ['A3', '2n']],
            chordE: [['E4', 'G4', 'B4'], null, null, null, null, null, null, null],
            chordA: [['A4', 'C5', 'E5'], null, null, null, null, null, null, null],
            chordG: [['G4', 'B4', 'D5'], null, null, null, null, null, null, null],
            chordD: [['D4', 'F4', 'A4'], null, null, null, null, null, null, null]
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
        let chordPattern = null;

        // Filter modulation
        if (this.filter) {
            const freq = 600 + (section * 100);
            this.filter.frequency.rampTo(freq, 0.5, time);
        }

        switch (section) {
            case 0: case 1:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 2: case 3:
                melody = patterns.phraseA2;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 4: case 5:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 6: case 7:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 8: case 9:
                melody = patterns.phraseC;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 10: case 11:
                melody = patterns.phraseD;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 12: case 13:
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 14: case 15:
                melody = patterns.phraseEnd;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.65 + (Math.random() * 0.1);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
            });
        }

        if (chordPattern && chordPattern[0]) {
            this.pad.triggerAttackRelease(chordPattern[0], '1m', time + 0.1, 0.35);
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
        console.log('[TetrisThemeAlt] Started playing - Synthwave edition');
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
    module.exports = { TetrisThemeAltPlayer };
}
