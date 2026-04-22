// =============================================================================
// TEMPLE OF TIME - The Legend of Zelda: Ocarina of Time
// Sacred, contemplative theme with harp-like sounds
// Parsed from MIDI and recreated with Tone.js
// =============================================================================

class TempleOfTimePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 75; // Slow, contemplative tempo
        this.currentBar = 0;
        this.loop = null;
        this.harp = null;      // Main melody (harp-like)
        this.bass = null;      // Low strings/bass
        this.pad = null;       // Atmospheric pad
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            // Long, cathedral-like reverb for the Temple atmosphere
            this.reverb = new Tone.Reverb({
                decay: 4.0,
                wet: 0.45,
                preDelay: 0.15
            }).toDestination();

            // Ethereal delay for harp echoes
            this.delay = new Tone.FeedbackDelay('4n.', 0.4).connect(this.reverb);

            // Harp-like lead - bright attack, long sustain
            this.harp = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.005,
                    decay: 0.8,
                    sustain: 0.4,
                    release: 2.5
                }
            }).connect(this.delay);
            this.harp.volume.value = -10;

            // Bass - deep and resonant
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.05,
                    decay: 0.5,
                    sustain: 0.6,
                    release: 1.5
                },
                filterEnvelope: {
                    attack: 0.02,
                    decay: 0.3,
                    sustain: 0.4,
                    baseFrequency: 80,
                    octaves: 2
                }
            }).connect(this.reverb);
            this.bass.volume.value = -8;

            // Pad - soft, atmospheric
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 1.2,
                    decay: 1.0,
                    sustain: 0.5,
                    release: 3.0
                }
            }).connect(this.reverb);
            this.pad.volume.value = -20;

            this.initialized = true;
        } catch (e) {
            console.warn('[TempleOfTime] Init failed:', e);
        }
    }

    // Temple of Time melody - contemplative and sacred
    // Based on the MIDI: A4-D4-F4-A4 pattern with flowing variations
    getMelodyPatterns() {
        return {
            // Main theme - ascending arpeggio feel
            phraseA: [
                ['A4', '4n'], ['D4', '4n'], ['F4', '4n'], ['A4', '4n'],
                ['D4', '4n'], ['F4', '4n'], ['A4', '4n'], ['C5', '4n']
            ],
            phraseA2: [
                ['A4', '4n'], ['D4', '4n'], ['F4', '4n'], ['A4', '4n'],
                ['D4', '4n'], ['F4', '4n'], ['A4', '4n'], ['A4', '4n']
            ],
            // Descending resolution
            phraseB: [
                ['B4', '4n'], ['G4', '4n'], ['F4', '4n'], ['G4', '4n'],
                ['A4', '4n'], ['D4', '4n'], ['C4', '4n'], ['E4', '4n']
            ],
            phraseB2: [
                ['B4', '4n'], ['G4', '4n'], ['F4', '4n'], ['G4', '4n'],
                ['A4', '4n'], ['D4', '4n'], ['E4', '4n'], ['D4', '4n']
            ],
            // Middle section - more movement
            phraseC: [
                ['D4', '4n'], ['C4', '4n'], ['E4', '4n'], ['C4', '4n'],
                ['E4', '4n'], ['F4', '4n'], ['D4', '4n'], ['D4', '4n']
            ],
            phraseC2: [
                ['D4', '4n'], ['C4', '4n'], ['E4', '4n'], ['C4', '4n'],
                ['E4', '4n'], ['F4', '4n'], ['D4', '4n'], ['C4', '4n']
            ],
            // Higher register phrase
            phraseD: [
                ['A4', '4n'], ['C5', '4n'], ['B4', '4n'], ['C5', '4n'],
                ['A4', '4n'], ['C5', '4n'], ['G4', '4n'], ['A4', '4n']
            ],
            // Final resolution
            phraseEnd: [
                ['F4', '2n'], ['E4', '2n'], ['D4', '2n'], ['D4', '2n']
            ],
            // Bass patterns (whole notes - very slow)
            bassD: [['D2', '1m']],
            bassC: [['C2', '1m']],
            bassF: [['F2', '1m']],
            bassG: [['G2', '1m']],
            bassA: [['A2', '1m']],
            bassE: [['E2', '1m']],
            // Chord pads
            chordDm: [['D4', 'F4', 'A4'], null, null, null, null, null, null, null],
            chordC: [['C4', 'E4', 'G4'], null, null, null, null, null, null, null],
            chordF: [['F4', 'A4', 'C5'], null, null, null, null, null, null, null],
            chordG: [['G4', 'B4', 'D5'], null, null, null, null, null, null, null],
            chordAm: [['A4', 'C5', 'E5'], null, null, null, null, null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar Temple of Time structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        // A-A-B-A-C-D-B-End structure
        switch (section) {
            case 0: case 1: // Phrase A
                melody = patterns.phraseA;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
            case 2: case 3: // Phrase A variation
                melody = patterns.phraseA2;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
            case 4: case 5: // Phrase B
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 6: case 7: // Phrase B2
                melody = patterns.phraseB2;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordAm;
                break;
            case 8: case 9: // Phrase C (middle)
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                chordPattern = patterns.chordF;
                break;
            case 10: case 11: // Phrase C2
                melody = patterns.phraseC2;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 12: case 13: // Phrase D (higher)
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
            case 14: // Phrase B return
                melody = patterns.phraseB;
                bassPattern = patterns.bassG;
                chordPattern = patterns.chordG;
                break;
            case 15: // Ending
                melody = patterns.phraseEnd;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordDm;
                break;
        }

        // Play melody (quarter notes - slow and contemplative)
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime);
                const velocity = 0.5 + (Math.random() * 0.15);
                this.harp.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass (whole notes)
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note) {
                    const noteTime = time + (i * Tone.Time('1m').toSeconds());
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.6);
                }
            });
        }

        // Play pad chord at start of bar
        if (chordPattern && chordPattern[0]) {
            this.pad.triggerAttackRelease(chordPattern[0], '1m', time + 0.1, 0.25);
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
        console.log('[TempleOfTime] Started playing - Sacred contemplation');
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
    module.exports = { TempleOfTimePlayer };
}
