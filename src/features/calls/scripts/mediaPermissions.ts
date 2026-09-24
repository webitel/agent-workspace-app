/**
 * Probe a media permission by actually opening the device: `navigator.permissions`
 * has no reliable microphone entry across browsers, and a granted-but-unavailable
 * device must fail the same way a denied one does.
 */
async function isMediaAllowed(
	constraints: MediaStreamConstraints,
): Promise<boolean> {
	try {
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		for (const track of stream.getTracks()) {
			track.stop();
		}
		return true;
	} catch {
		return false;
	}
}

export function isMicrophoneAllowed(): Promise<boolean> {
	return isMediaAllowed({
		audio: true,
	});
}
