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
		},
		pages: {
			calls: {
				tabs: {
					missed: 'Nhỡ',
				},
				missed: {
					title: 'Cuộc gọi nhỡ',
					columns: {
						name: 'Tên',
						phoneNumber: 'Số điện thoại',
						dateTime: 'Ngày & giờ',
						totalDuration: 'Tổng thời lượng',
						queue: 'Hàng đợi',
					},
					search: {
						tooltip: 'Tìm kiếm',
						placeholder: 'Tìm theo tên hoặc số điện thoại',
					},
					actions: {
						openContact: 'Mở liên hệ',
						call: 'Gọi',
					},
				},
			},
		},
	},
	error: {
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Quyền truy cập micrô bị từ chối. Không thể thực hiện hành động.',
		},
	},
};
