import type { Page } from '@playwright/test';

import {
	callActiveFrame,
	callHangupFrame,
	callRingingFrame,
	chatTaskFrame,
	type MockedSocket,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * Covers the wiring no unit test reaches: SDK `call` and `channel` frames ->
 * the dock's pill -> the Call window's Info and Post-processing tabs, and the
 * way back to an unfinished form from elsewhere (WS-91).
 */

const ATTEMPT_ID = 201;
const CALL_ID = 'e2e-call-1';

const processingForm = {
	id: 'e2e-call-form',
	title: 'Call result',
	metadata: {},
	actions: [
		{
			id: 'complete',
			view: {
				text: 'Complete',
				color: 'success',
			},
		},
	],
	body: [
		{
			id: 'note',
			value: '',
			view: {
				component: 'wt-input',
				label: 'Resolution note',
			},
		},
	],
};

const tab = (page: Page, name: string) =>
	page.locator('.wt-tab', {
		hasText: name,
	});

/** Distributes a queue call to the agent, answers it, and opens its window. */
async function openAnsweredCall(page: Page, socket: MockedSocket) {
	await page.goto('calls');
	// the SDK drops `channel` frames until the agent session exists
	await expect(
		page.getByRole('combobox', {
			name: 'Online',
		}),
	).toBeVisible({
		timeout: 30_000,
	});

	socket.send(
		'channel',
		chatTaskFrame('distribute', {
			attemptId: ATTEMPT_ID,
			distribute: {
				app_id: 'e2e',
				channel: 'call',
				queue_id: 1,
				queue_name: 'Support',
				member_name: 'John Smith',
				has_form: false,
				has_reporting: true,
				variables: {
					fromQueue: 'distribution only',
				},
				communication: {
					destination: '380671234678',
				},
			},
		}),
	);
	socket.send(
		'call',
		callRingingFrame({
			id: CALL_ID,
			attemptId: ATTEMPT_ID,
			payload: {
				Language: 'uk',
				orderId: '42',
			},
		}),
	);
	socket.send(
		'call',
		callActiveFrame({
			id: CALL_ID,
		}),
	);

	await page
		.locator('.floating-call-widget')
		.getByRole('button', {
			name: 'Open full view',
		})
		.click();
	await expect(page).toHaveURL(new RegExp(`/calls/${CALL_ID}$`));
}

function sendForm(socket: MockedSocket) {
	socket.send(
		'channel',
		chatTaskFrame('form', {
			attemptId: ATTEMPT_ID,
			form: structuredClone(processingForm),
		}),
	);
}

function startPostProcessing(socket: MockedSocket) {
	socket.send(
		'call',
		callHangupFrame({
			id: CALL_ID,
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('processing', {
			attemptId: ATTEMPT_ID,
			processing: {
				sec: 60,
				timeout: Date.now() + 60_000,
				renewal_sec: 10,
			},
		}),
	);
}

test.describe('call window', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test("opens from the dock on Info, showing the call's own variables", async ({
		page,
		socket,
	}) => {
		await openAnsweredCall(page, socket);

		await expect(tab(page, 'Info')).toHaveClass(/wt-tab--highlight/);
		await expect(tab(page, 'Post-processing')).toHaveCount(0);
		await expect(page.locator('.call-top-bar')).toContainText('380671234678');
		await expect(page.locator('.call-top-bar')).toContainText('Support');

		const info = page.locator('.call-info');
		await expect(info).toContainText('Language');
		await expect(info).toContainText('orderId');
		// the task's distribution variables stay out (ADR-0008)
		await expect(info).not.toContainText('fromQueue');
	});

	test('switches to the form at hangup and leads back to it from elsewhere', async ({
		page,
		socket,
	}) => {
		await openAnsweredCall(page, socket);
		sendForm(socket);

		// a form arriving mid-call must not pull the agent off Info
		await expect(tab(page, 'Post-processing')).toBeVisible();
		await expect(tab(page, 'Info')).toHaveClass(/wt-tab--highlight/);

		startPostProcessing(socket);

		await expect(tab(page, 'Post-processing')).toHaveClass(/wt-tab--highlight/);
		const form = page.locator('.processing-wrapper');
		await expect(form).toContainText('Call result');
		await form.locator('input').first().fill('Callback tomorrow');

		// the ended call stays in the dock, counting its deadline down
		const pill = page.locator('.post-processing-call-bar');
		await expect(pill).toContainText(/00:[0-5]\d/);

		// in-app, not `goto`: a reload would drop the SDK's call and task
		await page
			.locator('.wt-navigation-rail .navigation-rail-button')
			.nth(2)
			.click();
		await expect(page).toHaveURL(/\/chats$/);
		await pill.locator('.floating-call-widget__toggle').click();

		await expect(page).toHaveURL(new RegExp(`/calls/${CALL_ID}$`));
		await expect(page.locator('.processing-wrapper input').first()).toHaveValue(
			'Callback tomorrow',
		);
	});

	test('leaves the window once the task is released', async ({
		page,
		socket,
	}) => {
		await openAnsweredCall(page, socket);
		sendForm(socket);
		startPostProcessing(socket);
		await expect(page.locator('.processing-wrapper')).toBeVisible();

		socket.send(
			'channel',
			chatTaskFrame('wrap_time', {
				attemptId: ATTEMPT_ID,
			}),
		);

		await expect(page).toHaveURL(/\/calls$/);
		await expect(page.locator('.post-processing-call-bar')).toHaveCount(0);
	});
});
