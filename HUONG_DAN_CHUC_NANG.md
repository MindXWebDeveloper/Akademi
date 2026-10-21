# Tài liệu dự án Akademi

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
| --- | --- | --- | --- |
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
| --- | --- |
| `src/main.jsx` | Khởi tạo router và tải resource trước khi render. |
| `src/App.jsx` | Route, đăng nhập/đăng xuất và điều kiện truy cập một số route. |
| `src/components/AuthenticatedLayout/AuthenticatedLayout.jsx` | Khung ứng dụng, menu, quyền route và nội dung trang. |
| `src/data/apiClient.js` | HTTP API, chuẩn hóa dữ liệu và quản lý lỗi CRUD. |
| `src/data/resourceConfig.js` | Tên resource API và trường khóa nghiệp vụ. |
| `public/api-config.json` | Endpoint API được tải ở phía trình duyệt. |
| `mockapi/sample-data.json` | Dữ liệu mẫu tham khảo để chuẩn bị dữ liệu API. |
| `README.md` | Ghi chú về cấu hình API, dữ liệu và giới hạn bảo mật. |

Sau khi thay đổi, có thể kiểm tra bằng `npm run lint` và `npm run build`.

## 7. Luồng chạy chi tiết từ lúc mở ứng dụng

### 7.1 Khởi động và tải dữ liệu

1. `index.html` cung cấp phần tử `#root`; `src/main.jsx` tạo React root, bọc ứng dụng bằng `StrictMode` và `BrowserRouter`.
2. Trước khi hiển thị trang, `main.jsx` render trạng thái “Connecting to Akademi” rồi gọi `initializeResources()` trong `src/data/apiClient.js`.
3. API client tải `/api-config.json`, sau đó gửi request GET song song tới tất cả resource trong `resourceConfig.js`. Mỗi response được chuẩn hóa thành danh sách bản ghi; tên trường khóa riêng như `studentKey`, `classKey` được ánh xạ thêm thành `id` để component dùng thống nhất.
4. Chỉ khi tất cả resource tải thành công, dữ liệu mới được đặt vào cache bộ nhớ và cờ `initialized` được bật. Nếu có ít nhất một request lỗi, quá trình khởi động dừng, hiện nguyên nhân và nút Retry; ứng dụng không chuyển sang dữ liệu mẫu hay `localStorage`.
5. Sau khi khởi tạo xong, `App.jsx` dựng route. Các hàm `getResourceRecords()` chỉ đọc cache và trả về bản sao mảng; các thao tác POST/PUT/DELETE của `apiClient.js` cập nhật cache sau khi API thành công. Component không tự gọi lại tất cả GET sau từng thao tác.

**Hệ quả khi phát triển:** các hàm lấy dữ liệu trong `src/data/` thường là hàm đồng bộ; chúng chỉ đọc bộ nhớ đã nạp khi startup. Muốn thêm resource, phải cập nhật đồng bộ `resourceConfig.js`, dữ liệu/API tương ứng và mọi module dùng resource đó. Không đọc resource trước khi `initializeResources()` hoàn thành.

### 7.2 Đăng nhập, điều hướng và đăng xuất

- Ở `/`, `Login` giữ vai trò đang chọn, trạng thái gửi form và dữ liệu form. `handleFinish()` gọi `authenticateUser()`; thông tin đăng nhập được đối chiếu với `Users` đã tải, gồm username không phân biệt hoa thường, password, role và `isActive !== false`.
- Sau khi tìm thấy tài khoản, `authentication.js` xác định khóa liên kết `teacherKey` hoặc `studentKey`, tìm hồ sơ tương ứng trong `Teachers`/`Students`, rồi trả về object user gọn gồm tên hiển thị, vai trò và khóa hồ sơ.
- `App.handleLogin()` giữ user trong React state và chuyển tới `/dashboard`. Đây là state trong phiên chạy, không phải phiên đăng nhập lưu bền; tải lại trang sẽ trở về trạng thái chưa đăng nhập.
- Các route nghiệp vụ nằm dưới layout xác thực. Người chưa đăng nhập bị đưa về `/`; đăng nhập rồi vào `/` sẽ được điều hướng đến `/dashboard`.
- `AuthenticatedLayout` cung cấp sidebar/header/footer, liên kết nội dung qua `<Outlet>`, lọc menu theo quyền, kiểm tra quyền với URL trực tiếp và truyền `{ isReadOnly, user }` qua outlet context. Đăng xuất xóa user trong `App` state rồi trở lại `/`.
- `/my-transcript` có điều kiện riêng trong `App`: chỉ tài khoản `student` đã có `studentKey` mới mở được; trang nhận `profileId` thay vì lấy mã học sinh từ URL.

