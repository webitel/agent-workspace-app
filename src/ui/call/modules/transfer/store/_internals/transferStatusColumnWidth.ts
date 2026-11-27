/**
 * @author Oleksandr Palonnyi
 * the status column is 150px in the Figma "Transfer Call" frame, on the Agents
 * and the Users tab alike. wt-table reads a header's `width` as the column's
 * min-width, not a fixed width
 * [WS-95](https://webitel.atlassian.net/browse/WS-95)
 */
export const TRANSFER_STATUS_COLUMN_WIDTH = '150px';
