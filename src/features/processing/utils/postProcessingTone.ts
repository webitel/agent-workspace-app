export enum PostProcessingTone {
	Success = 'success',
	Warning = 'warning',
	Error = 'error',
}

/**
 * AC_03.01.03: the timer turns green above two thirds of the post-processing
 * time left, orange above one third, red below. Percentages are whole numbers
 * in the spec (67 is green, 66 is orange), hence the floor.
 *
 * The total is the SDK's: the base length plus every renewal, so it grows with
 * the deadline. Time left beyond it (the two briefly disagree around a
 * renewal) clamps to 100%. Without a known total there is nothing to compare
 * against, and green is the neutral answer rather than a guess.
 */
export function getPostProcessingTone(
	secondsLeft: number,
	totalSec: number | null,
): PostProcessingTone {
	if (!totalSec || totalSec <= 0) return PostProcessingTone.Success;

	const percent = Math.floor(Math.min(1, secondsLeft / totalSec) * 100);

	if (percent >= 67) return PostProcessingTone.Success;
	if (percent >= 34) return PostProcessingTone.Warning;
	return PostProcessingTone.Error;
}
