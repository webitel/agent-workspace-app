import type { Page } from '@playwright/test';

import {
	chatDistribute,
	chatTaskFrame,
	type MockedSocket,
} from './fixtures/mocks';
import { expect, test } from './fixtures/test';

/**
 * The active chat's Chat tab (AC_03.02.01–05) rendered by @webitel/ui-chats/v2:
 * history with dividers, system notices and delivery ticks, and the composer.
 */

const THREAD_ID = 'e2e-thread-chat';
const ATTEMPT_ID = 102;

const AGENT = {
	id: 'm-agent',
	contact: {
		name: 'Alina Timoshenko',
		type: 'webitel',
		sub: '42',
		iss: 'webitel',
	},
};
const CLIENT = {
	id: 'm-client',
	contact: {
		name: 'Jane Doe',
		type: 'telegram',
		sub: 'client-1',
		iss: 'telegram',
	},
};

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

// API answers newest → oldest, snake_case on the wire
const HISTORY = [
	{
		id: 'msg-3',
		seq: '3',
		created_at: String(now - 60_000),
		sender: AGENT,
		body: 'Hi! Let’s check this together.',
	},
	{
		id: 'msg-2',
		seq: '2',
		created_at: String(now - 120_000),
		sender: AGENT,
		system: {
			type: 'transferred',
		},
	},
	{
		id: 'msg-1',
		seq: '1',
		created_at: String(now - 3 * DAY),
		sender: CLIENT,
		body: 'Can we try resetting the password?',
	},
];

type HistoryMessage = Record<string, unknown>;

/** `count` text messages, newest first (the API order), numbered from `from`. */
const textMessages = (count: number, from = 1): HistoryMessage[] =>
	Array.from(
		{
			length: count,
		},
		(_, i) => {
			const n = from + count - 1 - i;
			return {
				id: `bulk-${n}`,
				seq: String(n),
				created_at: String(now - (1000 - n) * 60_000),
				sender: n % 2 ? CLIENT : AGENT,
				body: `Message number ${n}`,
			};
		},
	);

async function mockThread(
	page: Page,
	{
		sendStatus = 200,
		history = HISTORY,
		older,
	}: {
		sendStatus?: number;
		history?: HistoryMessage[];
		/** served for the next request that carries a cursor; the first page then links to it */
		older?: HistoryMessage[];
	} = {},
) {
	const requests: URL[] = [];
	// 1x1 png for every image the history points at
	await page.route('**/e2e-media/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'image/png',
			body: Buffer.from(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
				'base64',
			),
		});
	});
	await page.route('**/api/v1/auth/token', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				contact: AGENT.contact,
			}),
		});
	});
	await page.route(`**/api/v1/threads/${THREAD_ID}`, async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				id: THREAD_ID,
				subject: 'Jane Doe',
				members: [
					AGENT,
					CLIENT,
				],
				read_states: [
					{
						member_id: CLIENT.id,
						delivered_up_to_seq: '3',
						read_up_to_seq: '3',
					},
				],
			}),
		});
	});
	await page.route(`**/api/v1/${THREAD_ID}/messages**`, async (route) => {
		const url = new URL(route.request().url());
		requests.push(url);
		const isOlderPage = url.searchParams.has('cursor_id');
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				items: isOlderPage ? (older ?? []) : history,
				...(!isOlderPage && older
					? {
							next_cursor: {
								id: 'cursor-older',
							},
						}
					: {}),
			}),
		});
	});
	await page.route('**/api/v1/messages/text', async (route) => {
		await route.fulfill({
			status: sendStatus,
			contentType: 'application/json',
			body: JSON.stringify(
				sendStatus === 200
					? {
							id: 'msg-sent',
						}
					: {
							message: 'failed',
						},
			),
		});
	});
	return {
		/** every history request the page has made, in order */
		requests,
	};
}

