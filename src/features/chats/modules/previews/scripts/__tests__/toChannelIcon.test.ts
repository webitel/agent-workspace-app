import { WebitelImApiGatewayV1ThreadChannelType as ChannelType } from '@webitel/api-services/gen/models';
import { describe, expect, it } from 'vitest';

import { toChannelIcon } from '../toChannelIcon';

describe('toChannelIcon', () => {
	it.each(
		Object.values(ChannelType).filter(
			(type) => type !== ChannelType.ThreadChannelTypeUnspecified,
		),
	)('gives %s a logo', (type) => {
		expect(toChannelIcon(type)).toEqual(expect.any(String));
	});

	it('gives no logo to an unspecified gateway', () => {
		expect(
			toChannelIcon(ChannelType.ThreadChannelTypeUnspecified),
		).toBeUndefined();
	});

	it('gives no logo when the type is unknown', () => {
		expect(toChannelIcon(undefined)).toBeUndefined();
	});
});