### 7.3 Quyền ở menu và route

`roleAccess.js` đọc resource `Roles`. `getMenuAccess(role, menu)` nhận các mức `hide`, `read`, `edit`; nếu chưa cấu hình thì mặc định ẩn. Tương thích dữ liệu cũ: khi record có `hiddenMenus`, menu có trong danh sách bị ẩn, menu còn lại được xem là `edit`.

`AuthenticatedLayout` dùng danh sách `hideableMenus` để bỏ menu ẩn, đồng thời kiểm tra route trực tiếp. `hide` làm trang bị chặn và điều hướng về tổng quan; `read` vẫn render, hiển thị nhắc chỉ đọc và đặt `inert` cho nội dung trang (ngoại lệ thời khóa biểu và tự sửa hồ sơ cá nhân). Riêng thời khóa biểu nhận `isReadOnly` qua `useOutletContext` để vẫn cho chọn dữ liệu xem nhưng không cho sửa lịch/cấu hình. Môn học và các route quản lý giáo viên chỉ dành cho `principal`.

Menu hiện được khai báo trong `AuthenticatedLayout.jsx` chỉ có Tổng quan, Học sinh/Sắp lớp, Môn học, Giáo viên, Lớp học và Thời khóa biểu. Route Hoạt động, Thư viện, Thông báo vẫn khai báo trong `App.jsx` và có kiểm tra quyền nếu mở trực tiếp, nhưng chưa có item sidebar. `/roles` có component nhưng route và item menu đang comment.

## 8. Component và dữ liệu theo từng luồng

### 8.1 Khung ứng dụng và tổng quan

| Component | Dữ liệu đầu vào / lấy dữ liệu | Trách nhiệm và điểm cần lưu ý |
| --- | --- | --- |
| `src/components/Login/Login.jsx` | `onLogin` từ `App`; `Users`, `Teachers`, `Students` được đọc gián tiếp bởi `authenticateUser()` | `handleFinish` kiểm tra thông tin, báo lỗi/thành công và trả user về `App`. Form chọn role là điều kiện của đăng nhập, không phải bộ lọc danh sách. |
| `src/components/AuthenticatedLayout/AuthenticatedLayout.jsx` | Props `user`, `onLogout`; `Roles` qua `getMenuAccess()`; route hiện tại từ React Router | Lọc menu, đánh dấu menu đang mở, xử lý chuyển trang/đăng xuất, responsive sidebar và quyền. Sự kiện `akademi:roles-updated` khiến layout đọc lại quyền sau khi cấu hình được lưu. |
| `src/components/Dashboard/Dashboard.jsx` | Prop `user`; thông báo hiệu lực qua `getActiveNotices()`; học sinh qua `getStudents(năm hiện hành)`; giáo viên/lớp qua `getRecords()` | Tính số học sinh, giáo viên, lớp hiện tại và hiển thị tối đa 3 thông báo. Biểu đồ 6 tháng, lịch hoạt động mẫu và số “Thông báo chưa đọc” (`8`) đang hard-code; muốn dùng số liệu thật cần nối nguồn dữ liệu, không chỉ sửa CSS. |
| `src/components/PersonalProfile/PersonalProfile.jsx` | Prop `user` từ layout | Chọn form tự phục vụ: học sinh dùng `StudentDetail`, giáo viên/Ban Giám Hiệu dùng `TeacherDetail`; truyền `profileId` từ khóa liên kết tài khoản. Nếu không có hồ sơ liên kết, hiển thị cảnh báo. |

### 8.2 Học sinh, điểm và học bạ

