import type { SidebarSelectionType } from '../enums/SidebarSelectionType.enum';

export type SidebarSelection =
	| {
			type: typeof SidebarSelectionType.Contact;
			id: string;
	  }
	| {
			type: typeof SidebarSelectionType.Unknown;
	  };
