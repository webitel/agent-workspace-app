import { beforeEach, vi } from 'vitest';

/**
 * Global vue-i18n mock — i18n is consumed by nearly every composable/component,
 * so the stub lives here instead of being re-declared per test file.
 *
 * - `t`  echoes the key back, so assertions can match on the locale key.
 * - `te` returns true by default; tests that exercise the "missing translation"
 *   branch import `mockTe` and override it (e.g. `mockTe.mockReturnValue(false)`).
 */
// names prefixed `mock` so vitest allows referencing them in the hoisted factory
export const mockT = vi.fn((key: string) => key);
export const mockTe = vi.fn((_key: string) => true);

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: mockT,
		te: mockTe,
	}),
}));

/**
 * Global eventBus mock — the shared UI-SDK bus is used wherever notifications
 * are dispatched. Tests assert on `mockEmit` to verify emitted events.
 */
export const mockEmit = vi.fn();

vi.mock('@webitel/ui-sdk/scripts', () => ({
	eventBus: {
		$emit: (...args: unknown[]) => mockEmit(...args),
	},
	// Stubbed with the real semantics. We can't pull the actual export here: the
	// whole scripts barrel drags in icons/heavy deps jsdom can't load, and
	// importActual of the deep module resolves through the linked sibling's
	// out-of-root path, which vite's server.fs.allow blocks.
	isEmpty: (value: unknown) => {
		if (Array.isArray(value)) return !value.length;
		if (value && typeof value === 'object') return !Object.keys(value).length;
		return !value;
	},
}));

beforeEach(() => {
	mockT.mockClear();
	mockTe.mockClear();
	mockTe.mockReturnValue(true);
	mockEmit.mockClear();
});
