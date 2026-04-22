// =============================================================================
// MISA'S THEME - Death Note
// Pop idol upbeat theme
// =============================================================================

class MisasThemePlayer {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.bpm = 140;
        this.currentBar = 0;
        this.loop = null;
        this.lead = null;
        this.bass = null;
        this.reverb = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;
        try {
            this.reverb = new Tone.Reverb({ decay: 1.5, wet: 0.25, preDelay: 0.05 }).toDestination();

            // Bright pop synth
            this.lead = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 }
            }).connect(this.reverb);
            this.lead.volume.value = -10;

            // Pop bass
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
                filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, baseFrequency: 100, octaves: 2.5 }
            }).connect(this.reverb);
            this.bass.volume.value = -8;

            this.initialized = true;
        } catch (e) {
            console.warn('[MisasTheme] Init failed:', e);
        }
    }

    getMelodyPatterns() {
        return {
            // E major pop feel
            phraseA: [
                ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'], ['E4', '8n'],
                ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'], ['E4', '8n']
            ],
            phraseB: [
                ['E4', '8n'], ['E4', '8n'], ['E4', '8n'], ['G#4', '8n'],
                ['G#4', '8n'], ['G#4', '8n'], ['G#4', '8n'], ['E4', '8n']
            ],
            phraseC: [
                ['E4', '8n'], ['A4', '8n'], ['A4', '8n'], ['A4', '8n'],
                ['A4', '8n'], ['E4', '8n'], ['E4', '8n'], ['E4', '8n']
            ],
            bassE: [['E2', '2n'], ['B2', '2n']],
            bassA: [['A2', '2n'], ['E3', '2n']]
        };
    }

    playBar(time, barNum) {
        if (!this.isPlaying) return;
        const patterns = this.getMelodyPatterns();
        const eighthTime = Tone.Time('8n').toSeconds();
        const quarterTime = Tone.Time('4n').toSeconds();

        const section = barNum % 8;
        let melody = null;
        let bassPattern = null;

        switch (section) {
            case 0: case 1: case 2: case 3:
                melody = patterns.phraseA;
                bassPattern = patterns.bassE;
                break;
            case 4: case 5:
                melody = patterns.phraseB;
                bassPattern = patterns.bassE;
                break;
            default:
                melody = patterns.phraseC;
                bassPattern = patterns.bassA;
        }

        if (melody) {
            melody.forEach(([note, duration], i) => {
                const noteTime = time + (i * eighthTime);
                this.lead.triggerAttackRelease(note, duration, noteTime, 0.65);
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
        console.log('[MisasTheme] Started - Pop idol energy');
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
    module.exports = { MisasThemePlayer };
}
