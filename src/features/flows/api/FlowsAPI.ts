import { AgentTriggersAPI } from '@webitel/api-services/api';
import applyTransform, {
	notify,
} from '@webitel/ui-sdk/src/api/transformers/index.js';
import i18n from '../../../app/locale/i18n';

const runFlowSchema = async ({ id: number }) => {
	try {
		const result = await AgentTriggersAPI.run({
			id: number,
		});

		return applyTransform(result, [
			notify(({ callback }) =>
				callback({
					type: 'success',
					text: i18n.global.t('infoSec.flows.runFlowSuccess'),
				}),
			),
		]);
	} catch (err) {
		throw applyTransform(err, [
			notify(({ callback }) =>
				callback({
					type: 'error',
					text: i18n.global.t('infoSec.flows.runFlowError'),
				}),
			),
		]);
	}
};

const getFlowsLookup = (params: Record<string, unknown>) =>
	AgentTriggersAPI.getLookup(params);

const FlowsAPI = {
	run: runFlowSchema,
	getLookup: getFlowsLookup,
};

export default FlowsAPI;
