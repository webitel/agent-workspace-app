import { JobState, type Task } from 'webitel-sdk';

import { isChatTask } from './isChatTask';

/**
 * Whether a task is a chat currently being offered to this agent.
 *
 * The SDK gives no usable predicate here. `Task.allowAccept`, `allowDecline`
 * and `allowClose` are all hardcoded to `channel === 'task'`, so every one of
 * them returns `false` for an `im` task — reaching for them yields a silently
 * empty screen.
 *
 * `JobState.Offering` is the state the backend is expected to park an offered
 * chat in. If it turns out `im` tasks sit in `Distribute` instead, no card ever
 * appears *and* `chatTaskList` stops filtering — a failure with no symptom, so
 * it is worth confirming against a live instance rather than assuming.
 */

export function isIncomingChatOffer(task: Task): boolean {
	if (!task) return false;
	return isChatTask(task) && task.state === JobState.Offering;
}
