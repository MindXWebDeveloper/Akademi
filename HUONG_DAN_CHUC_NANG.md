# Hướng dẫn chức năng và vị trí chỉnh sửa của Akademi

Tài liệu này mô tả các chức năng đang có trong project, đường dẫn màn hình, component hiển thị và module dữ liệu cần xem khi muốn thay đổi nghiệp vụ. Tên file được ghi theo đường dẫn tương đối từ thư mục gốc.

## 1. Tổng quan kiến trúc

- Ứng dụng dùng React, React Router và Ant Design. `src/main.jsx` khởi tạo ứng dụng, nạp dữ liệu trước khi render; `src/App.jsx` khai báo route.
- `src/components/` chứa giao diện theo từng màn hình. Các component con có thể được dùng lại trong màn hình khác, không nhất thiết có route riêng.
- `src/data/` chứa lớp truy cập API và quy tắc nghiệp vụ. Ưu tiên sửa dữ liệu/nghiệp vụ ở đây thay vì viết thêm lời gọi API trực tiếp trong component.
- `src/data/apiClient.js` là lớp dùng chung để đọc, tạo, cập nhật và xóa bản ghi. `src/data/resourceConfig.js` ánh xạ tên module sang resource và trường khóa nghiệp vụ.
- Cấu hình endpoint nằm ở `public/api-config.json` và được tải về trình duyệt. Đây không phải nơi an toàn để lưu bí mật.
- Dữ liệu nghiệp vụ được tải từ API; ứng dụng không tự tạo resource hay tự chuyển sang dữ liệu trình duyệt khi API lỗi. `localStorage` chỉ lưu lựa chọn năm học của giao diện.

Luồng khởi động:

1. `src/main.jsx` gọi `initializeResources()` trong `src/data/apiClient.js`.
2. API client đọc cấu hình tại `public/api-config.json`, tải các resource được khai báo trong `src/data/resourceConfig.js` và chuẩn hóa mã bản ghi.
3. Khi tải lỗi, ứng dụng hiển thị thông báo lỗi và nút thử lại; khi thành công, `src/App.jsx` dựng các route.
4. Các trang đã đăng nhập được bao bởi `AuthenticatedLayout`; màn hình con hiển thị thông qua `Outlet`.

## 2. Bản đồ chức năng

