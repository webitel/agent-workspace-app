/**
 * Plays app sounds (the offer ring, the chat chirp) through the Web Audio API
 * instead of an `HTMLAudioElement`.
 *
 * An element that has played registers the page as the OS's "Now Playing"
 * source, and after it pauses it stays the last active session. On macOS the
 * Play/Pause media key then resumes that element, so a key press meant for the
 * agent's music starts the ringtone. Web Audio output is not a media element
 * and never registers, so the sound can't be reached from the media keys.
 *
 * Call audio is different: the remote party's stream is the conversation, not a
 * cue, and stays on an `<audio>` element.
 */

/**
 * How long `play()` waits for a blocked context to start before treating
 * autoplay as refused. Short: the callers react to a refusal by releasing their
 * cross-tab lock, and that must not hang on a context that will never run.
 */
const UNLOCK_WAIT_MS = 300;

type Sound = {
	/** Rejects when the browser refuses to start audio (no user gesture yet). */
	play(): Promise<void>;
	stop(): void;
};

const sounds = new Set<{
	preload(): Promise<unknown>;
}>();

let context: AudioContext | null = null;
let armed = false;

function getContext(): AudioContext {
	context ??= new AudioContext();
	return context;
}

/**
 * Browsers keep an `AudioContext` suspended until the document has been
 * interacted with, so the very first ring after a fresh load could be
 * swallowed. The first gesture starts the context and decodes the sounds, so a
 * later ring starts at once.
 *
 * Both listeners go away through one `AbortController`: `{ once: true }` drops
 * only the listener that fired.
 */
function unlockOnFirstGesture() {
	if (armed || typeof window === 'undefined') return;
	armed = true;

	const gestures = new AbortController();

	const unlock = () => {
		gestures.abort();
		getContext()
			.resume()
			.catch(() => {
				// still refused; the next ring reports it through `play()`
			});
		for (const sound of sounds) sound.preload().catch(() => {});
	};

	window.addEventListener('pointerdown', unlock, {
		signal: gestures.signal,
	});
	window.addEventListener('keydown', unlock, {
		signal: gestures.signal,
	});
}

function untilRunning(audioContext: AudioContext): Promise<void> {
	if (audioContext.state === 'running') return Promise.resolve();

	return new Promise((resolve, reject) => {
		const cleanup = () => {
			clearTimeout(timer);
			audioContext.removeEventListener('statechange', onChange);
		};
		const onChange = () => {
			if (audioContext.state !== 'running') return;
			cleanup();
			resolve();
		};
		const timer = setTimeout(() => {
			cleanup();
			reject(new Error('audio is blocked until the page is interacted with'));
		}, UNLOCK_WAIT_MS);

		audioContext.addEventListener('statechange', onChange);
		audioContext.resume().catch(() => {});
	});
}

export function createSound(url: string, { loop = false } = {}): Sound {
	let decoded: Promise<AudioBuffer> | null = null;
	let source: AudioBufferSourceNode | null = null;
	// `stop()` can land while `play()` is still waiting on the context or the
	// decode; without this the sound would start after it was told to stop
	let generation = 0;

	function preload(): Promise<AudioBuffer> {
		decoded ??= fetch(url)
			.then((response) => response.arrayBuffer())
			.then((data) => getContext().decodeAudioData(data))
			.catch((err) => {
				decoded = null; // let the next ring try again
				throw err;
			});
		return decoded;
	}

	function stop() {
		generation += 1;
		if (!source) return;
		source.onended = null;
		try {
			source.stop();
		} catch {
			// already stopped
		}
		source.disconnect();
		source = null;
	}

	async function play() {
		stop();
		const mine = generation;
		const audioContext = getContext();

		await untilRunning(audioContext);
		const buffer = await preload();
		if (mine !== generation) return;

		const node = audioContext.createBufferSource();
		node.buffer = buffer;
		node.loop = loop;
		node.connect(audioContext.destination);
		node.onended = () => {
			if (source === node) source = null;
		};
		node.start();
		source = node;
	}

	const sound = {
		preload,
		play,
		stop,
	};
	sounds.add(sound);
	unlockOnFirstGesture();

	return sound;
}
