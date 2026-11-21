# Bác sĩ Hồi sức

Website học tập cho bác sĩ hồi sức: simulator màn hình NeuroSmart logO và HemoSphere Alta, và thư viện tóm tắt nghiên cứu tiếng Việt.

Địa chỉ: https://bacsihoisuc.github.io

## Cấu trúc

Menu: Trang chủ · Tin tức · Sản phẩm · Thư viện nghiên cứu · Simulation · Liên hệ.

| Thư mục / tệp | Nội dung |
| --- | --- |
| `index.html` | Trang chủ (tin chính, tin tức, guideline, nghiên cứu dịch, sản phẩm, simulation) |
| `tin-tuc/` | Danh sách tin, lọc theo chuyên mục (`?loai=nghien-cuu`…) |
| `san-pham/` | Danh mục; `neurosmart-logo/`, `mpr2-logo/`, `hemosphere-alta/` là trang từng sản phẩm |
| `guideline/`, `nghien-cuu/`, `quy-trinh/` | Thư viện: Guideline, Nghiên cứu dịch, Quy trình – phác đồ |
| `simulator/` | Trang chọn simulator; `neurosmart/`, `hemosphere/` |
| `lien-he/` | Liên hệ |
| `assets/data/tin-tuc.js` | **Dữ liệu tin tức** – thêm tin mới ở đây |
| `assets/data/nghien-cuu.js` | **Dữ liệu thư viện nghiên cứu** – thêm bài mới ở đây |
| `assets/js/site.js` | Menu, chân trang, **thông tin liên hệ** (`LIEN_HE`) |
| `assets/js/hinh.js` | Hình minh họa tự vẽ dùng cho tin |
| `assets/js/simulator.js`, `sim-alta.js`, `sim-page.js` | Simulator |
| `assets/css/style.css` | Giao diện chung |

## Thêm một tin

1. Mở `assets/data/tin-tuc.js`, chép một khối `{ ... },` dán lên đầu danh sách, sửa nội dung.
2. Chọn `loai` (nghien-cuu, san-pham, sang-tao, su-kien, simulation) và `hinh` (tên hình trong ghi chú đầu tệp).
3. `noi_bat: true` để đưa tin lên vị trí tin chính ở trang chủ.

## Thêm một bài nghiên cứu

1. Mở `assets/data/nghien-cuu.js` (trên GitHub: bấm vào tệp, rồi bấm biểu tượng bút chì).
2. Sao chép một khối `{ ... },` có sẵn, dán lên đầu danh sách, sửa nội dung.
3. Bấm **Commit changes**. Website tự cập nhật sau khoảng 1 phút.

Đặt `nhap: false` khi tóm tắt đã được bác sĩ duyệt; `viet_nam: true` cho nghiên cứu của tác giả Việt Nam.

## Thêm hoặc sửa kịch bản simulator

Kịch bản nằm trong `SCENARIOS` ở `assets/js/simulator.js`. Mỗi thông số là các mốc `[giây, giá trị]`, ví dụ ICP từ 14 lên 30 mmHg trong khoảng giây 120 đến 480:

```js
icp: kf([[0, 14], [120, 15], [480, 30]], t)
```

`notes` là ghi chú hiện theo thời gian, `questions` là câu hỏi ở chế độ tự học.

## Lưu ý

- Nội dung chỉ để tham khảo và đào tạo, không thay thế quyết định lâm sàng.
- Simulator là mô phỏng. Bố cục màn hình dựng theo hướng dẫn sử dụng của RAUMEDIC và BD; số liệu kịch bản chờ bác sĩ thẩm định.
- Khi có tên miền riêng: vào Settings → Pages → Custom domain. Địa chỉ bacsihoisuc.github.io cũ sẽ tự chuyển sang tên miền mới.
