import { writeMidi } from 'midi-file';
import fs from 'fs';
import path from 'path';

// Function to convert JSON to MIDI
function jsonToMidi(jsonFilePath: string) {
	const melodyData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
	const output = writeMidi(melodyData);
	// Ensure the `src/songs` directory exists
	const songsFolder = path.join(process.cwd(), 'src/songs');
	if (!fs.existsSync(songsFolder)) {
		fs.mkdirSync(songsFolder, { recursive: true });
	}

	// Generate a unique filename with the current date and time
	const baseName = path.basename(jsonFilePath, '.json'); // Get the base name without extension
	const date = new Date().toISOString().replace(/:/g, '-'); // Format date to avoid invalid characters
	const midiFilePath = path.join(songsFolder, `${baseName}-${date}.mid`); // Combine path, name, and extension

	fs.writeFileSync(midiFilePath, Buffer.from(output));
	console.log(`MIDI file created: ${midiFilePath}`);
}

// Path to the melody JSON file
const melodyFolder = path.join(process.cwd(), 'src/create/melodies');
const melodyFile = path.join(melodyFolder, 'long_melody.json'); // Change file name as needed

// Convert the JSON to MIDI
jsonToMidi(melodyFile);