| Component | Nguồn dữ liệu và cách truy vấn | Trách nhiệm / luồng thao tác |
| --- | --- | --- |
| `src/components/StudentManagement/StudentManagement.jsx` | `getStudents(schoolYear)` ghép hồ sơ `Students` với `StudentEnrollments`; `getRecords('classes')` tạo lựa chọn lớp; năm học lấy từ query string hoặc `getCurrentSchoolYear()` | Tìm theo mã/tên/lớp. Điều kiện tìm kiếm và năm học được giữ trong URL query để có thể chia sẻ/quay lại kết quả. Chưa nhập điều kiện thì không hiển thị toàn bộ danh sách. Mở chi tiết/hồ sơ mới lưu `returnTo` để quay lại bộ lọc trước đó. |
| `src/components/StudentManagement/StudentDetail/StudentDetail.jsx` | Route `studentId` hoặc prop `profileId`; `getStudentById(id, year)`, `getStudentEnrollments(id)`, lớp của năm đó; `getSchoolYears()` | Dùng chung cho tạo, sửa và tự phục vụ. `useEffect` nạp dữ liệu vào form khi ID/năm học đổi. Tạo mới gọi `createStudent()` (tạo hồ sơ, ghi danh lớp, tạo tài khoản); sửa gọi `saveStudent()`. Sau lưu, hiển thị trạng thái thành công/lỗi một phần; tự phục vụ trở lại `/profile`, quản trị trở lại danh sách. Khi xem hồ sơ còn nhúng `StudentGradeSummary`. |
| `src/components/StudentManagement/StudentGradeSummary.jsx` | Danh sách môn từ `getSubjects()`; cấu hình và điểm từng môn/học kỳ từ `grades.js`; năm học từ `schoolYears.js` | Tạo một dòng/môn, tính TB HK1, HK2, cả năm. Nút chi tiết chuyển sang phiếu điểm với `subject` và `year` trong query. Điểm chưa đủ được hiển thị thay vì thay bằng 0. |
| `src/components/StudentManagement/StudentGrades/StudentGrades.jsx` | Học sinh từ `getStudents(year)`; danh mục môn và năm học; cấu hình/điểm từ `getGradeConfig()` và `getGradeRecord()` | Dựng form số bài và điểm theo môn/năm/học kỳ; state `gradeDrafts` giữ bản nháp riêng theo tổ hợp học sinh-môn-năm-kỳ. `save()` ghi cấu hình trước rồi ghi điểm. Nếu bước điểm lỗi, giao diện báo cấu hình đã lưu nhưng điểm chưa lưu (không có transaction). |
| `src/components/StudentManagement/StudentReportCard/StudentReportCard.jsx` | `studentId` từ route; môn, năm học và `subject`/`year` từ query; điểm + cấu hình từ `grades.js` | Chỉ đọc, hiển thị các đầu điểm theo nhóm, hệ số, trung bình từng kỳ và cả năm. `getSemesterData()` gom điểm chi tiết cho một môn/kỳ; component hỗ trợ chọn lại môn/năm. |
| `src/components/StudentManagement/StudentTranscript/StudentTranscript.jsx` | Học sinh theo năm; môn; điểm/cấu hình; bản nhận xét `StudentTranscripts` qua `getStudentTranscript()` | Dùng cho route quản trị theo `studentId` và route học sinh tự xem (`profileId`, `selfService`). Tạo bảng trung bình theo môn và trung bình chung; nhận xét/học lực/hạnh kiểm có draft state, `handleSave()` ghi qua `saveStudentTranscript()`. Năm học chọn qua query `year`. |

**Cách tính điểm nằm ở** `src/data/grades.js`**:**

- Hệ số miệng, 15 phút, một tiết là 1; giữa kỳ là 2; cuối kỳ là 3.
- Một nhóm kiểm tra chỉ có trung bình khi đã có đủ số điểm được cấu hình và tất cả điểm hợp lệ; số bài bằng 0 thì bỏ nhóm khỏi phép tính.
- Trung bình học kỳ là trung bình có trọng số của các nhóm và điểm cố định; thiếu một nhóm bắt buộc hoặc thiếu giữa/cuối kỳ thì trả về `null` (chưa đủ điểm).
- Trung bình năm = `(HK1 + 2 × HK2) / 3`; cần cả hai học kỳ. Các kết quả được làm tròn 2 chữ số.

### 8.3 Component dùng chung cho giáo viên và lớp

`TeacherManagement` và `ClassManagement` chỉ là wrapper truyền `type` cho hai component dùng chung:

