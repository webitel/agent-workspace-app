import { DeviceNotAllowPermissionError } from 'webitel-sdk';

export default {
	ui: {
		header: {
			sip: 'SIP',
			dnd: {
				label: 'DnD',
				tooltip: 'Bạn sẽ chỉ nhận cuộc gọi từ hàng đợi',
			},
		},
		notifications: {
			offer: {
				title: {
					call: 'Cuộc gọi đến',
					chat: 'Trò chuyện đến',
				},
				unknownContact: 'Liên hệ không xác định',
				queue: 'Hàng đợi',
				channel: 'Kênh',
				waitingTime: 'Thời gian chờ',
				accept: 'Chấp nhận',
				decline: 'Từ chối',
			},
			flows: {
				runFlowSuccess: 'Khởi chạy sơ đồ thành công',
				runFlowError: 'Không thể khởi chạy sơ đồ',
			},
		},
		reusable: {
			cancel: 'Hủy',
			run: 'Chạy',
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Quyền truy cập micrô bị từ chối. Không thể thực hiện hành động.',
		},
	},
};
