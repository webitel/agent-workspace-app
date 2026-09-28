import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
	mockChatThread,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * Covers the wiring no unit test reaches: SDK `channel` frames -> task feed ->
 * the chat window's Post-processing tab and countdown -> `cc_form_action` back
 * over the socket.
 */

const THREAD = {
	id: 'e2e-thread-1',
	subject: 'Jane Doe',
};
const ATTEMPT_ID = 101;

const processingForm = {
	id: 'e2e-form',
	title: 'Wrap up',
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
			id: 'instructions',
			value: '',
			view: {
				component: 'form-text',
				label: 'Before you close',
				initialValue: 'Confirm the **order number** with the customer.',
			},
		},
		{
			id: 'note',
			value: '',
			view: {
				component: 'wt-input',
				label: 'Resolution note',
			},
		},
		{
			id: 'status',
			value: '',
			view: {
				component: 'form-select-case-status',
				initialValue: '3',
				options: [
					{
						id: 1,
						name: 'New',
						initial: true,
					},
					{
						id: 3,
						name: 'Resolved',
						final: true,
					},
				],
			},
		},
	],
};

const tab = (page: Page, name: string) =>
	page.locator('.wt-tab', {
		hasText: name,
	});

/** Puts a bridged chat task in the feed and opens its window. */
async function openActiveChat(page: Page, socket: MockedSocket) {
	await mockChatThread(page, THREAD);
	await page.goto('chats');

	/*
	 * The SDK drops `channel` frames until the agent session exists, and the
	 * mocked socket flushes queued frames right after `hello` — before it. The
	 * header's status select only renders once the session is in.
	 */
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
			distribute: chatDistribute({
				threadId: THREAD.id,
				subject: THREAD.subject,
			}),
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('bridged', {
			attemptId: ATTEMPT_ID,
		}),
	);

	await page.locator('.chat-preview__open').click();
	await expect(page.locator('.the-chat-thread h1')).toHaveText(THREAD.subject);
}

function sendForm(socket: MockedSocket, form: object = processingForm) {
	socket.send(
		'channel',
		chatTaskFrame('form', {
			attemptId: ATTEMPT_ID,
			// a fresh copy per send: the app writes field values onto the form
			form: structuredClone(form),
		}),
	);
}