- `src/components/SchoolRecords/RecordList.jsx`: lấy `getRecordDefinition(type)`, gọi `getRecords(type)`, lọc theo năm học nếu là lớp. Tìm kiếm dùng các trường `searchableFields` của definition; các điều kiện nhập được kết hợp AND và so khớp chứa, không phân biệt hoa thường theo locale tiếng Việt. Kết quả bắt đầu ở trạng thái `null`, nên danh sách chỉ xuất hiện sau khi tìm kiếm. Mỗi dòng mở route chi tiết.
- `src/components/SchoolRecords/RecordForm.jsx`: lấy schema trường từ `getRecordDefinition(type)`, nhận `recordId` từ URL hoặc `profileId` khi tự phục vụ. Component chuẩn hóa chuỗi, điền dữ liệu form, gọi `createRecord()` hoặc `saveRecord()`, hiển thị lỗi/thành công và điều hướng về danh sách. Cấu hình cho từng loại record (nhãn, trường, cột, tìm kiếm, route, tiền tố mã) nằm tập trung trong `src/data/schoolRecords.js`.
- Với lớp, `schoolYear` được khởi tạo từ query string/năm hiện hành; API record dùng `schoolYearId` tham chiếu đến `SchoolYears`, còn giao diện dùng tên năm. Với giáo viên, `subjectKeys` tham chiếu `Subjects`; component dữ liệu phân giải thành tên môn. Hồ sơ giáo viên thuộc Ban Giám Hiệu không hiện trường phân công môn.
- Tạo giáo viên có thêm bước tạo tài khoản `Users`. Nếu bước này thất bại, giáo viên có thể đã được tạo thành công; thông báo cần giữ rõ trạng thái một phần để tránh người dùng tạo trùng khi thử lại.

### 8.4 Môn học và sắp lớp

| Component | Đọc/ghi dữ liệu | Hành vi chính |
| --- | --- | --- |
| `src/components/SubjectManagement/SubjectManagement.jsx` | Đọc `Subjects` trực tiếp qua `apiClient`, dùng các helper trong `subjects.js`; kiểm tra tham chiếu trong `Teachers` và `Grades` trước khi xóa | Tìm/tạo/sửa/xóa môn; tạo khóa mới dạng `SUB-nnn`; chuẩn hóa tên để ngăn tên trùng. Không cho xóa môn đang được giáo viên phân công hoặc đã có dữ liệu điểm. Sau CRUD tăng revision để component đọc lại cache. |
| `src/components/ClassPromotions/ClassPromotions.jsx` | `getPromotionPlans()`, lớp, năm học hiện có; gọi các hàm trong `promotions.js` và `schoolYears.js` | Tạo phương án cho năm nguồn, sửa hành động/lớp đích từng học sinh, duyệt hoặc từ chối. Chỉ lấy phương án `pending` đầu tiên để làm việc. Có thể tạo năm học tiếp theo và đặt năm hiện hành. |

`promotions.js` tạo một dòng phương án cho từng học sinh đã có lớp nguồn; hành động đề xuất là lên lớp, tốt nghiệp (khối 12) hoặc giữ nguyên/tạm hoãn (không hoạt động). Khi duyệt, module xác thực lớp đích và sức chứa, tạo các lớp còn thiếu, ghi danh học sinh sang năm mới, cuối cùng mới đổi trạng thái phương án sang approved. Các bước chạy tuần tự; lỗi có thể xảy ra sau khi một số lớp/ghi danh đã được ghi và kết quả trả về có `stage`/danh sách phần đã hoàn tất. Đây không phải giao dịch nguyên tử.

### 8.5 Thời khóa biểu

`src/components/Timetable/Timetable.jsx` đọc `isReadOnly` qua outlet context, năm học và cấu hình từ `timetable.js`, lớp/giáo viên/môn từ các module dữ liệu. Màn hình cho chọn chế độ xem theo lớp hoặc giáo viên; lựa chọn hiện tại quyết định danh sách option và dữ liệu tiết hiển thị. Tiết học có ngày trong tuần, số tiết, lớp, giáo viên, môn và năm học.

- `buildPeriods()` đổi giờ bắt đầu, thời lượng và thời gian nghỉ trong cấu hình thành các khung giờ hiển thị; tiết không có duration hợp lệ bị bỏ khỏi bảng.
- Thêm/sửa tiết gọi `saveLesson()`. Data module ngăn trùng cùng ngày + tiết nếu cùng lớp hoặc cùng giáo viên trong một năm học.
- Cài đặt số tiết, số tiết buổi sáng, giờ bắt đầu hai buổi, thời lượng/nghỉ từng tiết được kiểm tra giới hạn trước khi lưu; tối đa 20 tiết/ngày.
- Chế độ chỉ đọc vẫn cho chọn năm/lớp/giáo viên để tra cứu, nhưng ẩn/khóa thao tác thêm-sửa và cài đặt. Khi đổi năm học, cần nạp lại lessons/settings tương ứng thay vì dùng state của năm cũ.

