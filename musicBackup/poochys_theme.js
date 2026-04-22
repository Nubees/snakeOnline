// =============================================================================
// POOCHY'S THEME / FOREST THEME - Tetris Attack
// Parsed from MIDI and converted to Tone.js
// Original: Composer for Tetris Attack (Panel de Pon)
// =============================================================================

class PoochysThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 125; // Slightly upbeat but relaxed
        this.currentBar = 0;
        this.loop = null;

        // Instruments
        this.lead = null;
        this.bass = null;
        this.pad = null;
        this.bell = null;

        // Effects
        this.reverb = null;
        this.delay = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;

        try {
            // Effects chain
            this.reverb = new Tone.Reverb({
                decay: 2.5,
                wet: 0.35,
                preDelay: 0.08
            }).toDestination();

            this.delay = new Tone.FeedbackDelay('8n.', 0.25).connect(this.reverb);

            // Lead synth - bright, slightly plucky like a kalimba or music box
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.005,
                    decay: 0.35,
                    sustain: 0.3,
                    release: 0.8
                }
            }).connect(this.delay);
            this.lead.volume.value = -8;

            // Bass - warm, round
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.02,
                    decay: 0.4,
                    sustain: 0.5,
                    release: 0.6
                },
                filterEnvelope: {
                    attack: 0.01,
                    decay: 0.2,
                    sustain: 0.3,
                    baseFrequency: 150,
                    octaves: 2
                }
            }).connect(this.reverb);
            this.bass.volume.value = -4;

            // Pad - soft, atmospheric
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: {
                    attack: 0.8,
                    decay: 1.0,
                    sustain: 0.4,
                    release: 1.5
                }
            }).connect(this.reverb);
            this.pad.volume.value = -18;

            // Bell - for accents
            this.bell = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: {
                    attack: 0.001,
                    decay: 1.2,
                    sustain: 0.05,
                    release: 2.0
                }
            }).connect(this.reverb);
            this.bell.volume.value = -14;

            this.initialized = true;
        } catch (e) {
            console.warn('[PoochysTheme] Init failed:', e);
        }
    }

    // Melody patterns (eighth notes, each array is one bar)
    getMelodyPatterns() {
        return {
            // Main theme - bars 1-2 (F-G-C-G-E-C-G-C)
            mainA: [
                ['F4', '8n'], ['G4', '8n'], ['C5', '8n'], ['G4', '8n'],
                ['E5', '8n'], ['C5', '8n'], ['G4', '8n'], ['C5', '8n']
            ],
            // Main theme variation - bars 3-4 (E4-G-C-G...)
            mainB: [
                ['E4', '8n'], ['G4', '8n'], ['C5', '8n'], ['G4', '8n'],
                ['E5', '8n'], ['C5', '8n'], ['G4', '8n'], ['C5', '8n']
            ],
            // Bridge section - uses A minor
            bridge1: [
                ['A4', '8n'], ['C5', '8n'], ['E5', '8n'], ['A4', '8n'],
                ['C5', '8n'], ['E5', '8n'], ['F5', '8n'], ['C5', '8n']
            ],
            bridge2: [
                ['C5', '8n'], ['E5', '8n'], ['C5', '8n'], ['D5', '8n'],
                ['E5', '8n'], ['E5', '8n'], ['C5', '8n'], ['E5', '8n']
            ],
            bridge3: [
                ['C5', '8n'], ['D5', '8n'], ['E5', '8n'], ['A4', '8n'],
                ['E5', '8n'], ['G5', '8n'], ['E5', '8n'], ['C5', '8n']
            ],
            bridge4: [
                ['A4', '8n'], ['E4', '8n'], ['G4', '8n'], ['C5', '8n'],
                ['G4', '8n'], ['E5', '8n'], ['C5', '8n'], ['G4', '8n']
            ],
            // Bass patterns
            bassC: [['C3', '2n'], ['G2', '2n']],
            bassF: [['F2', '2n'], ['C3', '2n']],
            bassG: [['G2', '2n'], ['D3', '2n']],
            bassAm: [['A2', '2n'], ['E3', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;

        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();

        // Song structure (68 bars total, looped)
        const section = barNum % 68;

        // Determine which melody to play
        let melody = null;
        let bassPattern = null;

        if (section < 16) {
            // Section A - Main theme (bars 1-16)
            melody = (section % 4 < 2) ? patterns.mainA : patterns.mainB;
            bassPattern = patterns.bassC;
        } else if (section < 24) {
            // Section B - First bridge (bars 17-24)
            const bridgePos = section % 8;
            if (bridgePos === 0) melody = patterns.bridge1;
            else if (bridgePos === 4) melody = patterns.bridge2;
            else if (bridgePos === 5) melody = patterns.bridge3;
            else if (bridgePos === 6) melody = patterns.bridge4;
            else melody = patterns.mainA;
            bassPattern = (section % 2 === 0) ? patterns.bassAm : patterns.bassF;
        } else if (section < 38) {
            // Section A' - Main theme return (bars 25-38)
            melody = ((section - 24) % 4 < 2) ? patterns.mainA : patterns.mainB;
            bassPattern = patterns.bassC;
        } else if (section < 46) {
            // Section B' - Bridge variation (bars 39-46)
            const bridgePos = (section - 38) % 8;
            if (bridgePos === 0) melody = patterns.bridge1;
            else if (bridgePos === 4) melody = patterns.bridge2;
            else if (bridgePos === 5) melody = patterns.bridge3;
            else if (bridgePos === 6) melody = patterns.bridge4;
            else melody = patterns.mainA;
            bassPattern = (section % 2 === 0) ? patterns.bassAm : patterns.bassF;
        } else {
            // Section C - Outro with A minor riff (bars 47-68)
            melody = patterns.mainA;
            bassPattern = patterns.bassAm;
        }

        // Play melody
        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                const velocity = 0.6 + (Math.random() * 0.15);
                this.lead.triggerAttackRelease(note, duration, noteTime, velocity);
            });
        }

        // Play bass (half notes)
        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * Tone.Time('2n').toSeconds());
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
            });
        }

        // Play pad chords on even bars
        if (section % 2 === 0) {
            let chord = ['C4', 'E4', 'G4']; // C major
            if (section >= 16 && section < 24) chord = ['A3', 'C4', 'E4']; // A minor
            if (section >= 38 && section < 46) chord = ['A3', 'C4', 'E4'];
            if (section >= 46) chord = ['F3', 'A3', 'C4']; // F major

            this.pad.triggerAttackRelease(chord, '1m', time + 0.1, 0.3);
        }

        // Bell accents on beat 1 of every 4 bars
        if (section % 4 === 0) {
            this.bell.triggerAttackRelease(['C6', 'E6'], '2n', time, 0.25);
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
        console.log('[PoochysTheme] Started - Forest Theme from Tetris Attack');
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.loop) {
                this.loop.dispose();
                this.loop = null;
            }
        }
    }
}

// Create a standalone function to play this as a music track
function createPoochysThemeTrack() {
    const player = new PoochysThemePlayer();

    return {
        name: 'Poochy\'s Theme',
        description: 'Forest Theme from Tetris Attack - cheerful and playful',
        bpm: 125,

        async play() {
            await player.start();
        },

        stop() {
            player.stop();
        },

        // Optional: adapt to gameplay like the procedural system
        updateIntensity(dangerLevel) {
            if (!player.isPlaying) return;
            // Keep the playful forest vibe even when intense
            const targetBpm = 125 + (dangerLevel * 10);
            Tone.Transport.bpm.rampTo(targetBpm, 2);
        }
    };
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PoochysThemePlayer, createPoochysThemeTrack };
}
