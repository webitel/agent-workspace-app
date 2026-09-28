import { AbstractUserStatus } from '@webitel/ui-sdk/enums';
import { describe, expect, it } from 'vitest';

import { UserStatusColorMappings } from '../../enums/UserStatusColorMappings';
import { getUserStatusByPriority } from '../getUserStatusByPriority';
import { parseUserStatus } from '../parseUserStatus';

describe('parseUserStatus', () => {
	it('parses a comma-separated presence status into flags', () => {
		expect(parseUserStatus('sip,web,dnd')).toEqual({
			dnd: true,
			busy: false,
			sip: true,
			web: true,
		});
	});

	it('maps dlg to busy', () => {
		expect(parseUserStatus('dlg').busy).toBe(true);
	});

	it('returns all flags false for empty status', () => {
		const allFalse = {
			dnd: false,
			busy: false,
			sip: false,
			web: false,
		};
		expect(parseUserStatus('')).toEqual(allFalse);
	});
});

describe('getUserStatusByPriority', () => {
	it('returns DND for dnd presence regardless of agent status', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip,dnd',
				},
				agentStatus: 'online',
			}),
		).toBe(AbstractUserStatus.DND);
	});

	it('returns BUSY for dlg presence (in call) even with agent OFFLINE', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip,dlg',
				},
				agentStatus: 'offline',
			}),
		).toBe(AbstractUserStatus.BUSY);
	});

	it('returns ACTIVE for non-agent with sip presence', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip',
				},
			}),
		).toBe(AbstractUserStatus.ACTIVE);
	});

	it('returns ACTIVE for non-agent with web presence', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'web',
				},
			}),
		).toBe(AbstractUserStatus.ACTIVE);
	});

	it('returns OFFLINE for non-agent without sip/web presence', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: '',
				},
			}),
		).toBe(AbstractUserStatus.OFFLINE);
		expect(getUserStatusByPriority({})).toBe(AbstractUserStatus.OFFLINE);
	});

	it('returns ONLINE for agent ONLINE', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip',
				},
				agentStatus: 'online',
			}),
		).toBe(AbstractUserStatus.ONLINE);
	});

	it('returns PAUSE for agent PAUSE', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip',
				},
				agentStatus: 'pause',
			}),
		).toBe(AbstractUserStatus.PAUSE);
	});

	it('returns PAUSE for agent BREAK_OUT', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip',
				},
				agentStatus: 'break_out',
			}),
		).toBe(AbstractUserStatus.PAUSE);
	});

	it('returns OFFLINE for agent OFFLINE regardless of sip/web presence', () => {
		expect(
			getUserStatusByPriority({
				presence: {
					status: 'sip,web',
				},
				agentStatus: 'offline',
			}),
		).toBe(AbstractUserStatus.OFFLINE);
	});
});

describe('user status display consistency', () => {
	it.each(
		Object.values(
			AbstractUserStatus,
		) as (keyof typeof UserStatusColorMappings)[],
	)('"%s" has an indicator color', (status) => {
		expect(UserStatusColorMappings[status]).toBeTruthy();
	});
});
