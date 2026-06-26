import { applyTransform, notify } from '@webitel/api-services/api/transformers';
import instance from '../../../app/api/instance';

const setUserStatus = async (status: string) => {
	const url = '/presence';
	try {
		await instance.patch(url, {
			status,
		});
	} catch (err) {
		throw applyTransform(err, [
			notify,
		]);
	}
};

const getUserStatus = async () => {
	const url = '/user-status';
	try {
		const { data } = await instance.get(url);
		return data.presence;
	} catch (err) {
		throw applyTransform(err, [
			notify,
		]);
	}
};

export const userStatusAPI = {
	get: getUserStatus,
	set: setUserStatus,
};
