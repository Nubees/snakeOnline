// =============================================================================
// SONG OF STORMS - The Legend of Zelda: Ocarina of Time
// Fast, energetic waltz with accordion-like sound
// Parsed from MIDI and recreated with Tone.js
// =============================================================================

class SongOfStormsPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 160; // Fast, energetic tempo
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;      // Accordion-like lead
        this.bass = null;      // Deep bass
        this.chords = null;    // Chord stabs
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            // Medium reverb for energetic but spacious feel
            this.reverb = new Tone.Reverb({
                decay: 1.5,
                wet: 0.25,
                preDelay: 0.05
            }).toDestination();

            // Light delay for bounce
            this.delay = new Tone.FeedbackDelay('8n', 0.2).connect(this.reverb);

            // Accordion-like lead
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.5,
                    release: 0.4
                }
            }).connect(this.delay);
            this.lead.volume.value = -12;

            // Bass - deep and punchy
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'square' },
                envelope: {
                    attack: 0.02,
                    decay: 0.2,
                    sustain: 0.4,
                    release: 0.3
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.3,
                    baseFrequency: 60,
                    octaves: 2.5
                }
            }).connect(this.reverb);
            this.bass.volume.value = -10;

            // Chords - bright and punchy
            this.chords = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.005,
                    decay: 0.3,
                    sustain: 0.3,
                    release: 0.5
                }
            }).connect(this.reverb);
            this.chords.volume.value = -16;

            this.initialized = true;
        } catch (e) {
            console.warn('[SongOfStorms] Init failed:', e);
        }
    }

    // Song of Storms - fast waltz in D minor
    getMelodyPatterns() {
        return {
            // Main phrase A - D minor arpeggio
            phraseA: [
                ['D3', '8n'], ['A4', '8n'], ['A4', '8n'], ['E3', '8n'],
                ['E4', '8n'], ['B4', '8n'], ['F3', '8n'], ['C5', '8n']
            ],
            // Phrase B - F major
            phraseB: [
                ['C5', '8n'], ['E3', '8n'], ['E4', '8n'], ['B4', '8n'],
                ['D3', '8n'], ['A4', '8n'], ['A4', '8n'], ['E3', '8n']
            ],
            // Phrase C - building up
            phraseC: [
                ['E4', '8n'], ['B4', '8n'], ['F3', '8n'], ['C5', '8n'],
                ['C5', '8n'], ['E3', '8n'], ['E4', '8n'], ['B4', '8n']
            ],
            // Variation with higher notes
            phraseD: [
                ['D4', '8n'], ['F4', '8n'], ['D5', '8n'], ['A3', '8n'],
                ['D4', '8n'], ['F4', '8n'], ['D5', '8n'], ['E5', '8n']
            ],
            // Exciting phrase
            phraseE: [
                ['C4', '8n'], ['F5', '8n'], ['E5', '8n'], ['F5', '8n'],
                ['E5', '8n'], ['C5', '8n'], ['A4', '8n'], ['A4', '8n']
            ],
            // Ending phrase
            phraseEnd: [
                ['D4', '8n'], ['F4', '8n'], ['G4', '8n'], ['A4', '8n'],
                ['F3', '8n'], ['A4', '8n'], ['D4', '8n'], ['F4', '8n']
            ],
            // Bass patterns (quarter notes, oom-pah-pah feel)
            bassDm: [['D2', '4n'], ['A2', '8n'], ['D2', '8n'], ['D2', '4n'], ['A2', '8n'], ['D2', '8n']],
            bassE: [['E2', '4n'], ['B2', '8n'], ['E2', '8n'], ['E2', '4n'], ['B2', '8n'], ['E2', '8n']],
            bassF: [['F2', '4n'], ['C3', '8n'], ['F2', '8n'], ['F2', '4n'], ['C3', '8n'], ['F2', '8n']],
            bassA: [['A2', '4n'], ['E3', '8n'], ['A2', '8n'], ['A2', '4n'], ['E3', '8n'], ['A2', '8n']],
            bassC: [['C2', '4n'], ['G2', '8n'], ['C2', '8n'], ['C2', '4n'], ['G2', '8n'], ['C2', '8n']],
            // Chord patterns (stabs on beat 1)
            chordDm: [['D4', 'F4', 'A4'], null, null, null, null, null, null, null],
            chordE: [['E4', 'G4', 'B4'], null, null, null, null, null, null, null],
            chordF: [['F4', 'A4', 'C5'], null, null, null, null, null, null, null],
            chordA: [['A4', 'C5', 'E5'], null, null, null, null, null, null, null],
            chordC: [['C4', 'E4', 'G4'], null, null, null, null, null, null, null]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        // 16-bar structure
        const section = barNum % 16;
        let melody = null;
        let bassPattern = null;
        let chordPattern = null;

        switch (section) {
            case 0: case 1: // Phrase A
                melody = patterns.phraseA;
                bassPattern = patterns.bassDm;
                chordPattern = patterns.chordDm;
                break;
            case 2: case 3: // Phrase B
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 4: case 5: // Phrase C
                melody = patterns.phraseC;
                bassPattern = patterns.bassF;
                chordPattern = patterns.chordF;
                break;
            case 6: case 7: // Phrase A return
                melody = patterns.phraseA;
                bassPattern = patterns.bassDm;
                chordPattern = patterns.chordDm;
                break;
            case 8: case 9: // Phrase D (build up)
                melody = patterns.phraseD;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 10: case 11: // Phrase E (high energy)
                melody = patterns.phraseE;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 12: case 13: // Phrase D again
                melody = patterns.phraseD;
                bassPattern = patterns.bassA;
                chordPattern = patterns.chordA;
                break;
            case 14: case 15: // Ending
                melody = patterns.phraseEnd;
                bassPattern = patterns.bassDm;
                chordPattern = patterns.chordDm;
                break;
        }

        // Play melody (eighth notes - fast!)
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.65 + (Math.random() * 0.15);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note && i < 6) {
                    const noteTime = time + (i * quarterTime / 2);
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
                }
            });
        }

        // Play chord stab on beat 1
        if (chordPattern && chordPattern[0]) {
            this.chords.triggerAttackRelease(chordPattern[0], '8n', time + 0.02, 0.4);
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
        console.log('[SongOfStorms] Started playing - Storm is coming!');
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
    module.exports = { SongOfStormsPlayer };
}
