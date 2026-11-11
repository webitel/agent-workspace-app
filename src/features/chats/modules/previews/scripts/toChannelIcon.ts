import { WebitelImApiGatewayV1ThreadChannelType as ChannelType } from '@webitel/api-services/gen/models';

/**
 * The wt-icon a chat's gateway is drawn with (AC_02.03.02). Keyed by every
 * channel type the backend sends, so a type added there fails the typecheck
 * here until it is given an icon; names follow ui-sdk's `ProviderIconType`.
 */
const CHANNEL_ICONS: Record<ChannelType, string | undefined> = {
	[ChannelType.ThreadChannelTypeUnspecified]: undefined,
	[ChannelType.ThreadChannelTypeWhatsapp]: 'messenger-whatsapp',
	[ChannelType.ThreadChannelTypeFacebook]: 'messenger-facebook',
	[ChannelType.ThreadChannelTypeViberBm]: 'messenger-viber',
	[ChannelType.ThreadChannelTypeViber]: 'messenger-viber',
	[ChannelType.ThreadChannelTypePortal]: 'portal',
	[ChannelType.ThreadChannelTypeWidget]: 'messenger-web-chat',
	[ChannelType.ThreadChannelTypeCustom]: 'custom-chat-gateway',
	[ChannelType.ThreadChannelTypeTelegramBot]: 'telegram-bot',
	[ChannelType.ThreadChannelTypeTelegramApp]: 'messenger-telegram',
	[ChannelType.ThreadChannelTypeInstagram]: 'instagram',
};

export function toChannelIcon(type?: ChannelType): string | undefined {
	return type ? CHANNEL_ICONS[type] : undefined;
}
