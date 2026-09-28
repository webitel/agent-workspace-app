// Runtime shape of a processing form. The webitel-sdk `Form` type is looser
// (`view: object`, `actions: object[]`) than what the backend actually sends, so
// we model the concrete shape the renderer relies on here.

export interface FormSelectOption {
	value: unknown;
	[key: string]: unknown;
}

// A case status condition, as `form-select-case-status` lists them.
export interface CaseStatusOption {
	id: number;
	name: string;
	initial?: boolean;
	final?: boolean;
}

// Where `form-select-from-object` reads its records from.
export interface FormObjectSource {
	source?: {
		name?: string;
		path?: string;
	};
	displayColumn?: string;
	filters?: string[];
	fields?: string[];
}

// A file stored for a `form-file` field — what storeFile returns.
export interface FormStoredFile {
	id: number | string;
	name: string;
	mime?: string;
	size?: number;
	[key: string]: unknown;
}

// A `form-file` upload still in flight (or just settled).
export interface FormFileUpload {
	key: string;
	file: FormStoredFile;
	loaded: number;
	total: number;
	done: boolean;
	failed: boolean;
}

// `form-table`: a table of records from the schema or a system endpoint, with
// optional per-row action buttons.
export type FormTableRow = Record<string, unknown>;

export interface FormTableColumn {
	/** dot / bracket path into the record, e.g. `contact.emails[0].number` */
	field: string;
	name: string;
	width?: number;
	/** ProcessingTableColumnType: text, number, bool, datetime, link */
	type: string;
}

export interface FormTableConfig {
	displayColumns: FormTableColumn[];
	source?: FormTableRow[];
	isSystemSource?: boolean;
	systemSource?: {
		path: string;
	};
	defaultCollapsed?: boolean;
	headerTitle?: string;
}

export interface FormTableAction {
	/** column the button sits in */
	field: string;
	action: string;
	buttonName: string;
	color?: string;
}

export interface FormTableActionPayload {
	componentId: string;
	action: string;
	row: FormTableRow;
}

export interface FormFieldView {
	// raw component name from the backend, e.g. 'wt-select', 'wt-input'
	component: string;
	hint?: string;
	initialValue?: string | unknown[];
	options?: FormSelectOption[];
	currentTime?: boolean;
	[key: string]: unknown;
}

export interface FormBodyElement {
	id: string;
	value: unknown;
	view: FormFieldView;
}

export interface FormActionView {
	color?: string;
	text?: string;
	id?: string;
}

export interface ProcessingFormAction {
	id: string;
	view: FormActionView;
}

export interface ProcessingFormMetadata {
	isInited?: boolean;
	[key: string]: unknown;
}

// `task._processing.processing_prolongation`, absent from the SDK's
// `Processing` type: how many renewals the queue still allows, and for how long.
export interface ProcessingProlongation {
	remaining_prolongations?: number;
	prolongation_sec?: number;
}

export interface ProcessingFormData {
	title?: string;
	body: FormBodyElement[];
	actions: ProcessingFormAction[];
	metadata: ProcessingFormMetadata;
	fields?: Record<string, unknown>;
}
