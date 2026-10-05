const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = 7;

const startOfDay = (date: Date) =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * When a message was sent, the way AC_02.03.01 shows it on a chat preview:
 * today as `15:43`, from yesterday back to seven days ago as the weekday name,
 * anything older as `14.06.2026`.
 *
 * Days are counted on the calendar, not in 24h blocks, so 23:50 yesterday is
 * "yesterday" at 00:10 and a DST change cannot move a message into the wrong
 * bucket. A timestamp in the future (clock skew) reads as today.
 */
export function formatPreviewTime(
	at: number,
	{
		now = new Date(),
		locale,
	}: {
		now?: Date;
		locale?: string;
	} = {},
): string {
	const sent = new Date(at);
	const daysAgo = Math.round((startOfDay(now) - startOfDay(sent)) / DAY_MS);

	if (daysAgo <= 0) return `${pad(sent.getHours())}:${pad(sent.getMinutes())}`;

	if (daysAgo <= WEEK_DAYS)
		return new Intl.DateTimeFormat(locale, {
			weekday: 'short',
		}).format(sent);

	return `${pad(sent.getDate())}.${pad(sent.getMonth() + 1)}.${sent.getFullYear()}`;
}
