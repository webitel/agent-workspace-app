<template>
	<div
		class="ringing-indicator"
		aria-hidden="true"
	>
		<img
			class="ringing-indicator__ellipse"
			:src="ringingEllipseUrl"
			alt=""
			width="70"
			height="70"
		/>
		<div class="ringing-indicator__bell">
			<span class="ringing-indicator__icon-placeholder" />
		</div>
	</div>
</template>

<script
	setup
	lang="ts"
>
/**
 * @author Oleksandr Palonnyi
 * The ripple ring is the Figma "Ringing Indicator" asset (Dialer DES-721); the
 * ui-sdk sprite has no such shape.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
import ringingEllipseUrl from '../assets/ringing-ellipse.svg';
</script>

<style scoped>
/**
 * @author Oleksandr Palonnyi
 * Keyframes, timings and easings are the Figma motion "Motion 02 — Radiate"
 * (2s loop). Each track animates its own property (`opacity`, `scale`,
 * `rotate`, `translate`) because the design gives them separate timelines,
 * which one `transform` keyframe list could not express.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.ringing-indicator {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	width: 96px;
	height: 96px;
	border: 1px solid var(--success-hover-color);
	border-radius: 50%;
}

.ringing-indicator__ellipse {
	animation:
		ringing-indicator-ellipse-opacity 2s infinite,
		ringing-indicator-ellipse-scale 2s infinite;
}

.ringing-indicator__bell {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	margin: auto;
	border-radius: 50%;
	background-color: var(--success-color);
	animation:
		ringing-indicator-bell-rotate 2s infinite,
		ringing-indicator-bell-bounce 2s infinite;
}

/**
 * @author Oleksandr Palonnyi
 * Reserves the 24px slot of the bell icon (Figma "Call Status Indicator /
 * Ringing") until the icon is added; the ui-sdk `bell` is a different drawing.
 * [WTEL-WS-13](https://webitel.atlassian.net/browse/WTEL-WS-13)
 */
.ringing-indicator__icon-placeholder {
	display: block;
	width: 24px;
	height: 24px;
}

@media (prefers-reduced-motion: reduce) {
	.ringing-indicator__ellipse,
	.ringing-indicator__bell {
		animation: none;
	}
}

@keyframes ringing-indicator-ellipse-opacity {
	0% {
		opacity: 0.25;
		animation-timing-function: ease-out;
	}
	11% {
		opacity: 1;
		animation-timing-function: ease-in-out;
	}
	39% {
		opacity: 0.35;
		animation-timing-function: ease-out;
	}
	52.5% {
		opacity: 1;
		animation-timing-function: linear;
	}
	100% {
		opacity: 1;
	}
}

@keyframes ringing-indicator-ellipse-scale {
	0% {
		scale: 0.72;
		animation-timing-function: ease-out;
	}
	29% {
		scale: 1.14;
		animation-timing-function: ease-in-out;
	}
	52.5% {
		scale: 1;
		animation-timing-function: linear;
	}
	100% {
		scale: 1;
	}
}

@keyframes ringing-indicator-bell-rotate {
	0% {
		rotate: 0deg;
		animation-timing-function: ease-out;
	}
	8% {
		rotate: 13deg;
		animation-timing-function: ease-in-out;
	}
	16% {
		rotate: -12deg;
		animation-timing-function: ease-in-out;
	}
	25% {
		rotate: 7deg;
		animation-timing-function: ease-in-out;
	}
	34% {
		rotate: -5deg;
		animation-timing-function: ease-out;
	}
	42% {
		rotate: 0deg;
		animation-timing-function: linear;
	}
	100% {
		rotate: 0deg;
	}
}

@keyframes ringing-indicator-bell-bounce {
	0% {
		translate: 0 0;
		animation-timing-function: ease-out;
	}
	9% {
		translate: 0 -7px;
		animation-timing-function: ease-in-out;
	}
	21% {
		translate: 0 0;
		animation-timing-function: ease-out;
	}
	31% {
		translate: 0 -3px;
		animation-timing-function: ease-in-out;
	}
	41% {
		translate: 0 0;
		animation-timing-function: linear;
	}
	100% {
		translate: 0 0;
	}
}
</style>