test.describe('chat processing form', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test('offers the form in a Post-processing tab without leaving the chat', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);
		await expect(tab(page, 'Chat')).toBeVisible();
		await expect(tab(page, 'Post-processing')).toHaveCount(0);

		sendForm(socket);

		await expect(tab(page, 'Post-processing')).toBeVisible();
		// a form arriving mid-chat must not pull the agent off the thread
		await expect(tab(page, 'Chat')).toHaveClass(/wt-tab--highlight/);
		await expect(page.locator('.the-chat-thread')).toBeVisible();

		await tab(page, 'Post-processing').click();

		const form = page.locator('.processing-wrapper');
		await expect(form).toContainText('Wrap up');
		await expect(form.locator('.processing-form-text strong')).toHaveText(
			'order number',
		);
	});

	test('submits what the agent typed as the form action', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);
		sendForm(socket);
		await tab(page, 'Post-processing').click();

		const form = page.locator('.processing-wrapper');
		await expect(form).toContainText('Resolved');
		await form.locator('input').first().fill('Order #42 confirmed');
		await form
			.getByRole('button', {
				name: 'Complete',
			})
			.click();

		await expect
			.poll(() =>
				socket.requests.find((request) => request.action === 'cc_form_action'),
			)
			.toMatchObject({
				data: {
					attempt_id: ATTEMPT_ID,
					action: 'complete',
					fields: {
						note: 'Order #42 confirmed',
						// seeded from initialValue as the option, sent as its id
						status: 3,
					},
				},
			});
	});

	test('uploads an attachment against the attempt and submits it with the form', async ({
		page,
		socket,
	}) => {
		const storedFile = {
			id: 555,
			name: 'receipt.txt',
			mime: 'text/plain',
			size: 12,
		};
		const uploads: string[] = [];
		await page.route('**/storage/file/*/upload**', async (route) => {
			uploads.push(route.request().url());
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					storedFile,
				]),
			});
		});

		await openActiveChat(page, socket);
		sendForm(socket, {
			...processingForm,
			body: [
				{
					id: 'attachments',
					value: '',
					view: {
						component: 'form-file',
						label: 'Attachments',
					},
				},
			],
		});
		await tab(page, 'Post-processing').click();

		const form = page.locator('.processing-wrapper');
		await form.locator('input[type="file"]').setInputFiles({
			name: 'receipt.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('paid in full'),
		});

		// the stored file replaces the upload line once it settles
		await expect(
			form.locator('a', {
				hasText: 'receipt.txt',
			}),
		).toBeVisible();
		expect(uploads[0]).toContain(`/storage/file/${ATTEMPT_ID}/upload`);

		await form
			.getByRole('button', {
				name: 'Complete',
			})
			.click();

		// the SDK serialises object values, so the file list arrives as JSON
		await expect
			.poll(() => {
				const request = socket.requests.find(
					(item) => item.action === 'cc_form_action',
				);
				const fields = (
					request?.data as {
						fields?: Record<string, string>;
					}
				)?.fields;
				return fields?.attachments ? JSON.parse(fields.attachments) : undefined;
			})
			.toEqual([
				expect.objectContaining({
					id: 555,
					name: 'receipt.txt',
				}),
			]);
	});

	test('runs a table row action against its component', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);
		sendForm(socket, {
			...processingForm,
			body: [
				{
					id: 'orders',
					value: '',
					view: {
						component: 'form-table',
						table: {
							headerTitle: 'Recent orders',
							displayColumns: [
								{
									field: 'number',
									name: 'Order',
									type: 'text',
								},
								{
									field: 'status',
									name: 'Status',
									type: 'text',
								},
							],
							source: [
								{
									id: 42,
									number: 'A-42',
									status: 'shipped',
								},
							],
						},
						actions: [
							{
								field: 'status',
								action: 'reopen',
								buttonName: 'Reopen',
							},
						],
					},
				},
			],
		});
		await tab(page, 'Post-processing').click();

		const form = page.locator('.processing-wrapper');
		await expect(form).toContainText('Recent orders');
		await expect(form).toContainText('A-42');

		await form
			.getByRole('button', {
				name: 'Reopen',
			})
			.click();

		// the SDK serialises the row, keyed by the action, into `vars`
		await expect
			.poll(() => {
				const request = socket.requests.find(
					(item) => item.action === 'cc_component_action',
				);
				if (!request) return undefined;
				const data = request.data as {
					componentId: string;
					action: string;
					formId: string;
					vars: Record<string, string>;
				};
				return {
					componentId: data.componentId,
					action: data.action,
					formId: data.formId,
					row: JSON.parse(data.vars.reopen),
				};
			})
			.toEqual({
				componentId: 'orders',
				action: 'reopen',
				formId: 'e2e-form',
				row: expect.objectContaining({
					id: 42,
					number: 'A-42',
				}),
			});
	});

	test('switches to the form when the chat ends and counts the deadline down', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);
		sendForm(socket);

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

		await expect(tab(page, 'Post-processing')).toHaveClass(/wt-tab--highlight/);
		await expect(page.locator('.processing-wrapper')).toBeVisible();

		// visible beside the form, not only on the chat tab
		const chip = page.locator('.post-processing-chip');
		await expect(chip).toContainText('Post-processing');
		await expect(chip).toContainText(/00:[0-5]\d/);
	});

	test('takes the tab away once the task is released', async ({
		page,
		socket,
	}) => {
		await openActiveChat(page, socket);
		sendForm(socket);
		await expect(tab(page, 'Post-processing')).toBeVisible();

		socket.send(
			'channel',
			chatTaskFrame('wrap_time', {
				attemptId: ATTEMPT_ID,
			}),
		);

		await expect(tab(page, 'Post-processing')).toHaveCount(0);
	});
});
