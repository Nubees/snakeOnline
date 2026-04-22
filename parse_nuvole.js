const fs = require('fs');
const data = fs.readFileSync('C:/Users/Hobbs4090/Downloads/Ludovico Einaudi - Nuvole Bianche.mid');

function parseVariableLength(data, offset) {
    let value = 0;
    let i = offset;
    while (i < data.length && (data[i] & 0x80)) {
        value = (value << 7) | (data[i] & 0x7F);
        i++;
    }
    if (i < data.length) {
        value = (value << 7) | data[i];
        return { value, bytesRead: i - offset + 1 };
    }
    return { value: 0, bytesRead: 0 };
}

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function getNoteName(midiNote) {
    return noteNames[midiNote % 12] + (Math.floor(midiNote / 12) - 1);
}

const formatType = (data[8] << 8) | data[9];
const numTracks = (data[10] << 8) | data[11];
const ticksPerQuarter = (data[12] << 8) | data[13];
console.log('Format:', formatType, 'Tracks:', numTracks, 'TPQ:', ticksPerQuarter);

let offset = 14;
let trackInfo = [];
for (let t = 0; t < numTracks && offset < data.length; t++) {
    const sig = data.slice(offset, offset + 4).toString('ascii');
    if (sig !== 'MTrk') break;
    offset += 4;
    const len = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
    offset += 4;
    trackInfo.push({ start: offset, length: len });
    offset += len;
}

console.log('\nFound', trackInfo.length, 'tracks');

let bestTrack = null;
let bestCount = 0;

for (let t = 0; t < trackInfo.length; t++) {
    const track = trackInfo[t];
    let i = track.start;
    let absTime = 0;
    let notes = [];
    let runningStatus = 0;
    let endOfTrack = track.start + track.length;

    while (i < endOfTrack && i < data.length) {
        const delta = parseVariableLength(data, i);
        if (delta.bytesRead === 0) break;
        i += delta.bytesRead;
        absTime += delta.value;

        if (i >= data.length) break;
        let eventByte = data[i];

        if (eventByte === 0xFF) {
            i++;
            if (i >= data.length) break;
            const metaType = data[i++];
            const len = parseVariableLength(data, i);
            i += len.bytesRead + len.value;
            continue;
        }

        if (eventByte === 0xF0 || eventByte === 0xF7) {
            i++;
            const len = parseVariableLength(data, i);
            i += len.bytesRead + len.value;
            continue;
        }

        let eventType;
        if (eventByte & 0x80) {
            eventType = eventByte;
            runningStatus = eventType;
            i++;
        } else {
            eventType = runningStatus;
        }

        if (eventType === 0) { i++; continue; }
        const type = eventType & 0xF0;

        if (type === 0x90) {
            if (i + 1 >= data.length) break;
            const note = data[i++];
            const velocity = data[i++];
            if (velocity > 0) notes.push({ time: absTime, note, velocity });
        } else if (type === 0x80) {
            i += 2;
        } else if (type === 0xA0 || type === 0xB0) {
            i += 2;
        } else if (type === 0xC0 || type === 0xD0) {
            i++;
        } else if (type === 0xE0) {
            i += 2;
        } else {
            i += 2;
        }
    }

    if (notes.length > bestCount) {
        bestCount = notes.length;
        bestTrack = { index: t, notes: notes, ticksPerQuarter };
    }
}

if (bestTrack && bestTrack.notes.length > 0) {
    const notes = bestTrack.notes;
    const tpq = bestTrack.ticksPerQuarter;
    console.log(`\nBest track: ${bestTrack.index + 1} with ${notes.length} notes`);

    const uniqueNotes = [...new Set(notes.map(n => n.note))].sort((a, b) => a - b);
    console.log('Unique notes:', uniqueNotes.map(getNoteName).join(', '));

    const notesByTime = {};
    notes.forEach(n => {
        const timeKey = Math.floor(n.time / (tpq / 2)) * (tpq / 2);
        if (!notesByTime[timeKey] || n.note > notesByTime[timeKey].note) {
            notesByTime[timeKey] = n;
        }
    });

    const melodyNotes = Object.values(notesByTime).sort((a, b) => a.time - b.time);
    console.log('Melody notes:', melodyNotes.length);

    console.log('\nFirst 32 melody notes:');
    melodyNotes.slice(0, 32).forEach((n, i) => {
        const beat = Math.floor(n.time / tpq) + 1;
        console.log(`${i + 1}: ${getNoteName(n.note)} (beat ${beat})`);
    });

    console.log('\nMelody pattern:');
    for (let bar = 0; bar < Math.min(8, Math.ceil(melodyNotes.length / 8)); bar++) {
        const barNotes = melodyNotes.slice(bar * 8, (bar + 1) * 8);
        const notesStr = barNotes.map(n => `"${getNoteName(n.note)}"`).join(', ');
        console.log(`    [${notesStr}], // Bar ${bar + 1}`);
    }
}
