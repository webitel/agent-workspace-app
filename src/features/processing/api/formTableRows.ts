import {
	getDefaultGetListResponse,
	getDefaultGetParams,
	getDefaultInstance,
} from '@webitel/api-services/api/defaults';
import {
	addQueryParamsToUrl,
	applyTransform,
	camelToSnake,
	generateUrl,
	merge,
	notify,
	snakeToCamel,
} from '@webitel/api-services/api/transformers';

import type { FormTableRow } from '../types/ProcessingForm.types';

const instance = getDefaultInstance();

export interface FormTableRowsParams {
	/** system endpoint the table reads, e.g. `/contacts` */
	path: string;
	/** pre-built `key=value` query filters from the form schema */
	filters?: string[];
	/** snake_case field names to request */
	fields?: string[];
	page?: number;
}

/**
 * One page of a system-sourced `form-table`, camelCased. Ported from
 * cc-workspaces; endpoints answer with either `items` or `data`.
 */
export async function getFormTableRows({
	path,
	filters = [],
	...params
}: FormTableRowsParams): Promise<{
	items: FormTableRow[];
	next: boolean;
}> {
	const url = applyTransform(params, [
		merge(getDefaultGetParams()),
		camelToSnake([
			'fields',
		]),
		generateUrl(path),
		addQueryParamsToUrl(filters),
	]) as string;

	try {
		const response = await instance.get(url);
		const { data, items, next } = applyTransform(response.data, [
			merge(getDefaultGetListResponse()),
			snakeToCamel(),
		]) as {
			data?: FormTableRow[];
			items?: FormTableRow[];
			next: boolean;
		};
		return {
			items: data || items || [],
			next,
		};
	} catch (err) {
		throw applyTransform(err, [
			notify,
		]);
	}
}