| Chức năng / đường dẫn | Component giao diện | Module dữ liệu và resource chính | Khi cần sửa |
|---|---|---|---|
| Đăng nhập `/` | `src/components/Login/Login.jsx` | `src/data/authentication.js`, resource `Users`, `Teachers`, `Students` | Sửa biểu mẫu/nhãn trong `Login.jsx`; sửa cách đối chiếu tài khoản, vai trò hoặc hồ sơ liên kết trong `authentication.js`. |
| Tổng quan `/dashboard` | `src/components/Dashboard/Dashboard.jsx` | `src/data/notices.js` (thông báo đang hiệu lực) | Sửa thẻ, số liệu hoặc bố cục ở `Dashboard.jsx`; sửa điều kiện thông báo ở `notices.js`. |
| Hồ sơ cá nhân `/profile` | `src/components/PersonalProfile/PersonalProfile.jsx`; dùng lại form chi tiết học sinh/giáo viên | `src/data/students.js`, `src/data/schoolRecords.js`, resource `Students` hoặc `Teachers` | Sửa chọn hồ sơ theo vai trò ở `PersonalProfile.jsx`; sửa trường hồ sơ trong component chi tiết tương ứng và nghiệp vụ lưu trong module dữ liệu. |
| Bảng điểm cá nhân `/my-transcript` | `src/components/StudentManagement/StudentTranscript/StudentTranscript.jsx` | `src/data/grades.js`, `src/data/schoolYears.js`, resource `Grades`, `StudentTranscripts` | Đây là route tự xem dành cho học sinh đã liên kết `studentKey`; sửa cách giới hạn và truyền `selfService` trong `src/App.jsx`, sửa nội dung bảng điểm trong component. |
| Quản lý môn học `/subjects` | `src/components/SubjectManagement/SubjectManagement.jsx` | `src/data/subjects.js`, resource `Subjects` và API client | Sửa danh sách/form môn trong component; sửa các quy tắc tham chiếu và cách lấy tên môn trong `subjects.js`. Chỉ Ban Giám Hiệu được truy cập. |
| Quản lý học sinh `/students` | `src/components/StudentManagement/StudentManagement.jsx` | `src/data/students.js`, `src/data/schoolRecords.js`, `src/data/schoolYears.js`; resource `Students`, `StudentEnrollments`, `Classes` | Sửa lọc/danh sách ở `StudentManagement.jsx`; sửa trường tạo/sửa ở `StudentDetail/StudentDetail.jsx`; sửa tạo hồ sơ, xếp lớp và liên kết tài khoản trong `students.js`. |
| Chi tiết học sinh `/students/:studentId` và tạo mới `/students/new` | `src/components/StudentManagement/StudentDetail/StudentDetail.jsx` | `src/data/students.js`, `src/data/schoolRecords.js`, `src/data/schoolYears.js` | Sửa các trường và kiểm tra form tại component; sửa lưu hồ sơ, ghi danh lớp hoặc tài khoản liên kết ở các module dữ liệu. |
| Nhập điểm `/students/:studentId/grades` | `src/components/StudentManagement/StudentGrades/StudentGrades.jsx` | `src/data/grades.js`, `src/data/subjects.js`, `src/data/schoolYears.js`; resource `Grades` | Sửa thao tác nhập điểm ở component; sửa trọng số, số đầu điểm, cách tính điểm ở `grades.js`. |
| Phiếu điểm `/students/:studentId/report-card` | `src/components/StudentManagement/StudentReportCard/StudentReportCard.jsx` | `src/data/grades.js`, `src/data/subjects.js`, `src/data/schoolYears.js` | Sửa bố cục/trình bày phiếu ở component; sửa công thức/chỉ tiêu điểm dùng chung tại `grades.js`. |
| Học bạ `/students/:studentId/transcript` | `src/components/StudentManagement/StudentTranscript/StudentTranscript.jsx` | `src/data/grades.js`, `src/data/subjects.js`, `src/data/schoolYears.js`; resource `StudentTranscripts` | Sửa trường nhận xét và hiển thị trong component; sửa đọc/lưu đánh giá tổng kết tại `grades.js`. |
| Tóm tắt điểm học sinh | `src/components/StudentManagement/StudentGradeSummary.jsx` (component được dùng trong luồng quản lý học sinh) | `src/data/grades.js`, `src/data/subjects.js`, `src/data/schoolYears.js` | Sửa chỉ số hoặc cách tổng hợp ở component; sửa công thức nguồn ở `grades.js`. |
| Sắp lớp `/class-promotions` | `src/components/ClassPromotions/ClassPromotions.jsx` | `src/data/promotions.js`, `src/data/schoolRecords.js`, `src/data/schoolYears.js`; resource `ClassPromotionPlans`, `Students`, `Classes`, `StudentEnrollments` | Sửa thao tác duyệt/lập phương án ở component; sửa chuyển trạng thái, cập nhật danh sách và ghi danh ở `promotions.js`. |
| Quản lý giáo viên `/teachers` | `src/components/TeacherManagement/TeacherManagement.jsx` | `src/data/schoolRecords.js`, `src/data/subjects.js`, resource `Teachers`, `Users`, `Subjects` | `schoolRecords.js` chứa định nghĩa trường, cột và tìm kiếm dùng chung; component chi tiết giáo viên chứa form; nghiệp vụ tạo/cập nhật/xóa và tài khoản liên kết ở `schoolRecords.js`/`userAccounts.js`. |
| Chi tiết giáo viên `/teachers/:recordId`, tạo `/teachers/new` | `src/components/TeacherManagement/TeacherDetail/TeacherDetail.jsx` | `src/data/schoolRecords.js`, `src/data/subjects.js`, `src/data/userAccounts.js` | Sửa form tại component; thêm/đổi trường danh sách tại định nghĩa `teachers` trong `schoolRecords.js`; sửa sinh tài khoản tại `userAccounts.js`. |
| Quản lý lớp `/classes` | `src/components/ClassManagement/ClassManagement.jsx` | `src/data/schoolRecords.js`, `src/data/schoolYears.js`; resource `Classes`, `SchoolYears` | Sửa danh sách/bộ lọc ở component; sửa schema form/cột và nghiệp vụ lớp trong `schoolRecords.js`. |
| Chi tiết lớp `/classes/:recordId`, tạo `/classes/new` | `src/components/ClassManagement/ClassDetail/ClassDetail.jsx` | `src/data/schoolRecords.js`, `src/data/schoolYears.js` | Sửa form tại component; sửa trường lớp, ánh xạ năm học và kiểm tra trùng lớp trong `schoolRecords.js`. |
| Thời khóa biểu `/timetable` | `src/components/Timetable/Timetable.jsx` | `src/data/timetable.js`, `src/data/schoolRecords.js`, `src/data/subjects.js`, `src/data/schoolYears.js`; resource `TimetableLessons`, `TimetableSettings` | Sửa bảng/biểu mẫu và bộ lọc ở component; sửa lưu tiết học, cấu hình hoặc phát hiện xung đột trong `timetable.js`. |
| Hoạt động ngoại khóa `/activities` | `src/components/ExtracurricularActivities/ExtracurricularActivities.jsx` | `src/data/extracurricularActivities.js`; resource `ExtracurricularActivities` | Sửa danh sách ở component; sửa lọc và truy cập dữ liệu ở module hoạt động. |
| Chi tiết/tạo hoạt động `/activities/:activityId`, `/activities/new` | `src/components/ExtracurricularActivities/ActivityDetail.jsx` | `src/data/extracurricularActivities.js`, `src/data/students.js`, `src/data/schoolRecords.js` | Sửa biểu mẫu, đăng ký học sinh/giáo viên/lớp tại component; sửa lưu hoạt động và người tham gia tại `extracurricularActivities.js`. |
| Thư viện `/library` | `src/components/Library/LibraryManagement.jsx` | `src/data/library.js`, `src/data/students.js`; resource `Books`, `BookLoans`, `Students` | Sửa form sách, mượn/trả và bảng ở component; sửa tồn kho, số lượng còn lại và kiểm tra mượn trả ở `library.js`. |
| Thông báo `/notices` | `src/components/Notices/NoticeManagement.jsx` | `src/data/notices.js`; resource `Notices` | Sửa bảng và form tại component; sửa lọc thời hạn hoặc CRUD trong `notices.js`. Tổng quan lấy thông báo hiệu lực từ cùng module. |
| Phân quyền (chưa bật) | `src/components/RoleManagement/RoleManagement.jsx` | `src/data/roleAccess.js`, `src/data/apiClient.js`; resource `Roles` | Component và logic quyền đã tồn tại nhưng route `/roles` đang bị comment trong `src/App.jsx`; menu cũng bị comment trong `AuthenticatedLayout.jsx`. Muốn mở lại cần bật đồng bộ route, menu và kiểm tra quyền truy cập. |
| Hồ sơ học tập/biểu mẫu dùng lại | `src/components/SchoolRecords/RecordList.jsx`, `src/components/SchoolRecords/RecordForm.jsx` | `src/data/schoolRecords.js`, `src/data/schoolYears.js`, `src/data/subjects.js` | Đây là component con được nhúng trong các màn hình; sửa cách hiển thị/lọc tại component, sửa cấu trúc bản ghi và CRUD ở `schoolRecords.js`. Không có route độc lập trong `src/App.jsx`. |

