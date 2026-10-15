const HOME_PATH = '/';

export const getActiveNavItemId = (
	currentPath: string,
	routeItemIds: string[],
): string => {
	if (currentPath === HOME_PATH) {
		return HOME_PATH;
	}

	return (
		routeItemIds.find(
			(routeItemId) =>
				routeItemId !== HOME_PATH &&
				(currentPath === routeItemId ||
					currentPath.startsWith(`${routeItemId}/`)),
		) ?? ''
	);
};