async function openChat(page: Page, socket: MockedSocket) {
	await page.goto('chats');
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
			distribute: chatDistribute({
				threadId: THREAD_ID,
				subject: 'Jane Doe',
			}),
		}),
	);
	socket.send(
		'channel',
		chatTaskFrame('bridged', {
			attemptId: ATTEMPT_ID,
		}),
	);

	await page.locator('.chat-preview').first().click();
	await expect(page.locator('.chat-history')).toBeVisible();
}

/**
 * Scrolls the history to its top and waits for `expected` to show up. For a
 * moment after a chat opens the history re-pins itself to the bottom while late
 * layout settles, which undoes an early scroll; retry until it sticks.
 */
async function scrollUpUntil(page: Page, expected: () => Promise<void>) {
	const scroller = page.locator('.chat-history__scroll');
	await expect(async () => {
		/**
		 * @author Oleksandr Palonnyi
		 * a single jump to the top fires one scroll event, and ui-chats handles it before
		 * vueuse has cleared arrivedState.bottom, so the button is reset and never shown;
		 * a second event one frame later sees the fresh state, as a real wheel scroll would
		 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
		 */
		await scroller.evaluate(async (el) => {
			el.scrollTop = 1;
			await new Promise(requestAnimationFrame);
			el.scrollTop = 0;
		});
		await expected();
	}).toPass({
		timeout: 15_000,
	});
}

const composerField = (page: Page) => page.locator('.chat-composer textarea');

