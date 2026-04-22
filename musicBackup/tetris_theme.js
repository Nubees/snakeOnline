// =============================================================================
// TETRIS THEME (Korobeiniki) - Classic Tetris Main Theme
// Parsed from MIDI and recreated with Tone.js
// Original: Russian folk song, popularized by Game Boy Tetris
// =============================================================================

class TetrisThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 130; // Classic Tetris tempo
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;      // Main melody (accordion/synth)
        this.bass = null;      // Bass line
        this.chords = null;    // Chord accompaniment
        this.reverb = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 1.8, wet: 0.25, preDelay: 0.05 }).toDestination();

            // Lead - bright, slightly reed-like for that Russian folk sound
            this.lead = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.4 }
            }).connect(this.reverb);
            this.lead.volume.value = -10;

            // Bass - deep and round
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.5 },
                filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.4, baseFrequency: 100, octaves: 3 }
            }).connect(this.reverb);
            this.bass.volume.value = -8;

            // Chords - softer poly synth
            this.chords = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.6 }
            }).connect(this.reverb);
            this.chords.volume.value = -16;

            this.initialized = true;
        } catch (e) {
            console.warn('[TetrisTheme] Init failed:', e);
        }
    }

    // Korobeiniki - The classic Tetris melody
    // Phrase A: E B C D C B A A
    // Phrase B: C E D C B A B G#
    // Phrase C: B D E D B C B G#
    getMelodyPatterns() {
        return {
            // Main theme phrases (eighth notes)
            phraseA: [
                ['E5', '8n'], ['B4', '8n'], ['C5', '8n'], ['D5', '8n'],
                ['C5', '8n'], ['B4', '8n'], ['A4', '8n'], ['A4', '8n']
            ],
            phraseB: [
                ['C5', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n'],
                ['B4', '8n'], ['A4', '8n'], ['B4', '8n'], ['G#4', '8n']
            ],
            phraseC: [
                ['B4', '8n'], ['D5', '8n'], ['E5', '8n'], ['D5', '8n'],
                ['B4', '8n'], ['C5', '8n'], ['B4', '8n'], ['G#4', '8n']
            ],
            phraseD: [
                ['A4', '8n'], ['C5', '8n'], ['A4', '8n'], ['B4', '8n'],
                ['G#4', '8n'], ['E5', '8n'], ['D5', '8n'], ['C5', '8n']
            ],
            // Bridge/variation
            phraseE: [
                ['D5', '8n'], ['C5', '8n'], ['B4', '8n'], ['C5', '8n'],
                ['D5', '8n'], ['E5', '8n'], ['B4', '8n'], ['G#4', '8n']
            ],
            // Bass patterns (quarter notes)
            bassE: [['E3', '4n'], ['E3', '4n'], ['E3', '4n'], ['E3', '4n']],
            bassA: [['A2', '4n'], ['A2', '4n'], ['A2', '4n'], ['A2', '4n']],
            bassG: [['G#2', '4n'], ['G#2', '4n'], ['G#2', '4n'], ['G#2', '4n']],
            bassD: [['D3', '4n'], ['D3', '4n'], ['D3', '4n'], ['D3', '4n']],
            bassC: [['C3', '4n'], ['C3', '4n'], ['C3', '4n'], ['C3', '4n']],
            bassB: [['B2', '4n'], ['B2', '4n'], ['B2', '4n'], ['B2', '4n']],
            // Chord patterns
            chordE: [['E4', 'G#4', 'B4'], null, null, null],
            chordA: [['A4', 'C5', 'E5'], null, null, null],
            chordG: [['G#4', 'B4', 'D5'], null, null, null],
            chordD: [['D4', 'F#4', 'A4'], null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar Korobeiniki structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        // Standard Tetris theme structure
        switch (section) {
            case 0: case 1: // Phrase A (E major)
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 2: case 3: // Phrase B (A major)
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 4: case 5: // Phrase C (G# minor/major)
                melody = patterns.phraseC;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 6: case 7: // Phrase A again
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 8: case 9: // Phrase B again
                melody = patterns.phraseB;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 10: case 11: // Variation
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 12: case 13: // Bridge phrase
                melody = patterns.phraseE;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordE;
                break;
            case 14: case 15: // Ending phrase
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
        }

        // Play melody (eighth notes)
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.7 + (Math.random() * 0.1);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass (quarter notes)
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note) {
                    const noteTime = time + (i * quarterTime);
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.65);
                }
            });
        }

        // Play chords on beat 1
        if (chordPattern && chordPattern[0]) {
            this.chords.triggerAttackRelease(chordPattern[0], '2n', time + 0.05, 0.35);
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
        console.log('[TetrisTheme] Started playing - Korobeiniki');
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
    module.exports = { TetrisThemePlayer };
}
