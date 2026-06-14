import { describe, expect, it } from 'vitest';
import type { RtpMetrics } from 'webitel-sdk';
import { ConnectionQualityLevel } from '../enums/ConnectionQualityLevel.enum';
import { scoreConnection } from '../scoreConnection';

const rtp = (over: Partial<RtpMetrics> = {}): RtpMetrics =>
	({
		jitter: {
			average: 0,
		},
		packetloss: {
			average: 0,
		},
		mos: {
			average: 5,
		},
		...over,
	}) as RtpMetrics;

describe('scoreConnection', () => {
	it('returns High with no reasons when rtp is missing', () => {
		expect(scoreConnection()).toEqual({
			level: ConnectionQualityLevel.High,
			reasons: [],
		});
	});

	it('returns High for healthy metrics', () => {
		const result = scoreConnection(rtp());

		expect(result.level).toBe(ConnectionQualityLevel.High);
		expect(result.reasons).toEqual([]);
	});

	it('flags Medium on borderline jitter (30–50ms)', () => {
		const result = scoreConnection(
			rtp({
				jitter: {
					average: 40,
				},
			} as Partial<RtpMetrics>),
		);

		expect(result.level).toBe(ConnectionQualityLevel.Medium);
		expect(result.reasons).toContain('jitter 40 ms (30–50)');
	});

	it('flags Low on high jitter (>50ms)', () => {
		const result = scoreConnection(
			rtp({
				jitter: {
					average: 80,
				},
			} as Partial<RtpMetrics>),
		);

		expect(result.level).toBe(ConnectionQualityLevel.Low);
		expect(result.reasons).toContain('jitter 80 ms (> 50)');
	});

	it('flags Low on high packet loss (>3%)', () => {
		const result = scoreConnection(
			rtp({
				packetloss: {
					average: 5,
				},
			} as Partial<RtpMetrics>),
		);

		expect(result.level).toBe(ConnectionQualityLevel.Low);
		expect(result.reasons).toContain('packet loss 5.0 % (> 3%)');
	});

	it('flags Low on poor MOS (<3.5)', () => {
		const result = scoreConnection(
			rtp({
				mos: {
					average: 3.0,
				},
			} as Partial<RtpMetrics>),
		);

		expect(result.level).toBe(ConnectionQualityLevel.Low);
		expect(result.reasons).toContain('MOS 3.00 (< 3.5)');
	});

	it('falls to the worst level when multiple metrics degrade', () => {
		const result = scoreConnection(
			rtp({
				jitter: {
					average: 40,
				}, // medium
				mos: {
					average: 3.0,
				}, // low
			} as Partial<RtpMetrics>),
		);

		expect(result.level).toBe(ConnectionQualityLevel.Low);
		expect(result.reasons.length).toBeGreaterThanOrEqual(2);
	});
});
