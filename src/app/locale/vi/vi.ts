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
		clientIdentity: {
			unknownContact: 'Liên hệ không xác định',
		},
		chatPreview: {
			onlyUnread: 'Chỉ hiện cuộc trò chuyện chưa đọc',
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
			run: 'Chạy',
			nothingToShowHere: 'Không có gì để hiển thị ở đây',
		},
		numpad: {
			call: 'Gọi',
		},
		variables: {
			empty: 'Không có biến',
			loadError: 'Không thể tải các biến',
		},
		pages: {
			chats: {
				pageTabs: {
					active: 'Đang hoạt động',
				},
				tabs: {
					chat: 'Trò chuyện',
					info: 'Thông tin',
					postProcessing: 'Xử lý sau',
					interaction: 'Tương tác',
					contact: 'Liên hệ',
					iframe: 'Iframe',
				},
			},
			history: {
				tabs: {
					calls: 'Cuộc gọi',
				},
				calls: {
					table: {
						mos: 'MOS',
						phoneNumber: 'Số điện thoại',
					},
					recordings: {
						unavailable: 'Bản ghi không khả dụng',
						playAudio: 'Phát âm thanh',
						playVideo: 'Phát video',
					},
					actions: {
						showCallInfo: 'Xem thông tin',
					},
					callInfo: {
						title: 'Thông tin',
						postprocessing: 'Xử lý sau cuộc gọi',
						agentDescription: 'Nhận xét của nhân viên',
					},
				},
			},
			tableActionPanel: {
				variableColumnSelect: {
					title: 'Chọn cột biến',
				},
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Không thể thực hiện cuộc gọi. Vui lòng thử lại.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Quyền truy cập micrô bị từ chối. Không thể thực hiện hành động.',
		},
	},
};
