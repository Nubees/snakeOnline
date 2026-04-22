// =============================================================================
// MUSIC SYSTEM BACKUP - Cozy Valley Track (Song 0)
// =============================================================================
// Backup Date: 2026-04-22
// Description: Backup of the finalized music system with "Cozy Valley" track
//              featuring 100 BPM tempo and tape echo effects on guitar.
//              Stardew Valley-inspired pastoral, warm, flowing music.
// =============================================================================

class MusicSystem {
    constructor() {
        this.currentTrack = 0; // 0-5 = procedural music flavors, 6 = Silent
        this.audioElements = [];
        this.trackNames = [
            'Cozy Valley',        // Track 0 - Stardew-inspired pastoral
            'Neon Nights',        // Track 1
            'Synthwave Pulse',    // Track 2
            'Arcade Retro',       // Track 3
            'Epic Boss Battle',   // Track 4
            'Bonus Level',        // Track 5
            'Silent Mode'         // Track 6
        ];
        this.initialized = false;
        this.usingMP3 = false;
        this.mp3Available = [false, false, false, false, false];
    }

    init() {
        if (this.initialized) return;

        for (let i = 1; i <= 5; i++) {
            const audio = new Audio();
            audio.src = `assets/music/song${i}.mp3`;
            audio.loop = true;
            audio.volume = 0.4;
            audio.preload = 'auto';

            const trackIdx = i - 1;
            audio.addEventListener('canplaythrough', () => {
                this.mp3Available[trackIdx] = true;
                console.log(`[MusicSystem] MP3 track ${i} is available`);
            });
            audio.addEventListener('error', () => {
                this.mp3Available[trackIdx] = false;
            });
            this.audioElements.push(audio);
        }

        this.initialized = true;
        this.updateHUD();
    }

    nextTrack() {
        this.init();
        this.stop();
        this.currentTrack = (this.currentTrack + 1) % 7;
        this.updateHUD();
        this.play();
        return this.currentTrack;
    }

    updateHUD() {
        const musicTrackEl = document.getElementById('musicTrack');
        if (musicTrackEl) {
            const displayName = this.currentTrack === 6 ? 'Silent' : `M${this.currentTrack + 1} ${this.trackNames[this.currentTrack]}`;
            musicTrackEl.textContent = displayName;
        }
    }

    getCurrentTrackName() {
        return this.trackNames[this.currentTrack];
    }

    play() {
        if (!this.initialized) this.init();
        if (this.currentTrack === 6) {
            this.stopAllMusic();
            return;
        }

        const mp3Index = this.currentTrack;
        if (mp3Index >= 0 && mp3Index < 5 && this.mp3Available[mp3Index]) {
            this.usingMP3 = true;
            proceduralMusic.stop();
            this.audioElements[mp3Index].currentTime = 0;
            this.audioElements[mp3Index].play().catch(e => console.log('[MusicSystem] Playback blocked:', e));
        } else {
            this.usingMP3 = false;
            this.stopMP3s();
            this.startProceduralForTrack(this.currentTrack);
        }
    }

    async startProceduralForTrack(trackNum) {
        const configs = [
            { tempo: 100, scale: 'cozy', name: 'Cozy Valley' },  // Track 0 - Slightly faster, pastoral
            { tempo: 110, scale: 'minor', name: 'Focused' },
            { tempo: 125, scale: 'minor', name: 'Intense' },
            { tempo: 135, scale: 'diminished', name: 'Dark' },
            { tempo: 145, scale: 'diminished', name: 'Boss' },
            { tempo: 130, scale: 'major', name: 'Bonus' }
        ];

        const config = configs[trackNum] || configs[0];
        proceduralMusic.setMusicStyle(config.tempo, config.scale);
        await proceduralMusic.start();
    }

    stopAllMusic() {
        this.stopMP3s();
        proceduralMusic.stop();
    }

