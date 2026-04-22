// =============================================================================
// L'S THEME - Death Note
// Mysterious, jazz-influenced detective theme
// =============================================================================

class LsThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 90;
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;
        this.bass = null;
        this.reverb = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.35, preDelay: 0.1 }).toDestination();

            // Mysterious piano-like lead
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.3, release: 0.8 }
            }).connect(this.reverb);
            this.lead.volume.value = -10;

            // Walking bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.4 },
                filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 120, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -8;

            this.initialized = true;
        } catch (e) {
            console.warn('[LsTheme] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // F# minor jazzy feel
            phraseA: [
                ['F#3', '8n'], ['B2', '8n'], ['D3', '8n'], ['D3', '8n'],
                ['D3', '8n'], ['D3', '8n'], ['F#3', '8n'], ['D3', '8n']
            ],
            phraseB: [
                ['F#3', '8n'], ['F#3', '8n'], ['F#3', '8n'], ['A#3', '8n'],
                ['F#3', '8n'], ['B2', '8n'], ['D3', '8n'], ['D3', '8n']
            ],
            phraseC: [
                ['D3', '8n'], ['D3', '8n'], ['F#3', '8n'], ['D3', '8n'],
                ['F#3', '8n'], ['B2', '8n'], ['F#3', '8n'], ['A#3', '8n']
            ],
            bassF: [['F#2', '2n'], ['C#3', '2n']],
            bassB: [['B1', '2n'], ['F#2', '2n']],
            bassD: [['D2', '2n'], ['A2', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 12;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1: case 2:
                melody = patterns.phraseA;
                bassPattern = patterns.bassF;
                break;
            case 3: case 4: case 5:
                melody = patterns.phraseB;
                bassPattern = patterns.bassB;
                break;
            case 6: case 7: case 8:
                melody = patterns.phraseC;
                bassPattern = patterns.bassD;
                break;
            default:
                melody = patterns.phraseA;
                bassPattern = patterns.bassF;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                this.lead.triggerAttackRelease(note, duration, noteTime, 0.6);
            });
        }

        if (bassPattern) {
            bassPattern.forEach(([note, duration], i) => {
                const noteTime = time + (i * quarterTime * 2);
                this.bass.triggerAttackRelease(note, duration, noteTime, 0.7);
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
        console.log('[LsTheme] Started - Justice will prevail');
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
    module.exports = { LsThemePlayer };
}