test.describe('chat thread', () => {
	test.beforeEach(() => {
		test.setTimeout(60_000);
	});

	test('renders the history with day dividers, a system notice and ticks', async ({
		page,
		socket,
	}) => {
		await mockThread(page);
		await openChat(page, socket);

		await expect(page.locator('.chat-message')).toHaveCount(2);
		await expect(page.locator('.chat-date-divider')).toHaveCount(2);
		await expect(page.locator('.chat-date-divider').last()).toHaveText('Today');
		await expect(page.locator('.chat-system-notice')).toContainText(
			'Alina Timoshenko transferred the chat',
		);

		const own = page.locator('.chat-message--outgoing');
		await expect(own).toHaveCount(1);
		await expect(own.locator('.message-status--read')).toBeVisible();
		await expect(
			page.locator(
				'.chat-message:not(.chat-message--outgoing) .message-status',
			),
		).toHaveCount(0);
	});

	test('clears the field once a message is sent', async ({ page, socket }) => {
		await mockThread(page);
		await openChat(page, socket);

		await composerField(page).fill('Thanks, it worked');
		await composerField(page).press('Enter');

		await expect(composerField(page)).toHaveValue('');
	});

	test('keeps the text when sending fails', async ({ page, socket }) => {
		await mockThread(page, {
			sendStatus: 500,
		});
		await openChat(page, socket);

		await composerField(page).fill('Will this go through?');
		await composerField(page).press('Enter');

		await expect(composerField(page)).toBeEnabled();
		await expect(composerField(page)).toHaveValue('Will this go through?');
	});

	test('loads older messages at the top and keeps the reading position', async ({
		page,
		socket,
	}) => {
		const { requests } = await mockThread(page, {
			history: textMessages(40, 11),
			older: textMessages(10, 1),
		});
		await openChat(page, socket);
		const scroller = page.locator('.chat-history__scroll');

		// opens on the newest message
		await expect(
			page.locator('.chat-history').getByText('Message number 50'),
		).toBeVisible();
		await expect(
			page.getByText('Message number 5', {
				exact: true,
			}),
		).toHaveCount(0);

		await scrollUpUntil(page, () =>
			expect(
				page.getByText('Message number 5', {
					exact: true,
				}),
			).toBeAttached({
				timeout: 1_000,
			}),
		);

		await expect(
			page.getByText('Message number 5', {
				exact: true,
			}),
		).toBeAttached();
		await expect
			.poll(() =>
				requests.some(
					(url) => url.searchParams.get('cursor_id') === 'cursor-older',
				),
			)
			.toBe(true);
		await expect(page.locator('.chat-history__sentinel')).toHaveCount(0);

		// the message that was on top before the load is still in view, not the oldest one
		const box = await scroller.boundingBox();
		const anchor = await page
			.getByText('Message number 11', {
				exact: true,
			})
			.boundingBox();
		expect(
			anchor && box && anchor.y >= box.y - 1 && anchor.y <= box.y + box.height,
		).toBe(true);
	});

	test('offers a way back to the newest message after scrolling up', async ({
		page,
		socket,
	}) => {
		await mockThread(page, {
			history: textMessages(40),
		});
		await openChat(page, socket);
		const scroller = page.locator('.chat-history__scroll');
		const toBottom = page.locator('.scroll-to-bottom-btn');

		await expect(toBottom).toHaveCount(0);

		await scrollUpUntil(page, () =>
			expect(toBottom).toBeVisible({
				timeout: 1_000,
			}),
		);

		await toBottom.getByRole('button').click();
		await expect(toBottom).toHaveCount(0);
		await expect
			.poll(() =>
				scroller.evaluate(
					(el) => el.scrollHeight - el.scrollTop - el.clientHeight,
				),
			)
			.toBeLessThan(3);
	});

	test('opens one gallery across every image in the history', async ({
		page,
		socket,
	}) => {
		const picture = (id: string) => ({
			id,
			url: `/e2e-media/${id}.png`,
			mime: 'image/png',
			width: 400,
			height: 300,
		});
		await mockThread(page, {
			history: [
				{
					id: 'img-2',
					seq: '2',
					created_at: String(now - 60_000),
					sender: AGENT,
					body: 'Here is the second screenshot',
					images: [
						picture('second'),
					],
				},
				{
					id: 'img-1',
					seq: '1',
					created_at: String(now - 120_000),
					sender: CLIENT,
					body: 'First screenshot',
					images: [
						picture('first'),
					],
				},
			],
		});
		await openChat(page, socket);

		const gallery = page.locator('.p-galleria');

		// the newer message's image is 2 of 2 across the whole history; a gallery
		// per message would say 1/1
		await page.locator('.message-attachments__image').last().click();
		await expect(gallery).toBeVisible();
		await expect(gallery).toContainText('2/2');

		await page.keyboard.press('Escape');
		await expect(gallery).toHaveCount(0);

		await page.locator('.message-attachments__image').first().click();
		await expect(gallery).toContainText('1/2');
	});

	test('draws documents as download cards and undrawable images as named cards', async ({
		page,
		socket,
	}) => {
		await mockThread(page, {
			history: [
				{
					id: 'doc-1',
					seq: '1',
					created_at: String(now - 60_000),
					sender: CLIENT,
					body: 'Photo and invoice',
					images: [
						{
							id: 'heic-1',
							url: '/e2e-media/IMG_0042.HEIC?sig=abc',
							mime: 'image/heic',
						},
					],
					documents: [
						{
							id: 'pdf-1',
							url: '/e2e-media/invoice.pdf',
							mime: 'application/pdf',
							name: 'invoice.pdf',
							size: '2048',
						},
					],
				},
			],
		});
		await openChat(page, socket);

		const cards = page.locator('.message-attachments__file');
		await expect(cards).toHaveCount(2);
		await expect(page.locator('.message-attachments__image')).toHaveCount(0);

		await expect(
			cards.filter({
				hasText: 'IMG_0042.HEIC',
			}),
		).toBeVisible();
		const invoice = cards.filter({
			hasText: 'invoice.pdf',
		});
		await expect(invoice).toContainText('2 Kb');
		await expect(invoice).toHaveAttribute('href', /invoice\.pdf$/);
		await expect(invoice).toHaveAttribute('download', '');
		await expect(
			page.locator('.chat-history').getByText('Photo and invoice'),
		).toBeVisible();
	});
});
