import type { SidebarSelectionType } from '../enums/SidebarSelectionType.enum';

export type SidebarSelection =
	| {
			type: typeof SidebarSelectionType.Contact;
			id: string;
	  }
	| {
			type: typeof SidebarSelectionType.Unknown;
	  }
	| {
			type: typeof SidebarSelectionType.PhoneNumber;
			// the contact is searched by it; none means an unknown contact
			phoneNumber?: string;
	  };
