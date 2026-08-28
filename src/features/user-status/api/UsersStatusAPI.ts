import { applyTransform, notify } from '@webitel/api-services/api/transformers';
import instance from '../../../app/api/instance';

export const setUserStatus = async (status: string) => {
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

export const getUserStatus = async () => {
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