### 8.6 Hoạt động, thư viện và thông báo

| Component | Dữ liệu / luồng quan trọng |
| --- | --- |
| `src/components/ExtracurricularActivities/ExtracurricularActivities.jsx` | Gọi `getActivities()` (sắp theo thời gian bắt đầu), lọc chữ trên tiêu đề/địa điểm/mô tả, lọc trạng thái và mở `ActivityDetail`. Trạng thái tính từ `registrationOpen`, thời gian bắt đầu/kết thúc; trạng thái đăng ký và trạng thái đang diễn ra là hai điều kiện khác nhau. |
| `src/components/ExtracurricularActivities/ActivityDetail.jsx` | Dùng danh sách lớp, học sinh, giáo viên để lập option; gọi `getActivityById()` theo route. Tạo/cập nhật thông tin hoạt động; thêm/xóa người tham gia theo nhóm lớp/học sinh/giáo viên/nhân viên. Data module loại bản ghi trùng, kiểm tra mở đăng ký và sức chứa học sinh; danh sách participants được lưu ngay trong record hoạt động. |
| `src/components/Library/LibraryManagement.jsx` | Đọc `getBooks()`, `getLoans()`, `getStudents()`; quản lý danh mục, số lượng kho, mượn và trả từng phần. `library.js` tính số đang mượn từ các phiếu chưa trả; không cho mượn vượt tồn, không cho giảm tổng kho xuống thấp hơn số lượng đang mượn và chỉ chấp nhận số lượng trả hợp lệ. |
| `src/components/Notices/NoticeManagement.jsx` | Đọc `getNotices()`; tìm theo tiêu đề/nội dung/người nhận/phòng họp; modal tạo/sửa/xóa. Ngày kết thúc phải không trước ngày bắt đầu. Trường phòng họp chỉ áp dụng cho thông báo họp, người nhận chỉ áp dụng cho thông báo cá nhân. |
| `src/components/RoleManagement/RoleManagement.jsx` | Đọc định nghĩa vai trò và quyền menu từ `roleAccess.js`; tạo hoặc cập nhật record `Roles`, sau đó phát sự kiện `akademi:roles-updated`. Component có trong source nhưng hiện không dùng được qua route/menu do đang bị tắt ở `App.jsx` và layout. |

## 9. Danh mục module dữ liệu và hàm nghiệp vụ

Các hàm dưới đây làm việc trên cache của API client; hàm ghi là bất đồng bộ và phần lớn trả object kết quả có `saved`/`reason` thay vì ném lỗi ra component.

