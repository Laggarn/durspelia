<script lang="ts">
	import { readMidiData } from '../utils/midiParser.js';
	import { bassRow, cRow, gRow } from '../utils/buttonMap.js';

	import * as Tone from 'tone';

	interface MidiEvent {
		noteName: string;
		time: number; // Start time in seconds (relative to the piece)
		duration: number; // Duration in seconds
	}

	let midiEvents: MidiEvent[] = [];
	let currentIndex = 0;
	let currentNote: string | null = null;
	let playing = false;

	// We'll store the synth so we can dispose it on stop
	let synth: Tone.PolySynth<Tone.Synth> | null = null;

	// Handle file upload
	async function handleFileChange(event: Event): Promise<void> {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
		const parsedEvents = readMidiData(arrayBuffer);

		// Ensure each event has "time" in seconds and "duration" in seconds
		midiEvents = parsedEvents.map((event) => ({
			...event,
			duration: 0.3 // Assign a default duration if missing
		}));

		currentIndex = 0;
		currentNote = null;
		playing = false;
	}

	// Start playback
	async function playMidi() {
		if (!midiEvents.length) return;

		playing = true;
		currentIndex = 0;
		await Tone.start(); // Unlocks audio on user gesture

		// Create (or recreate) the synth
		synth = new Tone.PolySynth(Tone.Synth).toDestination();

		// Get the current audio time
		const now = Tone.now();

		// Schedule each MIDI event to play automatically
		for (const event of midiEvents) {
			// event.time should be in seconds relative to the piece's start
			const startTime = now + event.time;
			const noteDur = event.duration;
			synth.triggerAttackRelease(event.noteName, noteDur, startTime);
		}

		// Kick off our visual highlight loop
		scheduleNextHighlight();
	}

	// Stop playback
	function stopMidi() {
		playing = false;
		currentNote = null;
		// Dispose the synth so notes stop immediately
		if (synth) {
			synth.dispose();
			synth = null;
		}
	}

	// Visual highlight loop
	function scheduleNextHighlight() {
		if (!playing || currentIndex >= midiEvents.length) {
			stopMidi();
			return;
		}

		// Show the current note in UI
		currentNote = midiEvents[currentIndex].noteName;

		// Calculate wait time before next note highlight
		// Compare consecutive events' start times in your array
		const thisEvent = midiEvents[currentIndex];
		const nextEvent = midiEvents[currentIndex + 1];
		const waitTime = nextEvent
			? (nextEvent.time - thisEvent.time) * 1000 // seconds => ms
			: 300; // fallback if no next event

		currentIndex += 1;
		setTimeout(scheduleNextHighlight, waitTime);
	}

	// Map note to push/pull button
	function findButton(note: string): { row: string; button: number; direction: string } | null {
		for (const b of gRow) {
			if (b.push === note) return { row: 'G', button: b.button, direction: 'push' };
			if (b.pull === note) return { row: 'G', button: b.button, direction: 'pull' };
		}
		for (const b of cRow) {
			if (b.push === note) return { row: 'C', button: b.button, direction: 'push' };
			if (b.pull === note) return { row: 'C', button: b.button, direction: 'pull' };
		}
		for (const b of bassRow) {
			if (b.push === note) return { row: 'Bass', button: b.button, direction: 'push' };
			if (b.pull === note) return { row: 'Bass', button: b.button, direction: 'pull' };
		}
		return null;
	}

	// Decide highlight color
	function highlightColor(buttonEntry: { button: number; push: string; pull: string }) {
		if (!currentNote) return 'white';
		const found = findButton(currentNote);
		if (!found) return 'white';

		// Check if row/button matches
		if (found.button === buttonEntry.button && found.row === 'G') {
			return found.direction === 'push' ? 'plum' : 'lightblue';
		}
		if (found.button === buttonEntry.button && found.row === 'C') {
			return found.direction === 'push' ? 'plum' : 'lightblue';
		}
		if (found.button === buttonEntry.button && found.row === 'Bass') {
			return found.direction === 'push' ? 'plum' : 'lightblue';
		}
		return 'white';
	}
</script>

<style>
	button {
		background-color: plum;
		border-radius: 10px;
		border: none;
		color: white;
		padding: 15px 32px;
		text-align: center;
		text-decoration: none;
		display: inline-block;
		font-size: 16px;
		margin: 4px 2px;
		cursor: pointer;
	}
	.accordion-row {
		display: inline-block;
		vertical-align: top;
		margin-right: 2rem;
	}
	.accordion-button {
		border: 1px solid #ccc;
		padding: 0.5rem;
		margin: 0.25rem 0;
		width: 8rem;
		text-align: center;
		border-radius: 20px;
	}
</style>

<h1 class="text-4xl text-center -mt-10 font-thin font-serif mb-5">DURSPELIA</h1>
<div
	class="container border border-slate-400 p-3 rounded-xl absolute bottom-10 right-10 w-96 h-64
	bg-white space-y-4 text-center flex flex-col justify-center items-center">
	<h2 class="text-center ">Upload MIDI File</h2>
	<input type="file" accept=".mid,.midi" on:change={handleFileChange} />
	<div class="w-full flex justify-evenly">
		<button class="" on:click={playMidi} disabled={!midiEvents.length}>Play</button>
		<button class="" on:click={stopMidi} disabled={!midiEvents.length}>Stop</button>
	</div>
	<p>Current Note: {currentNote}</p>
	<p>Total Notes: {midiEvents.length}</p>
</div>
<div class="container w-full flex flex-row space-x-80">
	<!-- Simple layout for C/F rows -->
	<div class="container h-full my-auto">
		<div class="accordion-row">
			<h3>G Row</h3>
			{#each gRow as b}
				<div class="accordion-button" style="background-color: {highlightColor(b)}">
					{b.button}
					<small>({b.push}/{b.pull})</small>
				</div>
			{/each}
		</div>

		<div class="accordion-row mt-10">
			<h3>C Row</h3>
			{#each cRow as b}
				<div class="accordion-button" style="background-color: {highlightColor(b)}">
					{b.button}
					<small>({b.push}/{b.pull})</small>
				</div>
			{/each}
		</div>
	</div>
	<div class="container h-full my-auto mt-20">

		<div class="accordion-row">
			<h3>Bass 1</h3>
			{#each bassRow.slice(0, 4) as b}
				<div class="accordion-button" style="background-color: {highlightColor(b)}">
					{b.button}
					<small>({b.push}/{b.pull})</small>
				</div>
			{/each}
		</div>

		<div class="accordion-row">
			<h3>Bass 2</h3>

			{#each bassRow.slice(4, 8) as b}
				<div class="accordion-button" style="background-color: {highlightColor(b)}">
					{b.button}
					<small>({b.push}/{b.pull})</small>
				</div>
			{/each}
		</div>
	</div>
</div>
