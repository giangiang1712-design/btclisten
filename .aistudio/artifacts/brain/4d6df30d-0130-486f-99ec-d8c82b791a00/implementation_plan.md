# Kế Hoạch Bổ Sung Thanh Lọc Tiến Độ & Phân Nhóm Theo Loại Hành Động Trong Tab 'Sự Kiện Khẩn & Chỉ Đạo' (SOP Cấp 4)

Nâng cấp giao diện quản lý và theo dõi sự cố khẩn cấp bên trong khối **Vòng Đời SOP** với hệ thống lọc tiến độ trực quan và phân nhóm chuyên sâu theo loại hành động.

---

## Confirmations & User Decisions (Phase 1 Feedback)

> [!IMPORTANT]
> Dựa trên lựa chọn chính thức của Lãnh đạo qua các câu hỏi làm rõ (Turn 1):

- **Xác nhận 1 (Thanh lọc tiến độ Status Tabs)**: Thiết kế dạng Segmented Control đen trắng tương phản cao, tích hợp badge đếm số lượng bài viết cho 3 trạng thái: **Chờ xử lý**, **Đang xử lý**, và **Đã hoàn tất**.
- **Xác nhận 2 (Phân nhóm theo Loại hành động)**: Hiển thị các khối nhóm dạng Card Section phân theo từng Loại hành động chính (*Phát ngôn*, *Rà soát pháp lý*, *Điều chỉnh chính sách*), giúp Lãnh đạo nắm bắt tình hình điều hành tức thời.

---

## 1. Chi Tiết Tác Vụ Lập Trình (Technical Implementation)

### 1.1. Bổ sung State & Thanh Lọc Tiến Độ trong `SopLifecycleStagePipeline.tsx`
- Thêm state `directiveSubTab` (`'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'`).
- Xây dựng thanh Segmented Control với phong cách Monochrome Command Center ngay phía trên danh sách bài viết khi `selectedLevel === 'DIRECTIVE_URGENT'`.

### 1.2. Phân Nhóm Theo Loại Hành Động (Action Type Grouping)
- Gom nhóm các bài viết thuộc tab Sự kiện Khẩn & Chỉ đạo theo `executiveDirective?.actionTypeLabelVi` hoặc `handlingActionLabel`:
  1. **Phát ngôn truyền thông / Phản hồi**
  2. **Rà soát pháp lý / Thanh kiểm tra**
  3. **Điều chỉnh chính sách / Quyết sách**
- Hiển thị dưới dạng các Card Section có tiêu đề rõ ràng, viền tương phản cao, kèm bộ lọc trạng thái nhanh.

---

## 2. Kiểm Tra & Xác Nhận (Verification)
- Chạy `compile_applet` kiểm tra build thành công.
- Chạy `lint_applet` kiểm tra không có lỗi TypeScript.
