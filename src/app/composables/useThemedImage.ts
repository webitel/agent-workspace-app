import { computed } from 'vue';
import { useAppearanceStore } from '../../features/appearance/store/appearanceStore';

export const useThemedImage = ({
	light,
	dark,
}: {
	light: string;
	dark: string;
}) => {
	const appearanceStore = useAppearanceStore();
	return computed(() => (appearanceStore.darkMode ? dark : light));
};
