import { differenceInCalendarDays, format } from 'date-fns';

const WEEK_DAYS = 7;

/**
 * When a message was sent, the way AC_02.03.01 shows it on a chat preview:
 * today as `15:43`, from yesterday back to seven days ago as the weekday name,
 * anything older as `14.06.2026`.
 *
 * Days are counted on the calendar, not in 24h blocks, so 23:50 yesterday is
 * "yesterday" at 00:10 and a DST change cannot move a message into the wrong
 * bucket. A timestamp in the future (clock skew) reads as today.
 *
 * The weekday comes from `Intl` rather than date-fns: date-fns needs a locale
 * object imported and mapped for each app locale, `Intl` takes the code as is.
 */
export function formatPreviewTime(
	at: number,
	{ now = new Date(), locale }: { now?: Date; locale?: string } = {},
): string {
	const sent = new Date(at);
	const daysAgo = differenceInCalendarDays(now, sent);

	if (daysAgo <= 0) return format(sent, 'HH:mm');

	if (daysAgo <= WEEK_DAYS)
		return new Intl.DateTimeFormat(locale, {
			weekday: 'short',
		}).format(sent);

	return format(sent, 'dd.MM.yyyy');
}
