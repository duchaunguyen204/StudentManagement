# Hướng dẫn chạy và demo StudentHub

## 1. Môi trường
- SQL Server / SQL Server Express đang chạy.
- .NET SDK phù hợp với `StudentManagement.Api.csproj`.
- Node.js và npm.

## 2. Cấu hình SQL Server
Mở `backend/StudentManagement.Api/appsettings.json`, chỉnh `ConnectionStrings:DefaultConnection` cho đúng máy. Không đưa mật khẩu thật vào Git.
Trong môi trường Development, ứng dụng chạy EF Core migrations trước khi seed dữ liệu mẫu. Nếu database cũ có schema không khớp migrations, hãy sao lưu trước; chỉ tạo lại database khi chắc chắn không cần dữ liệu cũ.

## 3. Chạy backend
```powershell
cd backend
dotnet restore
dotnet run
```
Frontend mặc định gọi API tại `http://localhost:5170/api`. Nếu backend chạy cổng khác, tạo `frontend/student-management-ui/.env.local`:
```env
VITE_API_BASE_URL=http://localhost:PORT
```
Thay `PORT` bằng cổng HTTP thật của backend rồi khởi động lại Vite.

## 4. Chạy frontend
```powershell
cd frontend
npm install
npm run dev
```
Mở URL do Vite in ra (thường là `http://localhost:5173`).

## 5. Tài khoản demo (Development)
- Admin: `admin` / `Admin@123456`
- Giáo viên: `teacher01` / `Teacher@123`
- Sinh viên: `student01` / `Student@123`

Đổi mật khẩu demo trước khi dùng ngoài máy cá nhân. Có thể cấu hình `AdminSeed:Username` và `AdminSeed:Password` qua User Secrets hoặc biến môi trường `AdminSeed__Username`, `AdminSeed__Password`. Không dùng mật khẩu mặc định ở môi trường thật.

## 6. Phân quyền và checklist demo
- Sinh viên: xem điểm của chính mình và đăng ký/hủy đăng ký môn học.
- Giáo viên: xem các bản ghi điểm gắn với hồ sơ giáo viên đăng nhập; chỉ sửa/xóa điểm do mình phụ trách theo `TeacherId`.
- Admin: xem toàn bộ điểm; các thao tác ghi/xóa dữ liệu quản trị bị giới hạn ở role Admin.
- Thử đăng nhập bằng cả ba vai trò.
- Student thử truy cập API quản trị: phải bị từ chối.
- Teacher thử POST/PUT/DELETE sinh viên, lớp, khoa, môn học: phải nhận `403`.
- Thử điểm ngoài khoảng 0–10, mã sinh viên/môn học không tồn tại và bản ghi điểm trùng.
- Kiểm tra tìm kiếm, phân trang, đăng xuất; sau đăng xuất `/api/Auth/me` phải nhận `401`.

## 7. Giới hạn cần biết
Mô hình dữ liệu hiện tại chưa có bảng phân công giảng dạy theo lớp/môn. Quyền giáo viên hiện được giới hạn theo `TeacherId` trên bản ghi điểm, chưa thể xác minh giáo viên được phân công chính thức cho lớp/môn cụ thể. Nếu nghiệp vụ yêu cầu kiểm soát phân công này, cần bổ sung bảng `TeachingAssignments` và giao diện quản lý phân công.