| Module | Các hàm/nhóm hàm chính | Trách nhiệm |
| --- | --- | --- |
| `src/data/apiClient.js` | `initializeResources`, `getResourceRecords`, `createResourceRecord`, `updateResourceRecord`, `deleteResourceRecord`, `ResourceApiError` | Đọc cấu hình endpoint, gọi HTTP, chuẩn hóa collection/record và khóa ID, cache dữ liệu, cập nhật cache sau CRUD; lỗi mạng/HTTP/config được nêu tường minh. |
| `src/data/resourceConfig.js` | `resourceConfig`, `resourceKeys` | Ánh xạ tên logic sang tên resource trên API, trường khóa nghiệp vụ và URL cấu hình riêng nếu có. |
| `src/data/authentication.js` | `authenticateUser` | Chuẩn hóa alias vai trò, so khớp tài khoản và tìm hồ sơ liên kết. |
| `src/data/roleAccess.js` | `roleDefinitions`, `hideableMenus`, `getRoleRecord`, `getMenuAccess` | Khai báo vai trò/menu và suy ra quyền cho từng menu. |
| `src/data/schoolYears.js` | `getSchoolYears`, `getCurrentSchoolYear`, `setCurrentSchoolYear`, `createNextSchoolYear`, `getSchoolYearNameById`, `getSchoolYearIdByName` | Chuẩn hóa danh sách năm, ưu tiên năm `isCurrent` từ API, cập nhật năm hiện hành, tạo năm kế tiếp và ánh xạ tên/id. |
| `src/data/schoolRecords.js` | `getRecordDefinition`, `getRecords`, `getRecordById`, `generateRecordId`, `saveRecord`, `createRecord`, `createRecordsBatch`, `removeRecordsByIds` | Schema và CRUD dùng chung cho Classes/Teachers, kiểm tra trùng, ánh xạ năm học/môn, tạo account khi tạo giáo viên và thao tác batch tuần tự. |
| `src/data/students.js` | `getStudentEnrollments`, `assignStudentEnrollments`, `getStudents`, `getStudentById`, `generateStudentId`, `createStudent`, `saveStudent` | Tách hồ sơ học sinh và ghi danh theo năm; ghép dữ liệu cho UI; tạo hồ sơ/ghi danh/account; lưu thay đổi và báo kết quả từng phần. |
| `src/data/userAccounts.js` | `createUsernameFromName`, `createLinkedUserAccount` | Sinh username chuẩn hóa, giải quyết collision bằng hậu tố số và tạo account liên kết hồ sơ. |
| `src/data/subjects.js` | `getAllSubjects`, `getSubjects`, `getSubjectByName`, `getTeacherSubjectKeys`, `getTeacherSubjectNames` | Đọc catalog môn, tra môn theo tên, chuyển đổi giữa khóa môn và tên môn giáo viên hiển thị. |
| `src/data/grades.js` | `gradeWeights`, `getGradeConfig`, `saveGradeConfig`, `getGradeRecord`, `saveGradeRecord`, `getStudentTranscript`, `saveStudentTranscript`, `averageScores`, `completeGroupAverage`, `getSemesterAverage`, `getAnnualAverage` | Lưu cấu hình và điểm theo tổ hợp môn/năm/kỳ, nhận xét học bạ theo học sinh/năm, tính điểm và tổng kết. |
| `src/data/promotions.js` | `getPromotionPlans`, `getPromotionPlan`, `createPromotionPlan`, `updatePromotionPlanRows`, `approvePromotionPlan`, `rejectPromotionPlan` | Tạo, chỉnh sửa, kiểm tra và áp dụng phương án chuyển lớp. |
| `src/data/timetable.js` | `getTimetableSettings`, `saveTimetableSettings`, `getLessons`, `saveLesson` | Đọc cấu hình mặc định/theo năm, lưu cài đặt, lọc tiết và kiểm tra xung đột trước khi lưu. |
| `src/data/extracurricularActivities.js` | `getActivities`, `getActivityById`, `createActivity`, `updateActivity`, `addActivityParticipants`, `removeActivityParticipant` | CRUD hoạt động và nhóm người tham gia, kiểm tra trạng thái đăng ký/sức chứa/trùng thành viên. |
| `src/data/library.js` | `getBooks`, `getBookById`, `createBook`, `updateBookStock`, `getLoans`, `borrowBook`, `returnLoanQuantity` | Quản lý sách, tồn kho khả dụng và vòng đời phiếu mượn/trả. |
| `src/data/notices.js` | `getNotices`, `getNoticeById`, `getActiveNotices`, `createNotice`, `updateNotice`, `deleteNotice` | CRUD thông báo, sắp thứ tự theo ngày tạo và lọc thông báo theo khoảng ngày hiệu lực. |
| `src/data/recordValidation.js`, `src/utils/validation.js` | Quy tắc chuẩn hóa/kiểm tra dùng chung | Kiểm tra trùng hồ sơ người, chuẩn hóa tên và quy tắc nhập liệu như số điện thoại. Khi thêm trường/chính sách, kiểm tra cả form lẫn module nghiệp vụ để tránh chỉ validate ở giao diện. |

## 10. Quan hệ dữ liệu cần nắm khi thay đổi schema

