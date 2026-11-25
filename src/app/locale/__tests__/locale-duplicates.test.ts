import * as uiSdkMessages from '@webitel/ui-sdk/locale';
import { describe, expect, it } from 'vitest';

import en from '../en/en';
import uk from '../uk/uk';

type FlatMessages = Record<string, string>;

/**
 * @author Oleksandr Palonnyi
 * ui-sdk writes plural messages as functions of the vue-i18n message context;
 * this context renders them as their forms joined by " | ", the same shape as
 * a plain plural string, so both compare form by form.
 * [WS-163](https://webitel.atlassian.net/browse/WS-163) [NWS][FE] Додати локалізації для NWS
 */
const pluralFormsContext = {
	plural: (forms: unknown[]) => forms.map(String).join(' | '),
	linked: (key: string) => `@:${key}`,
	named: (name: string) => `{${name}}`,
	list: (index: number) => `{${index}}`,
	normalize: (parts: unknown[]) => parts.join(''),
	interpolate: (part: unknown) => String(part),
	type: 'text',
	values: {},
};

const flattenMessages = (
	tree: unknown,
	prefix = '',
	flatMessages: FlatMessages = {},
): FlatMessages => {
	if (typeof tree === 'function') {
		flatMessages[prefix] = String(tree(pluralFormsContext));
	} else if (tree !== null && typeof tree === 'object') {
		for (const [key, child] of Object.entries(tree)) {
			flattenMessages(child, prefix ? `${prefix}.${key}` : key, flatMessages);
		}
	} else {
		flatMessages[prefix] = String(tree);
	}
	return flatMessages;
};

const toComparableText = (text: string): string => text.trim().toLowerCase();

const toComparableForms = (text: string): string[] =>
	text.split('|').map(toComparableText);

const appEn = flattenMessages(en);
const appUk = flattenMessages(uk);
const uiSdkEn = flattenMessages(uiSdkMessages.en);
const uiSdkUk = flattenMessages(uiSdkMessages.uk);

/**
 * @author Oleksandr Palonnyi
 * Keys that read the same in English on purpose, or whose wording is still
 * waiting for a product decision. Every entry says which; a new duplicate
 * that fits neither reuses the existing key instead of being listed here.
 * [WS-163](https://webitel.atlassian.net/browse/WS-163) [NWS][FE] Додати локалізації для NWS
 */
const ALLOWED_APP_DUPLICATES: Record<string, string> = {
	'ui.pages.chats.tabs.info':
		'the chat window tab is «Інфо»/«Инфо» by the localization table, unlike ui.reusable.info',
	'ui.pages.calls.tabs.iframe':
		'"iFrame" vs "Iframe" (chat window) is an open question for the product',
	'ui.pages.chats.tabs.iframe':
		'"Iframe" vs "iFrame" (call window) is an open question for the product',
	'ui.call.transfer.columns.name':
		"an agent's name; ui.sidebar.contact.search.modes.* is a key family read by the search mode id",
};

/**
 * @author Oleksandr Palonnyi
 * App keys whose text matches a ui-sdk key in English and Ukrainian, but the
 * ui-sdk key means something else (a channel state, another application).
 * [WS-163](https://webitel.atlassian.net/browse/WS-163) [NWS][FE] Додати локалізації для NWS
 */
const ALLOWED_UI_SDK_MATCHES: Record<string, string> = {
	'ui.notifications.offer.channel':
		'not wired yet; kept until the offer card shows a channel',
	'ui.pages.calls.pageTabs.offline':
		'offline queue members, not the agent status objects.agent.status.offline',
	'ui.call.activeCall.onHold':
		'WtApplication.meet.* belongs to the Meet application',
	'ui.call.activeCall.actions.hold':
		'an action, while channel.state.hold is a channel state',
	'ui.call.direction.outbound':
		'read as ui.call.direction.<CallDirection>, and ui-sdk has no inbound counterpart',
};

describe('app locale', () => {
	it('gives each English text a single key', () => {
		const keysByText = new Map<string, string[]>();
		for (const [key, text] of Object.entries(appEn)) {
			const comparableText = toComparableText(text);
			keysByText.set(comparableText, [
				...(keysByText.get(comparableText) ?? []),
				key,
			]);
		}

		const duplicateKeyGroups = [
			...keysByText.values(),
		]
			.map((keys) => keys.filter((key) => !(key in ALLOWED_APP_DUPLICATES)))
			.filter((keys) => keys.length > 1);

		expect(duplicateKeyGroups).toEqual([]);
	});

	it('does not repeat a text ui-sdk already translates', () => {
		const uiSdkKeysByEnText = new Map<string, string[]>();
		for (const [key, text] of Object.entries(uiSdkEn)) {
			for (const form of toComparableForms(text)) {
				uiSdkKeysByEnText.set(form, [
					...(uiSdkKeysByEnText.get(form) ?? []),
					key,
				]);
			}
		}

		const repeatedKeys = Object.keys(appEn)
			.filter((key) => !(key in ALLOWED_UI_SDK_MATCHES))
			.flatMap((key) =>
				(uiSdkKeysByEnText.get(toComparableText(appEn[key])) ?? [])
					.filter((uiSdkKey) =>
						toComparableForms(uiSdkUk[uiSdkKey] ?? '').includes(
							toComparableText(appUk[key]),
						),
					)
					.map((uiSdkKey) => `${key} -> ${uiSdkKey}`),
			);

		expect(repeatedKeys).toEqual([]);
	});

	it('keeps the allow-lists free of keys that no longer exist', () => {
		const staleKeys = [
			...Object.keys(ALLOWED_APP_DUPLICATES),
			...Object.keys(ALLOWED_UI_SDK_MATCHES),
		].filter((key) => !(key in appEn));

		expect(staleKeys).toEqual([]);
	});
});