    stopMP3s() {
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    stop() {
        if (this.currentTrack === 6) {
            this.stopAllMusic();
        } else {
            this.stopMP3s();
        }
    }
}

let musicSystem = new MusicSystem();

// =============================================================================
// ADAPTIVE PROCEDURAL MUSIC SYSTEM - COZY GAME EDITION
// =============================================================================
// Inspired by Stardew Valley - warm, pastoral, flowing music with rich instruments

class ProceduralMusic {
    constructor() {
        this.isPlaying = false;
        this.initialized = false;
        this.baseTempo = 100;  // Slightly faster for better flow
        this.currentTempo = 100;
        this.barCount = 0;
        this.swing = 0.12;
        this.dangerLevel = 0;
        this.urgencyLevel = 0;

        // Chord progressions (I-V-vi-IV and variations)
        this.chordProgressions = {
            cozy: [['C3', 'E3', 'G3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3']],
            warm: [['C3', 'E3', 'G3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3'], ['C3', 'E3', 'G3']],
            nostalgic: [['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['C3', 'E3', 'G3'], ['G2', 'B2', 'D3']],
            gentle: [['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3']],
            dreamy: [['F2', 'A2', 'C3'], ['C3', 'E3', 'G3'], ['G2', 'B2', 'D3'], ['A2', 'C3', 'E3']],
        };
        this.currentProgression = this.chordProgressions.cozy;
        this.currentChordIndex = 0;

        // Melodic themes - flowing phrases
        this.melodicThemes = {
            morning: [
                [0, 2, 4, 5, 4, 2, 0, null, 4, 5, 7, 9, 7, 5, 4, 2],
                [0, 4, 2, 5, 4, 7, 5, 4, 2, 0, null, null, 2, 4, 0, null]
            ],
            wandering: [
                [0, null, 2, 4, null, 5, 4, 2, null, 0, 2, null, 4, 5, 4, 2],
                [4, 2, 0, null, 4, 5, 7, 5, 4, 2, 0, 2, 4, 2, 0, null]
            ],
            peaceful: [
                [0, 2, 4, 2, 0, null, 0, 2, 4, 5, 4, 2, 4, 2, 0, null],
                [4, 2, 0, 2, 4, null, 5, 4, 2, 0, null, null, 0, 2, 4, 5]
            ],
            building: [
                [0, 2, 4, 7, 5, 4, 2, 4, 5, 7, 9, 7, 5, 4, 5, 7],
                [0, 4, 7, 4, 5, 7, 9, 7, 4, 5, 4, 2, 0, 2, 4, 0]
            ],
            cozy: [
                [0, null, 2, 4, 2, 0, null, 2, 4, 5, 4, 2, 0, null, null, null],
                [4, 2, 0, 2, 4, 5, 4, 2, 0, null, 2, 4, 2, 0, null, null]
            ]
        };
        this.currentTheme = this.melodicThemes.cozy;
        this.currentPhrase = this.currentTheme[0];
        this.phraseStep = 0;

        // Arpeggio patterns
        this.arpeggioPatterns = [[0, 2, 4, 2], [0, 4, 7, 4], [4, 2, 0, 2], [0, 2, 4, 7]];
        this.currentArpPattern = 0;

        // Instruments
        this.guitar = null;
        this.bell = null;
        this.bass = null;
        this.pad = null;
        this.flute = null;
        this.strings = null;

        // Effects
        this.reverb = null;
        this.delay = null;           // Main delay for flute
        this.echo = null;            // Tape echo for guitar slow parts
        this.chorus = null;
        this.musicLoop = null;
    }

    init() {
        if (this.initialized || typeof Tone === 'undefined') return;

        try {
            // Master chain: Reverb -> Destination
            this.reverb = new Tone.Reverb({ decay: 3.5, wet: 0.3, preDelay: 0.1 }).toDestination();

            // Main dotted 8th delay for flute
            this.delay = new Tone.FeedbackDelay('8n.', 0.35).connect(this.reverb);

            // Tape echo for guitar - longer, warmer echoes on slow parts
            this.echo = new Tone.FeedbackDelay('4n', 0.45).connect(this.reverb);
            this.echo.wet.value = 0.25;

            this.chorus = new Tone.Chorus({ frequency: 0.6, delayTime: 3.5, depth: 0.35, wet: 0.25 }).connect(this.reverb);

            // Guitar - warm plucks with echo for slow parts
            this.guitar = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.008, decay: 0.55, sustain: 0.2, release: 1.2 }  // Longer release for echoes
            }).connect(this.echo);  // Route through echo for warm repeats
            this.guitar.volume.value = -10;

            // Bell - crystalline
            this.bell = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 1.3, sustain: 0.05, release: 2.0 }
            }).connect(this.reverb);
            this.bell.volume.value = -18;

            // Pad - atmospheric
            this.pad = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 1.5, decay: 1.0, sustain: 0.6, release: 2.5 }
            }).connect(this.reverb);
            this.pad.volume.value = -22;

            // Bass - warm and round
            this.bass = new Tone.MonoSynth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.02, decay: 0.3, sustain: 0.5, release: 0.5 },
                filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 200, octaves: 2 }
            }).connect(this.reverb);
            this.bass.volume.value = -6;

            // Flute - melodic lead
            this.flute = new Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.04, decay: 0.3, sustain: 0.7, release: 0.6 }
            }).connect(this.delay);
            this.flute.volume.value = -12;

            // Strings - background
            this.strings = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.6, decay: 0.8, sustain: 0.4, release: 1.5 }
            }).connect(this.chorus);
            this.strings.volume.value = -20;

            this.initialized = true;
        } catch (e) {
            console.warn('[ProceduralMusic] Init failed:', e);
        }
    }

    getCurrentChord() {
        return this.currentProgression[this.currentChordIndex % this.currentProgression.length];
    }

    getNoteFromDegree(degree, octave = 4) {
        const scale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        return scale[((degree % 7) + 7) % 7] + octave;
    }

    humanizeTime(baseTime, amount = 0.015) {
        return baseTime + (Math.random() * amount - amount / 2);
    }

    humanizeVel(baseVel, variance = 0.12) {
        return Math.max(0.2, Math.min(1.0, baseVel + (Math.random() * variance * 2 - variance)));
    }

    playBar(time) {
        if (!this.isPlaying) return;

        const stepDuration = Tone.Time('16n').toSeconds();
        const currentChord = this.getCurrentChord();
        const rootNote = currentChord[0];

        // Bass with groove
        const bassPattern = [
            { time: 0, note: rootNote, vel: 0.8 },
            { time: 0.25, note: Math.random() < 0.4 ? currentChord[1] : rootNote, vel: 0.5 },
            { time: 0.5, note: rootNote, vel: 0.6 },
            { time: 0.75, note: Math.random() < 0.3 ? currentChord[2] : rootNote, vel: 0.5 }
        ];

        bassPattern.forEach(hit => {
            const noteTime = time + (hit.time * stepDuration * 4);
            this.bass.triggerAttackRelease(hit.note, '8n', this.humanizeTime(noteTime, 0.01), this.humanizeVel(hit.vel));
        });

        // Guitar arpeggios
        for (let i = 0; i < 8; i++) {
            if (Math.random() < 0.75) {
                const arpPattern = this.arpeggioPatterns[this.currentArpPattern];
                const note = currentChord[arpPattern[i % arpPattern.length]];
                const noteTime = time + (i * stepDuration * 2);
                const octave = Math.random() < 0.3 ? '4' : '5';
                this.guitar.triggerAttackRelease(note.slice(0, -1) + octave, '8n', this.humanizeTime(noteTime), this.humanizeVel(0.45));
            }
        }

        // Bell accents
        const bellPattern = [0.2, 0, 0.15, 0.3, 0.1, 0, 0.25, 0.15];
        bellPattern.forEach((prob, i) => {
            if (Math.random() < prob + (this.dangerLevel * 0.2)) {
                const noteTime = time + (i * stepDuration * 2);
                const scaleDegree = this.currentPhrase[i % this.currentPhrase.length];
                if (scaleDegree !== null) {
                    const note = this.getNoteFromDegree(scaleDegree + 7, 5);
                    this.bell.triggerAttackRelease(note, '2n', this.humanizeTime(noteTime), this.humanizeVel(0.25, 0.08));
                }
            }
        });

        // Melodic phrase
        const phrase = this.currentPhrase;
        for (let i = 0; i < phrase.length; i++) {
            const scaleDegree = phrase[i];
            if (scaleDegree !== null && Math.random() < 0.7) {
                const noteTime = time + (i * stepDuration);
                const note = this.getNoteFromDegree(scaleDegree + 7, 5);
                const instrument = (i === 0 || i === 8) ? this.strings : this.flute;
                const duration = (i % 4 === 0) ? '4n' : '8n';
                instrument.triggerAttackRelease(note, duration, this.humanizeTime(noteTime), this.humanizeVel(0.55));
            }
        }

        // Pad chords
        if (this.barCount % 2 === 0) {
            this.pad.triggerAttackRelease(currentChord, '1m', time + 0.1, 0.3);
        }

        this.currentChordIndex++;
        if (this.currentChordIndex >= this.currentProgression.length) {
            this.currentChordIndex = 0;
            this.currentPhrase = this.currentTheme[Math.floor(Math.random() * this.currentTheme.length)];
            if (Math.random() < 0.3) this.currentArpPattern = Math.floor(Math.random() * this.arpeggioPatterns.length);
        }

        this.barCount++;
    }

    async start() {
        if (this.isPlaying) return;
        if (typeof Tone === 'undefined') return;

        this.init();
        if (!this.initialized) return;

        await Tone.start();
        Tone.Transport.bpm.value = this.currentTempo;
        Tone.Transport.swing = this.swing;

        this.musicLoop = new Tone.Loop((time) => this.playBar(time), '1m').start(0);
        Tone.Transport.start();

        this.isPlaying = true;
    }

    stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            if (this.musicLoop) { this.musicLoop.dispose(); this.musicLoop = null; }
        }
    }

    setMusicStyle(tempo, progressionName) {
        this.baseTempo = tempo;
        this.currentTempo = tempo;
        if (this.chordProgressions[progressionName]) {
            this.currentProgression = this.chordProgressions[progressionName];
            this.currentChordIndex = 0;
        }
        if (typeof Tone !== 'undefined' && Tone.Transport) Tone.Transport.bpm.rampTo(tempo, 2);
    }

    updateGameplayState(distanceToEnemy, playerLives, maxLives, timeRemaining, maxTime) {
        const maxDistance = 20;
        this.dangerLevel = Math.max(0, 1 - (distanceToEnemy / maxDistance));
        if (timeRemaining !== undefined && maxTime !== undefined) {
            this.urgencyLevel = timeRemaining < 30 ? (30 - timeRemaining) / 30 : 0;
        }
        const targetTempo = this.baseTempo + (this.dangerLevel * 15) + (this.urgencyLevel * 10);
        if (typeof Tone !== 'undefined' && Tone.Transport) Tone.Transport.bpm.rampTo(targetTempo, 4);

        if (this.dangerLevel > 0.6 && this.currentTheme !== this.melodicThemes.building) {
            this.currentTheme = this.melodicThemes.building;
            this.currentPhrase = this.currentTheme[0];
        } else if (this.dangerLevel < 0.3 && this.currentTheme === this.melodicThemes.building) {
            this.currentTheme = this.melodicThemes.cozy;
            this.currentPhrase = this.currentTheme[0];
        }
    }

    onPowerUpSpawn() {
        if (!this.initialized || !this.isPlaying) return;
        const now = Tone.now();
        ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((note, i) => {
            setTimeout(() => this.bell.triggerAttackRelease(note, '8n', Tone.now(), 0.4 - (i * 0.05)), i * 60);
        });
    }

    onPowerUpCollect() {
        if (!this.initialized || !this.isPlaying) return;
        const now = Tone.now();
        ['E5', 'G5', 'C6', 'E6', 'G6'].forEach((note, i) => {
            this.guitar.triggerAttackRelease(note, '16n', now + i * 0.08, 0.5 - (i * 0.06));
        });
    }

    onFoodCollect() {
        if (!this.initialized || !this.isPlaying) return;
        const notes = ['C5', 'D5', 'E5', 'G5'];
        this.bell.triggerAttackRelease(notes[Math.floor(Math.random() * notes.length)], '8n', Tone.now(), this.humanizeVel(0.35));
    }

    onPlayerDamage() {
        if (!this.initialized || !this.isPlaying) return;
        this.pad.triggerAttackRelease(['C3', 'F#3'], '2n', Tone.now(), 0.5);
    }

    onLevelComplete() {
        if (!this.initialized) return;
        const now = Tone.now();
        [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['C4', 'E4', 'G4', 'C5']].forEach((chord, i) => {
            this.strings.triggerAttackRelease(chord, '1n', now + i * 0.8, 0.5);
        });
    }

    setLevel(level) {
        switch (level) {
            case 1: case 2:
                this.baseTempo = 100; this.currentProgression = this.chordProgressions.cozy; this.currentTheme = this.melodicThemes.morning; break;
            case 3: case 4:
                this.baseTempo = 96; this.currentProgression = this.chordProgressions.warm; this.currentTheme = this.melodicThemes.wandering; break;
            case 5: case 6:
                this.baseTempo = 110; this.currentProgression = this.chordProgressions.nostalgic; this.currentTheme = this.melodicThemes.building; break;
            case 7: case 8:
                this.baseTempo = 100; this.currentProgression = this.chordProgressions.gentle; this.currentTheme = this.melodicThemes.wandering; break;
            case 10:
                this.baseTempo = 105; this.currentProgression = this.chordProgressions.dreamy; this.currentTheme = this.melodicThemes.peaceful; break;
            default:
                this.baseTempo = 100; this.currentProgression = this.chordProgressions.cozy; this.currentTheme = this.melodicThemes.cozy;
        }
        this.currentTempo = this.baseTempo;
        this.currentChordIndex = 0;
        this.currentPhrase = this.currentTheme[0];
        if (typeof Tone !== 'undefined' && Tone.Transport) Tone.Transport.bpm.value = this.baseTempo;
    }
}

let proceduralMusic = new ProceduralMusic();

// Initialize audio on first user interaction
async function initAudioOnFirstInteraction() {
    console.log('[Audio] First interaction - initializing audio');
    if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
        try {
            await Tone.start();
            console.log('[Audio] Tone.js started');
        } catch (err) {
            console.warn('[Audio] Failed to start Tone.js:', err);
        }
    }
    if (!proceduralMusic.initialized) proceduralMusic.init();
    musicSystem.init();
}
