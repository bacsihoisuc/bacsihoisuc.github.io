/* Bác sĩ Hồi sức — DỮ LIỆU TIN TỨC
   Thêm tin: chép một khối { ... }, dán lên ĐẦU danh sách (tin mới nhất ở trên), sửa nội dung.
   - loai: "nghien-cuu" | "san-pham" | "sang-tao" | "su-kien" | "simulation"
   - chu_de: chữ nhỏ sau tên chuyên mục (ví dụ "Áp lực nội sọ")
   - link: đường dẫn trong web (tính từ thư mục gốc), hoặc link ngoài bắt đầu bằng https://
   - hinh: tên hình minh họa trong assets/js/hinh.js
       prx-cpp, icp-brain, ct-ich, nirs, pbto2, alta, neuro-screen, sibicc, pi-spinal, hpi-wave
   - noi_bat: true để đưa lên vị trí tin chính ở trang chủ (chỉ nên có 1 tin) */
window.CATRUC_LOAI_TIN = {
  "nghien-cuu": "Nghiên cứu",
  "san-pham": "Sản phẩm",
  "sang-tao": "Sáng tạo",
  "su-kien": "Sự kiện & đào tạo",
  "simulation": "Simulation"
};

window.CATRUC_TIN = [
  {
    id: "sim-alta",
    loai: "simulation",
    chu_de: "Huyết động",
    tieu_de: "Simulator HemoSphere Alta đã mở: HPI, GDT và test đáp ứng dịch",
    tom_tat: "Bấm trực tiếp lên màn hình như trên máy thật: Trend, Cockpit, Split, HPI, Goal Directed Therapy, Fluid Responsiveness Test, kèm ba kịch bản giảng dạy.",
    nguon: "Bác sĩ Hồi sức",
    thoi_gian: "11/2026",
    link: "simulator/hemosphere/index.html",
    hinh: "alta"
  },
  {
    id: "tl021",
    loai: "nghien-cuu",
    chu_de: "Tự điều hòa và CPPopt",
    tieu_de: "CPP thấp hơn CPPopt nguy hiểm hơn CPP cao hơn",
    tom_tat: "Quan hệ CPP và PRx không đối xứng: PRx tăng nhanh khi CPP giảm dưới CPPopt nhưng chỉ tăng nhẹ khi CPP cao hơn. Tác giả đề xuất dùng CPPopt làm giới hạn dưới của CPP.",
    nguon: "Bögli và cộng sự · Critical Care 2025",
    thoi_gian: "2025",
    link: "nghien-cuu/index.html#tl021",
    hinh: "prx-cpp",
    noi_bat: true
  },
  {
    id: "tl017",
    loai: "nghien-cuu",
    chu_de: "Áp lực nội sọ",
    tieu_de: "PRx so với ICP trong tiên lượng chấn thương sọ não",
    tom_tat: "Tổng quan 9 nghiên cứu, ít nhất 1.240 bệnh nhân: chỉ số dẫn xuất từ PRx có giá trị tiên lượng bổ sung so với ICP đơn thuần.",
    nguon: "Rodziewicz và cộng sự · J Clin Med 2026",
    thoi_gian: "2026",
    link: "nghien-cuu/index.html#tl017",
    hinh: "icp-brain"
  },
  {
    id: "tl012",
    loai: "nghien-cuu",
    chu_de: "Đột quỵ chảy máu não",
    tieu_de: "Theo dõi thần kinh đa phương thức sớm ở đột quỵ chảy máu não",
    tom_tat: "65 bệnh nhân trong 48 giờ đầu: nhóm kết cục nặng có PRx cao hơn và CPP thực tế thấp hơn CPPopt.",
    nguon: "Ferreira và cộng sự · Front Neurol 2026",
    thoi_gian: "2026",
    link: "nghien-cuu/index.html#tl012",
    hinh: "ct-ich"
  },
  {
    id: "tl038",
    loai: "sang-tao",
    chu_de: "Gây mê tim",
    tieu_de: "Đo hemoglobin liên tục, không xâm lấn bằng NIRS trong mổ tim",
    tom_tat: "189 bệnh nhân ở 3 trung tâm; sai lệch trung bình 0,08 g/dL so với khí máu. Nghiên cứu thăm dò, chưa dùng để quyết định truyền máu.",
    nguon: "van Wonderen và cộng sự · 2025",
    thoi_gian: "2025",
    link: "nghien-cuu/index.html#tl038",
    hinh: "nirs"
  },
  {
    id: "sim-neuro",
    loai: "simulation",
    chu_de: "Thần kinh",
    tieu_de: "Simulator NeuroSmart logO: luyện xử trí ICP tăng và CPP dưới CPPopt",
    tom_tat: "Ba kịch bản: theo dõi thường quy, ICP tăng sau chấn thương sọ não theo khung SIBICC, CPP dưới CPPopt. Có chế độ tự học kèm câu hỏi.",
    nguon: "Bác sĩ Hồi sức",
    thoi_gian: "11/2026",
    link: "simulator/neurosmart/index.html",
    hinh: "neuro-screen"
  },
  {
    id: "sp-neurosmart",
    loai: "san-pham",
    chu_de: "RAUMEDIC",
    tieu_de: "NeuroSmart logO: PRx, ORx và CPPopt ngay trên màn hình tại giường",
    tom_tat: "Màn hình cảm ứng màu tính và hiển thị PRx, ORx, CPPopt cùng ICP, CPP, oxy mô não và nhiệt độ não.",
    nguon: "Giới thiệu sản phẩm",
    thoi_gian: "",
    link: "san-pham/neurosmart-logo/index.html",
    hinh: "neuro-screen"
  },
  {
    id: "sp-alta",
    loai: "san-pham",
    chu_de: "BD",
    tieu_de: "HemoSphere Alta: HPI cảnh báo sớm nguy cơ tụt huyết áp",
    tom_tat: "HPI phân tích sóng huyết áp động mạch để dự báo khả năng tụt huyết áp. Nghiên cứu gốc: dự báo trước 15 phút với độ nhạy 88%, độ đặc hiệu 87%.",
    nguon: "Giới thiệu sản phẩm",
    thoi_gian: "",
    link: "san-pham/hemosphere-alta/index.html",
    hinh: "hpi-wave"
  },
  {
    id: "tl020",
    loai: "nghien-cuu",
    chu_de: "Oxy mô não",
    tieu_de: "Thêm oxy mô não vào theo dõi ICP: phân tích gộp 16 nghiên cứu",
    tom_tat: "Theo dõi phối hợp PbtO2 và ICP liên quan kết cục thần kinh tốt sau 6 tháng cao hơn (RR 1,33) và tử vong dài hạn thấp hơn (RR 0,72).",
    nguon: "Zhang và cộng sự · PeerJ 2024",
    thoi_gian: "2024",
    link: "nghien-cuu/index.html#tl020",
    hinh: "pbto2"
  },
  {
    id: "tl005",
    loai: "nghien-cuu",
    chu_de: "Gây mê · Việt Nam",
    tieu_de: "Chỉ số tưới máu dự báo hạ huyết áp khi gây tê tủy sống mổ lấy thai",
    tom_tat: "90 sản phụ tại Bệnh viện Trung ương Thái Nguyên: PI trước gây tê tương quan nghịch mạnh với mức hạ huyết áp sau gây tê.",
    nguon: "Phạm Thị Lan và cộng sự · Tạp chí Y học Cộng đồng 2024",
    thoi_gian: "2024",
    link: "nghien-cuu/index.html#tl005",
    hinh: "pi-spinal"
  }
];
