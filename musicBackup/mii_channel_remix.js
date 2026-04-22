// =============================================================================
// MII CHANNEL REMIX - Wii Channels (with modified notes)
// Playful, quirky theme with a bouncy, modified melody
// Original inspiration from Wii Mii Channel, with interval variations
// =============================================================================

class MiiChannelRemixPlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 115; // Upbeat tempo
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;      // Whistle-like synth
        this.bass = null;      // Bouncy bass
        this.chords = null;    // Sparkle chords
        this.percussion = null; // Simple drum hits
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            // Light reverb for that "white void" Mii Plaza feel
            this.reverb = new Tone.Reverb({
                decay: 1.2,
                wet: 0.2,
                preDelay: 0.04
            }).toDestination();

            // Subtle delay for bouncing feel
            this.delay = new Tone.FeedbackDelay('8n.', 0.15).connect(this.reverb);

            // Lead - whistle-like, bright and playful
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.005,
                    decay: 0.25,
                    sustain: 0.4,
                    release: 0.5
                }
            }).connect(this.delay);
            this.lead.volume.value = -10;

            // Bass - plucky and bouncy
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.3,
                    release: 0.4
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.4,
                    baseFrequency: 100,
                    octaves: 2
                }
            }).connect(this.reverb);
            this.bass.volume.value = -8;

            // Chords - sparkly
            this.chords = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.02,
                    decay: 0.4,
                    sustain: 0.2,
                    release: 0.6
                }
            }).connect(this.reverb);
            this.chords.volume.value = -14;

            // Simple percussion
            this.percussion = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 2,
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0,
                    release: 0.2
                }
            }).toDestination();
            this.percussion.volume.value = -18;

            this.initialized = true;
        } catch (e) {
            console.warn('[MiiChannelRemix] Init failed:', e);
        }
    }

    // Mii Channel Remix - modified from original with different intervals
    getMelodyPatterns() {
        return {
            // Phrase A - modified from original (different intervals, some octave shifts)
            phraseA: [
                ['F#4', '8n'], ['A4', '8n'], ['C#5', '8n'], ['A4', '8n'],
                ['F#4', '8n'], ['D4', '8n'], ['D5', '8n'], ['D4', '8n']
            ],
            // Phrase A2 - variation
            phraseA2: [
                ['C#4', '8n'], ['D4', '8n'], ['F#4', '8n'], ['A4', '8n'],
                ['C#5', '8n'], ['A4', '8n'], ['F#4', '8n'], ['E5', '8n']
            ],
            // Phrase B - different phrase (modified from original)
            phraseB: [
                ['D5', '8n'], ['C#5', '8n'], ['G#4', '8n'], ['C#5', '8n'],
                ['F#4', '8n'], ['C#5', '8n'], ['G#4', '8n'], ['C5', '8n']
            ],
            // Phrase C - walking up differently
            phraseC: [
                ['G4', '8n'], ['F#4', '8n'], ['E4', '8n'], ['C#4', '8n'],
                ['C#4', '8n'], ['E4', '8n'], ['G4', '8n'], ['B4', '8n']
            ],
            // Phrase D - new variation with jump
            phraseD: [
                ['C4', '8n'], ['D#4', '8n'], ['D4', '8n'], ['F#4', '8n'],
                ['A4', '8n'], ['C#5', '8n'], ['A4', '8n'], ['D5', '8n']
            ],
            // Phrase E - modified
            phraseE: [
                ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'], ['E5', '8n'],
                ['D5', '8n'], ['C#5', '8n'], ['B3', '8n'], ['F#4', '8n']
            ],
            // Phrase F - bridge with different intervals
            phraseF: [
                ['A4', '8n'], ['C#5', '8n'], ['F#4', '8n'], ['D5', '8n'],
                ['C#5', '8n'], ['B4', '8n'], ['G4', '8n'], ['E4', '8n']
            ],
            // Phrase G - variation with octave displacement
            phraseG: [
                ['D4', '8n'], ['C#4', '8n'], ['B3', '8n'], ['G3', '8n'],
                ['C#4', '8n'], ['A3', '8n'], ['F#3', '8n'], ['C4', '8n']
            ],
            // Phrase H - ending
            phraseH: [
                ['B3', '8n'], ['F#4', '8n'], ['D4', '8n'], ['B3', '8n'],
                ['C#4', '8n'], ['F#4', '8n'], ['A4', '8n'], ['F#4', '8n']
            ],
            // Bass patterns
            bassFs: [['F#2', '4n'], ['C#3', '8n'], ['F#2', '8n'], ['F#2', '4n'], ['C#3', '8n'], ['F#2', '8n']],
            bassD: [['D2', '4n'], ['A2', '8n'], ['D2', '8n'], ['D2', '4n'], ['A2', '8n'], ['D2', '8n']],
            bassE: [['E2', '4n'], ['B2', '8n'], ['E2', '8n'], ['E2', '4n'], ['B2', '8n'], ['E2', '8n']],
            bassC: [['C2', '4n'], ['G2', '8n'], ['C2', '8n'], ['C2', '4n'], ['G2', '8n'], ['C2', '8n']],
            bassB: [['B2', '4n'], ['F#3', '8n'], ['B2', '8n'], ['B2', '4n'], ['F#3', '8n'], ['B2', '8n']],
            // Sparkle chords
            chordFs: [['F#4', 'A4', 'C#5']],
            chordD: [['D4', 'F#4', 'A4']],
            chordE: [['E4', 'G#4', 'B4']],
            chordC: [['C4', 'E4', 'G4']],
            chordB: [['B3', 'D#4', 'F#4']]
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

        switch (section) {
            case 0:
                melody = patterns.phraseA;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 1:
                melody = patterns.phraseA2;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 2:
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 3:
                melody = patterns.phraseC;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 4:
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 5:
                melody = patterns.phraseE;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 6:
                melody = patterns.phraseF;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 7:
                melody = patterns.phraseG;
                bassPattern = patterns.bassC;
                chordPattern = patterns.chordC;
                break;
            case 8:
                melody = patterns.phraseA;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 9:
                melody = patterns.phraseA2;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 10:
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 11:
                melody = patterns.phraseD;
                bassPattern = patterns.bassD;
                chordPattern = patterns.chordD;
                break;
            case 12:
                melody = patterns.phraseF;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
            case 13:
                melody = patterns.phraseE;
                bassPattern = patterns.bassE;
                chordPattern = patterns.chordE;
                break;
            case 14:
                melody = patterns.phraseH;
                bassPattern = patterns.bassB;
                chordPattern = patterns.chordB;
                break;
            case 15:
                melody = patterns.phraseA;
                bassPattern = patterns.bassFs;
                chordPattern = patterns.chordFs;
                break;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.6 + (Math.random() * 0.1);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                if (note && i < 6) {
                    const noteTime = time + (i * quarterTime / 2);
                    this.bass.triggerAttackRelease(note, duration, noteTime, 0.65);
                }
            });
        }

        if (chordPattern && chordPattern[0]) {
            this.chords.triggerAttackRelease(chordPattern[0], '8n', time + 0.02, 0.3);
        }

        if (section % 2 === 0) {
            this.percussion.triggerAttackRelease('C2', '16n', time + quarterTime, 0.3);
        }
        this.percussion.triggerAttackRelease('C2', '16n', time + (3 * quarterTime), 0.25);
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
        console.log('[MiiChannelRemix] Started playing - Wii would like to play!');
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
    module.exports = { MiiChannelRemixPlayer };
}