## 3. Quy tắc nghiệp vụ cần biết trước khi sửa

### Học sinh, giáo viên, lớp và môn học

- Danh sách lớp và giáo viên dùng chung `src/data/schoolRecords.js`. Định nghĩa `recordDefinitions` tại đây kiểm soát nhãn, trường form, trường tìm kiếm và cột danh sách.
- Hồ sơ học sinh nằm trong `Students`; việc học sinh thuộc lớp/năm học cụ thể nằm riêng trong `StudentEnrollments`. Không nên ghi đè quan hệ ghi danh vào hồ sơ học sinh khi chỉ thay đổi xếp lớp.
- Tạo hồ sơ học sinh hoặc giáo viên còn tạo tài khoản `Users` liên kết. Các thao tác nhiều bản ghi chạy tuần tự, do đó có thể lưu thành công một phần; giữ nguyên cảnh báo/trạng thái lỗi một phần khi thay đổi UI.
- Môn học là dữ liệu dùng chung của phân công môn cho giáo viên, nhập điểm và thời khóa biểu. Xóa môn cần xem các tham chiếu để tránh làm hỏng dữ liệu liên quan.
- `Subjects` phải được tạo trên API và nạp dữ liệu trước; ứng dụng không tự khởi tạo resource này.

### Điểm và năm học

- `src/data/grades.js` chứa các hàm cấu hình số đầu điểm, lưu điểm, tính điểm học kỳ/năm và lưu đánh giá học bạ. Các màn nhập điểm, phiếu điểm và học bạ dựa vào module này.
- Trọng số điểm hiện tại được khai báo trong `gradeWeights` tại `grades.js`. Nếu đổi công thức, kiểm tra cùng lúc màn nhập điểm, phiếu điểm, học bạ và tóm tắt.
- Năm học nghiệp vụ lấy từ resource `SchoolYears`. Năm được đánh dấu `isCurrent` trên API có ưu tiên; lựa chọn cục bộ là `akademi.current-school-year`.
- Các thay đổi năm học có thể cập nhật nhiều bản ghi và có thể thất bại một phần. Xem `src/data/schoolYears.js` trước khi điều chỉnh quy trình đổi năm.

### Quyền truy cập

