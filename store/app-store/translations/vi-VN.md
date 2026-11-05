## App name

OpenCode Mobile

## Subtitle

Ứng dụng khách di động cho máy chủ OpenCode

## Promotional text

Trò chuyện với tác tử OpenCode trên điện thoại và tiếp nối cuộc trò chuyện mượt mà giữa máy tính và iPhone.

## Keywords

opencode, mobile, ai, agent, client, lập trình, mã nguồn, máy chủ, từ xa

## Description

OpenCode Mobile đưa các tác tử OpenCode lên iPhone của bạn. Kết nối ứng dụng với máy chủ OpenCode đang chạy trên máy tính, rồi tiếp tục làm việc với mã và công cụ phát triển của bạn ở bất cứ đâu.

Chuyển đổi liền mạch giữa máy tính và điện thoại: tiếp tục trên iPhone một phiên đã bắt đầu ở máy tính, hoặc mở lại trên máy tính cuộc trò chuyện đã bắt đầu trên điện thoại.

(Đây là dự án cộng đồng mã nguồn mở độc lập. Ứng dụng không chính thức và không liên kết với opencode.ai.)

TÍNH NĂNG:

◆ Kết nối với mọi máy chủ OpenCode qua HTTP hoặc HTTPS, trong mạng cục bộ hoặc từ xa qua VPN hay Tailscale.
◆ Tạo nhiều cấu hình máy chủ và tự động kết nối tới máy chủ bạn ưu tiên.
◆ Ghép nối với OpenCode v2 bằng cách quét mã QR hoặc dán liên kết. Cũng hoạt động với máy chủ có mật khẩu và OpenCode v1.
◆ Quản lý máy chủ ngay trong ứng dụng: kéo xuống, làm mới hoặc mở menu.
◆ Tự động kiểm tra trạng thái máy chủ và kết nối lại với thời gian chờ tăng dần.
◆ Mật khẩu được lưu an toàn trong Keychain.
◆ Giao diện sáng và tối tự động theo cài đặt hệ thống.
◆ Chế độ nhập tùy chọn: Enter tạo dòng mới, Shift+Enter gửi tin nhắn.
◆ MÃ NGUỒN MỞ

Phát hiện lỗi hoặc có ý tưởng cải thiện?

Hãy báo issue, đề xuất tính năng hoặc gửi pull request trên GitHub.

Kho lưu trữ GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

BẮT ĐẦU NHANH:

Bạn cần có máy chủ OpenCode đang chạy để sử dụng ứng dụng.

OpenCode Mobile là ứng dụng khách kết nối tới máy chủ web OpenCode đang chạy trên máy tính chứa mã và công cụ phát triển của bạn.

► OpenCode v2

Chạy hai lệnh sau trên máy tính của bạn:

opencode service set hostname 0.0.0.0

opencode pair

Sau đó, trong ứng dụng, hãy thêm máy chủ rồi quét mã QR hoặc dán liên kết. Liên kết chỉ dùng được một lần và hết hạn sau 5 phút.

Bạn chạy trực tiếp opencode serve? Hãy chọn "Use URL and password instead" và nhập mật khẩu được hiển thị.

► OpenCode v1

Khi thêm máy chủ, hãy bật "OpenCode v1 server" và khởi động như sau:

► Không xác thực

opencode web --hostname 0.0.0.0 --port 4096

► Có xác thực

Nên bật xác thực nếu máy chủ có thể được truy cập từ bên ngoài mạng cục bộ đáng tin cậy của bạn.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Khi bật xác thực, tên người dùng mặc định trong ứng dụng là opencode.
