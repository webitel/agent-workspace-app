export const setTokenFromUrl = () => {
	try {
		const queryMap: {
			accessToken?: string;
		} = window.location.search
			.slice(1)
			.split('&')
			.reduce((obj, query) => {
				const [key, value] = query.split('=');
				obj[key] = value;
				return obj;
			}, {});

		if (queryMap.accessToken) {
			localStorage.setItem('access-token', queryMap.accessToken);
		}
	} catch (err) {
		console.error('Error restoring token from url', err);
	}
};