- Các trạng thái menu là `hide`, `read`, `edit`; quy tắc mặc định và danh sách menu nằm trong `src/data/roleAccess.js`.
- `AuthenticatedLayout.jsx` vừa dựng menu vừa kiểm tra route trực tiếp. Khi thêm menu/chức năng mới có phân quyền, cập nhật cả định nghĩa menu, route mapping, danh sách route được kiểm soát và cấu hình menu quyền.
- Môn học, quản lý giáo viên và Phân quyền hiện giới hạn cho vai trò `principal` trong layout.
- Chế độ `read` khóa tương tác trong trang; riêng thời khóa biểu vẫn cho phép dùng bộ lọc để xem, nhưng ẩn phần cấu hình và thao tác sửa/lưu.
- Route `/my-transcript` được bảo vệ riêng trong `src/App.jsx`, chỉ mở cho học sinh có `studentKey`.
- Resource `Roles` cần dữ liệu cấu hình trên API. Component Phân quyền hiện chưa được gắn route/menu nên không xuất hiện trong giao diện bình thường.

## 4. Cách chọn đúng nơi để thay đổi

1. **Đổi đường dẫn, thêm màn hình hoặc đổi điều kiện vào trang:** sửa `src/App.jsx`. Nếu cần mục menu, tiếp tục sửa `menuItems`, `menuRoutes` và xác định active item trong `src/components/AuthenticatedLayout/AuthenticatedLayout.jsx`.
2. **Đổi giao diện, nhãn, cột, form hoặc thao tác nút:** sửa component tương ứng trong `src/components/`. Với lớp/giáo viên, kiểm tra thêm định nghĩa chung trong `src/data/schoolRecords.js`.
3. **Đổi quy tắc tính toán, lọc hoặc kiểm tra hợp lệ:** sửa module nghiệp vụ tương ứng trong `src/data/` và cập nhật các component sử dụng kết quả.
4. **Đổi endpoint hoặc thêm resource API:** kiểm tra `public/api-config.json`, `src/data/resourceConfig.js`, sau đó module dữ liệu. API phải có resource trước khi ứng dụng tải; tránh đưa thông tin bí mật vào cấu hình công khai.
5. **Thêm hoặc đổi trường dữ liệu:** xác định resource/khóa trong `resourceConfig.js`; cập nhật form, đọc/ghi và mọi màn hình tiêu thụ trường đó. Với các khóa liên kết, cập nhật cả các bản ghi phụ thuộc.
6. **Đổi quyền:** cập nhật `roleAccess.js`, cách lọc menu và kiểm tra route trong `AuthenticatedLayout.jsx`; thử cả truy cập từ menu lẫn nhập URL trực tiếp.
7. **Đổi kiểu dáng toàn cục:** kiểm tra `src/App.css`, `src/index.css`, `src/main.css`; kiểu riêng một màn hình thường nằm ngay trong component đó.

## 5. Các điểm hiện có nhưng dễ hiểu nhầm

- Ô tìm kiếm trên thanh tiêu đề và biểu tượng chuông trong `AuthenticatedLayout.jsx` hiện là phần giao diện; không nên coi đó là chức năng tìm kiếm/thông báo đã hoàn chỉnh.
- Route `/roles` và mục menu Phân quyền đang comment; component có trong source không đồng nghĩa tính năng đang được bật.
- Dữ liệu tài khoản hiện được xác thực ở phía trình duyệt từ resource `Users`. Tài liệu/README của project lưu ý cách này chỉ phù hợp demo; không dùng mật khẩu thật. Hệ thống production cần backend xác thực an toàn.
- `public/api-config.json` được gửi tới browser. Chỉ dùng cấu hình/thông tin được phép công khai.
- Khi API báo lỗi, ứng dụng hiển thị lỗi thay vì dùng local storage như một bản sao dữ liệu. Không thêm fallback im lặng làm người dùng tưởng dữ liệu đã lưu.

## 6. Tệp nền tảng nên xem

| Tệp | Vai trò |
|---|---|
| `src/main.jsx` | Khởi tạo router và tải resource trước khi render. |
| `src/App.jsx` | Route, đăng nhập/đăng xuất và điều kiện truy cập một số route. |
| `src/components/AuthenticatedLayout/AuthenticatedLayout.jsx` | Khung ứng dụng, menu, quyền route và nội dung trang. |
| `src/data/apiClient.js` | HTTP API, chuẩn hóa dữ liệu và quản lý lỗi CRUD. |
| `src/data/resourceConfig.js` | Tên resource API và trường khóa nghiệp vụ. |
| `public/api-config.json` | Endpoint API được tải ở phía trình duyệt. |
| `mockapi/sample-data.json` | Dữ liệu mẫu tham khảo để chuẩn bị dữ liệu API. |
| `README.md` | Ghi chú về cấu hình API, dữ liệu và giới hạn bảo mật. |

Sau khi thay đổi, có thể kiểm tra bằng `npm run lint` và `npm run build`.
