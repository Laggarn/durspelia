import { parseMidi } from "midi-file";

export function readMidiData(arrayBuffer: ArrayBuffer) {
  const parsed = parseMidi(new Uint8Array(arrayBuffer));

  // Extract ticks per quarter note
  const ticksPerBeat = parsed.header.ticksPerBeat ?? 480; // default guess
  // Use a default BPM if not found
  let bpm = 120;
  // 1 quarter note = (60 / bpm) seconds

  // Look for the first tempo event in any track
  for (const track of parsed.tracks) {
    for (const event of track) {
      if (event.type === "setTempo") {
        // microseconds per quarter note
        const mpqn = event.microsecondsPerBeat;
        // BPM = 60,000,000 / microsecondsPerQuarter
        bpm = 60000000 / mpqn;
        break;
      }
    }
  }

  const events = [];

  // We'll keep track of noteOns so we can figure durations
  const activeNotes = new Map<number, number>(); // map midiNumber -> startTimeSec

  // We'll process all tracks as if merged into one timeline
  // We'll gather all events in a single array first
  const rawEvents: Array<{
    deltaTime: number;
    type: string;
    noteNumber?: number;
    velocity?: number;
  }> = [];

  for (const track of parsed.tracks) {
    let runningDelta = 0;
    for (const event of track) {
      runningDelta += event.deltaTime;
      rawEvents.push({ ...event, deltaTime: runningDelta });
    }
  }

  // Sort rawEvents by deltaTime so they’re in chronological order
  rawEvents.sort((a, b) => a.deltaTime - b.deltaTime);

  let lastDelta = 0; // track the previous event's absolute ticks
  let currentTimeSec = 0;

  for (const event of rawEvents) {
    // Convert deltaTime difference to seconds
    const deltaTicks = event.deltaTime - lastDelta;
    // Each tick is (60 / bpm) / ticksPerBeat seconds
    const deltaSeconds = (deltaTicks * (60 / bpm)) / ticksPerBeat;
    currentTimeSec += deltaSeconds;
    lastDelta = event.deltaTime;

    if (event.type === "noteOn" && event.velocity && event.velocity > 0) {
      // Start a note
      activeNotes.set(event.noteNumber as number, currentTimeSec);
    } else if (
      event.type === "noteOff" ||
      (event.type === "noteOn" && (event.velocity === 0 || !event.velocity))
    ) {
      // End a note
      const startTime = activeNotes.get(event.noteNumber as number);
      if (startTime != null) {
        const duration = currentTimeSec - startTime;
        const noteName = midiNoteToName(event.noteNumber as number);
        events.push({
          time: startTime,
          noteName,
          duration,
        });
        activeNotes.delete(event.noteNumber as number);
      }
    }
  }

  return events;
}

function midiNoteToName(midiNumber: number): string {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  return noteNames[noteIndex] + octave;
}
