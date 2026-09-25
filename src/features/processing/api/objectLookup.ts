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
	sanitize,
	starToSearch,
} from '@webitel/api-services/api/transformers';

const instance = getDefaultInstance();

// `{path.to.field}` placeholders in a display template
const displayPlaceholder = /\{([^}]+)\}/g;

type LookupItem = Record<string, unknown>;

const readPath = (item: LookupItem, path: string): unknown =>
	path
		.split('.')
		.reduce<unknown>(
			(object, prop) => (object as LookupItem | undefined)?.[prop],
			item,
		);

// A display is either a plain (dot-)path to one field, or a template such as
// `{name} ({code})`; an unresolved placeholder is left as written.
function displayName(display: string, item: LookupItem): unknown {
	if (!display.match(displayPlaceholder)) return readPath(item, display);
	return display.replace(displayPlaceholder, (_, key: string) => {
		const value = readPath(item, key);
		return value === undefined || value === null ? `{${key}}` : String(value);
	});
}

export interface ObjectLookupParams {
	/** API path of the object's records, e.g. `dictionary/cities` */
	path: string;
	/** field or `{template}` shown as the option label */
	display: string;
	/** field used as the option id */
	primary: string;
	/** pre-built `key=value` query filters from the form schema */
	filters?: string[];
	fields?: string[];
	search?: string;
	page?: number;
	size?: number;
	[key: string]: unknown;
}

/**
 * Lists records of an arbitrary object for a lookup select, mapping each to
 * `{ id, name }` by the form schema's primary and display settings. Ported
 * from cc-workspaces; endpoints answer with either `items` or `data`.
 */
export async function getObjectLookup({
	path,
	display,
	primary,
	filters = [],
	...params
}: ObjectLookupParams): Promise<{
	items: LookupItem[];
	next: boolean;
}> {
	const url = applyTransform(params, [
		merge(getDefaultGetParams()),
		starToSearch('search'),
		(query: Record<string, unknown>) => ({
			...query,
			q: query.search,
		}),
		sanitize([
			'page',
			'size',
			'q',
			'sort',
			'fields',
			'id',
		]),
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
		]) as {
			data?: LookupItem[];
			items?: LookupItem[];
			next: boolean;
		};
		return {
			items: (data || items || []).map((item) => ({
				...item,
				id: item[primary],
				name: displayName(display, item),
			})),
			next,
		};
	} catch (err) {
		throw applyTransform(err, [
			notify,
		]);
	}
}
