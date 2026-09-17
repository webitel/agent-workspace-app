/**
 * `HTMLMediaElement.play()` only returns a promise in modern browsers — older
 * Safari (and jsdom) return undefined, so never chain off it directly.
 */
export function playSafely(element: HTMLAudioElement): Promise<void> {
	try {
		return Promise.resolve(element.play());
	} catch (err) {
		return Promise.reject(err);
	}
}
