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
		chatList: {
			tabs: {
				active: 'Đang hoạt động',
				snoozed: 'Đã tạm hoãn',
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
			run: 'Chạy',
			nothingToShowHere: 'Không có gì để hiển thị ở đây',
			startedAt: 'Bắt đầu lúc',
			username: 'Tên người dùng',
			message: 'Tin nhắn',
			phoneNumber: 'Số điện thoại',
		},
		numpad: {
			call: 'Gọi',
		},
		variables: {
			empty: 'Không có biến',
			loadError: 'Không thể tải các biến',
		},
		sidebar: {
			contact: {
				selectContact: {
					title: 'Chọn một liên hệ',
					text: 'Chọn một bản ghi trong danh sách lịch sử để xem thông tin chi tiết của liên hệ',
				},
				selectOrCreateContact: {
					title: 'Chọn một liên hệ hoặc tạo mới',
					text: 'Chọn một liên hệ trong danh sách để xem thông tin chi tiết hoặc tạo liên hệ mới.',
				},
				createContact: 'Tạo liên hệ',
				addContacts: 'Thêm liên hệ',
				profile: 'Hồ sơ',
			},
		},
		pages: {
			calls: {
				pageTabs: {
					missed: 'Cuộc gọi nhỡ',
				},
				tabs: {
					info: 'Thông tin',
					postProcessing: 'Xử lý sau',
					interaction: 'Tương tác',
					screenshots: 'Ảnh chụp màn hình',
					contact: 'Liên hệ',
					iframe: 'iFrame',
				},
			},
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
		call: {
			activeCall: {
				inCall: 'Đang gọi',
				onHold: 'Đang giữ máy',
				actions: {
					numpad: 'Bàn phím',
					mute: 'Tắt micrô',
					hold: 'Giữ máy',
					camera: 'Camera',
					message: 'Tin nhắn',
					transfer: 'Chuyển cuộc gọi',
					hangup: 'Kết thúc cuộc gọi',
					openFullView: 'Mở chế độ xem đầy đủ',
				},
			},
			outboundCall: {
				ringing: 'Đang đổ chuông',
				noAnswer: 'Không trả lời',
				noAnswerDescription: 'Điện thoại người nhận không trả lời cuộc gọi.',
				retryCall: 'Gọi lại',
				backToDialpad: 'Quay lại bàn phím',
			},
		},
	},
	error: {
		calls: {
			outboundCallFailed: 'Không thể thực hiện cuộc gọi. Vui lòng thử lại.',
			holdToggleFailed:
				'Không thể giữ máy hoặc tiếp tục cuộc gọi. Vui lòng thử lại.',
			dtmfFailed: 'Không thể gửi chữ số. Vui lòng thử lại.',
		},
		websocket: {
			[DeviceNotAllowPermissionError.id]:
				'Quyền truy cập micrô bị từ chối. Không thể thực hiện hành động.',
		},
	},
};