- `Users` liên kết với hồ sơ qua `teacherKey` hoặc `studentKey`; vai trò account là `principal`, `teacher` hoặc `student`.
- `Students` là hồ sơ ổn định; quan hệ học sinh-lớp-năm học ở `StudentEnrollments` theo `studentId`, `classId`, `className`, `schoolYear`. Muốn sửa lớp hiện tại phải cập nhật enrollment của năm tương ứng, không ghi lớp vào hồ sơ gốc.
- `Classes.schoolYearId` là tham chiếu API; UI quy đổi thành `schoolYear` (tên năm). Khóa môn trong `Teachers.subjectKeys`, `Grades.subjectKey` tham chiếu `Subjects.subjectKey`.
- `Grades` lưu cả record loại `config` và `record`; `StudentTranscripts` lưu nhận xét/học lực/hạnh kiểm. Khóa logic được ghép từ học sinh/môn/năm/kỳ (hoặc học sinh/năm cho transcript).
- `TimetableLessons` tham chiếu năm học, tên lớp/giáo viên/môn theo dữ liệu đang dùng; `TimetableSettings` có cấu hình theo năm.
- `ClassPromotionPlans` lưu snapshot các dòng đề xuất. Thay đổi schema học sinh/lớp có thể yêu cầu điều chỉnh cả lúc tạo phương án và lúc áp dụng phương án.
- `Books` và `BookLoans` tách danh mục với phiếu mượn; số lượng còn không phải trường được nhập trực tiếp mà được tính từ các phiếu chưa trả.
- `ExtracurricularActivities.participants` được nhúng trong record hoạt động; thêm người tham gia cập nhật record đó, không tạo resource enrollment riêng.
- `localStorage` chỉ giữ lựa chọn năm học giao diện (`akademi.current-school-year`); dữ liệu nghiệp vụ còn lại thuộc API.

## 11. Quy trình an toàn khi sửa hoặc xử lý lỗi

1. Tìm route trong `src/App.jsx`, xác định component đầu trang và các component dùng chung được nhúng.
2. Theo import để xác định nguồn dữ liệu; kiểm tra module `src/data/` trước khi sửa truy vấn hay nghiệp vụ. Không thêm `fetch()` riêng trong component nếu có thể mở rộng data module dùng chung.
3. Khi thay đổi trường, cập nhật API resource/schema, `resourceConfig` nếu cần, mapper/validation, form và toàn bộ màn hình đọc trường; rà soát khóa liên kết phụ thuộc.
4. Với luồng ghi nhiều resource, giữ nguyên thông báo partial failure và ghi rõ bước đã hoàn tất. API hiện không đảm bảo transaction; người dùng phải biết khi nào hồ sơ đã được tạo nhưng enrollment/account chưa có.
5. Với quyền, kiểm tra cả menu lẫn nhập URL trực tiếp; kiểm tra các vai trò `principal`, `teacher`, `student` và trạng thái `hide`/`read`/`edit`. Đừng coi ẩn menu là cơ chế bảo mật API.
6. Với state lấy từ cache, sau CRUD cần cập nhật state/revision hoặc nạp lại dữ liệu từ getter để render mới. Getter không tự tạo subscription React.
7. Kiểm tra tối thiểu bằng `npm run lint` và `npm run build`; tập trung thử trường hợp API lỗi, bản ghi không tồn tại, dữ liệu trùng, dữ liệu thiếu và ghi một phần.

### Chẩn đoán nhanh

| Triệu chứng | Nơi bắt đầu kiểm tra |
| --- | --- |
| Không vào được ứng dụng / Retry không thành công | DevTools Network, `/api-config.json`, endpoint và tồn tại của mọi resource trong `resourceConfig.js`; startup yêu cầu tất cả resource thành công. |
| Màn danh sách trống | Xác nhận API có record, chọn đúng năm học và nhập điều kiện tìm kiếm (các danh sách hồ sơ ban đầu không tự hiện toàn bộ kết quả). |
| Mã `id` sai hoặc không tìm được bản ghi | Kiểm tra khóa nghiệp vụ trong `resourceConfig.js`, record API có `_id`/business key và mapper trong module nghiệp vụ. |
| Đổi lớp nhưng lớp cũ vẫn hiện | Kiểm tra `StudentEnrollments` theo đúng `studentId` + `schoolYear`, không chỉ sửa `Students`. |
| Số liệu trang tổng quan không khớp | Học sinh/giáo viên/lớp/thông báo đang hiệu lực lấy từ getter; chart, lịch hoạt động và số thông báo chưa đọc là dữ liệu mẫu tĩnh. |
| Thay đổi quyền chưa có hiệu lực | Kiểm tra record `Roles`, phát sự kiện cập nhật, quyền mặc định `hide`, route mapping và route có thực sự được khai báo/bật hay chưa. |
| Bấm lưu báo đã lưu một phần | Không tạo lại toàn bộ quy trình ngay; xem `reason`, `stage`, `completed`, `remaining` của kết quả và kiểm tra API resource tương ứng trước khi thử tiếp. |
