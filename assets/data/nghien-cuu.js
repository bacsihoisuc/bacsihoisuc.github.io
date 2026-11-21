/* Bác sĩ Hồi sức — dữ liệu thư viện nghiên cứu.
   THÊM BÀI MỚI: sao chép một khối { ... } bên dưới, dán lên ĐẦU danh sách, sửa nội dung.
   - id: viết liền, không dấu, không trùng (nên dùng mã TL trong kho tài liệu)
   - chu_de: chọn trong CATRUC_CHU_DE (có thể nhiều chủ đề)
   - viet_nam: true nếu là nghiên cứu của tác giả Việt Nam
   - nhap: true = bản nháp chưa được bác sĩ duyệt (hiện nhãn "Bản nháp, chờ duyệt"); duyệt xong đổi thành false
   - link: đường dẫn bài gốc (DOI, PubMed hoặc trang tạp chí)
   Bài mới nhất đặt trên cùng. */
window.CATRUC_CHU_DE = ["Áp lực nội sọ", "Tự điều hòa và CPPopt", "Oxy mô não", "Huyết động", "Gây mê", "Guideline"];

window.CATRUC_NGHIEN_CUU = [
  {
    id: "tl017",
    ten: "PRx so với ICP trong tiên lượng chấn thương sọ não: tổng quan hệ thống",
    tac_gia: "Rodziewicz và cộng sự",
    nguon: "Journal of Clinical Medicine, 2026",
    chu_de: ["Tự điều hòa và CPPopt", "Áp lực nội sọ"],
    ket_qua: "Tổng quan 9 nghiên cứu, ít nhất 1.240 bệnh nhân chấn thương sọ não nặng. Phần lớn nghiên cứu cho thấy các chỉ số dẫn xuất từ PRx (ngưỡng ICP cá thể hóa, thời gian mất tự điều hòa) có giá trị tiên lượng bổ sung so với ICP đơn thuần.",
    y_nghia: "Bằng chứng hiện còn là quan sát, chưa đủ để thành khuyến cáo lâm sàng; cần thêm nghiên cứu tiến cứu đa trung tâm.",
    link: "https://doi.org/10.3390/jcm15124611",
    nhap: true
  },
  {
    id: "tl012",
    ten: "Theo dõi thần kinh đa phương thức sớm và kết cục ở đột quỵ chảy máu não",
    tac_gia: "Ferreira và cộng sự",
    nguon: "Frontiers in Neurology, 2026",
    chu_de: ["Tự điều hòa và CPPopt"],
    ket_qua: "Nghiên cứu hồi cứu 65 bệnh nhân chảy máu não trong 48 giờ đầu. Nhóm kết cục nặng có PRx trung bình cao hơn, và CPP thực tế thấp hơn CPPopt, trong khi nhóm kết cục không nặng có CPP cao hơn CPPopt.",
    y_nghia: "Gợi ý vai trò của PRx và CPPopt ngay từ giai đoạn sớm ở bệnh nhân chảy máu não, không chỉ ở chấn thương sọ não.",
    link: "https://doi.org/10.3389/fneur.2026.1845374",
    nhap: true
  },
  {
    id: "tl021",
    ten: "Đích CPP cá thể hóa trong chấn thương sọ não: CPP thấp hơn CPPopt nguy hiểm hơn",
    tac_gia: "Bögli và cộng sự",
    nguon: "Critical Care, 2025",
    chu_de: ["Tự điều hòa và CPPopt"],
    ket_qua: "Quan hệ CPP và PRx không đối xứng: PRx tăng nhanh khi CPP giảm dưới CPPopt nhưng chỉ tăng nhẹ khi CPP cao hơn. Thời gian CPP dưới CPPopt, và nhất là dưới giới hạn dưới của tự điều hòa, liên quan kết cục xấu hơn; CPP cao hơn CPPopt nhìn chung không liên quan kết cục xấu.",
    y_nghia: "Ưu tiên tránh CPP thấp; tác giả đề xuất dùng CPPopt làm giới hạn dưới của CPP. Kịch bản “CPP dưới CPPopt” trong simulator dựa trên kết quả này.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=B%C3%B6gli+individualized+cerebral+perfusion+pressure+Critical+Care+2025",
    nhap: true
  },
  {
    id: "tl020",
    ten: "Theo dõi phối hợp PbtO2 và ICP so với ICP đơn thuần ở chấn thương sọ não nặng: phân tích gộp",
    tac_gia: "Zhang và cộng sự",
    nguon: "PeerJ, 2024",
    chu_de: ["Oxy mô não", "Áp lực nội sọ"],
    ket_qua: "Gộp 16 nghiên cứu (4 thử nghiệm ngẫu nhiên, 12 nghiên cứu thuần tập). Theo dõi phối hợp PbtO2 và ICP liên quan tỉ lệ kết cục thần kinh tốt sau 6 tháng cao hơn (RR 1,33) và tử vong dài hạn thấp hơn (RR 0,72); tử vong trong viện không khác biệt có ý nghĩa.",
    y_nghia: "Ủng hộ việc bổ sung theo dõi oxy mô não bên cạnh ICP ở chấn thương sọ não nặng.",
    link: "https://doi.org/10.7717/peerj.18086",
    nhap: true
  },
  {
    id: "tl011",
    ten: "CPPopt giai đoạn sớm và tổn thương não sớm sau chảy máu dưới nhện do vỡ phình",
    tac_gia: "Malinova và cộng sự",
    nguon: "Neurocritical Care, 2024",
    chu_de: ["Tự điều hòa và CPPopt"],
    ket_qua: "90 bệnh nhân chảy máu dưới nhện có theo dõi ICP từ 7 ngày. CPP lệch xa CPPopt trong 72 giờ đầu liên quan phù não sớm nặng hơn, nhiều ca phải mở sọ giảm áp hơn và tử vong cao hơn.",
    y_nghia: "Gợi ý lợi ích của việc giữ CPP gần CPPopt ngay từ giai đoạn đầu sau vỡ phình; cần nghiên cứu tiến cứu để khẳng định.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=Malinova+CPPopt+early+brain+injury+subarachnoid+2024",
    nhap: true
  },
  {
    id: "tl014",
    ten: "Theo dõi và điều trị ICP trong viêm màng não mủ: tổng quan hệ thống",
    tac_gia: "El-Hajj và cộng sự",
    nguon: "2024",
    chu_de: ["Áp lực nội sọ"],
    ket_qua: "18 nghiên cứu được đưa vào, chỉ 1 thử nghiệm ngẫu nhiên. ICP tăng liên quan rõ với tử vong; theo dõi và điều trị ICP xâm lấn có thể cải thiện kết cục. Dẫn lưu não thất ra ngoài là công cụ dùng nhiều nhất.",
    y_nghia: "Chưa có phác đồ chuẩn cho ICP trong viêm màng não mủ; đây là nhóm bệnh nhân hồi sức nội khoa cần cân nhắc theo dõi ICP.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=intracranial+pressure+bacterial+meningitis+systematic+review+2024",
    nhap: true
  },
  {
    id: "tl010",
    ten: "Lệch CPP so với CPPopt và oxy mô não sau chảy máu dưới nhện",
    tac_gia: "Megjhani và cộng sự",
    nguon: "Stroke, 2023",
    chu_de: ["Tự điều hòa và CPPopt", "Oxy mô não"],
    ket_qua: "131 bệnh nhân chảy máu dưới nhện, dữ liệu hai trung tâm. PbtO2 giảm khi CPP thấp hơn CPPopt và ổn định khi CPP bằng hoặc cao hơn CPPopt. Thiếu oxy mô não (PbtO2 dưới 20 mmHg) gặp nhiều hơn khi CPP dưới CPPopt.",
    y_nghia: "Cung cấp cơ sở sinh lý cho chiến lược điều trị theo CPPopt và cho việc dùng PbtO2 để kiểm tra tưới máu.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=Megjhani+CPPopt+brain+tissue+oxygen+subarachnoid+Stroke+2023",
    nhap: true
  },
  {
    id: "tl009",
    ten: "CPPopt tại thời điểm thiếu máu não muộn sau chảy máu dưới nhện",
    tac_gia: "Weiss và cộng sự",
    nguon: "Critical Care Medicine, 2022",
    chu_de: ["Tự điều hòa và CPPopt"],
    ket_qua: "39 bệnh nhân có theo dõi thần kinh xâm lấn. CPPopt tăng khoảng 30 giờ trước khi xuất hiện thiếu máu não muộn; nghiên cứu xem xét mức độ phù hợp của liệu pháp tăng huyết áp với đích CPPopt.",
    y_nghia: "CPPopt có thể thay đổi trước biến chứng; đích huyết áp cá thể hóa có thể hợp lý hơn mức cố định.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=optimal+cerebral+perfusion+pressure+delayed+cerebral+ischemia+Crit+Care+Med+2022",
    nhap: true
  },
  {
    id: "tl022",
    ten: "Đồng thuận Delphi về tự điều hòa não trong chấn thương sọ não nặng",
    tac_gia: "Depreitere và cộng sự",
    nguon: "Neurocritical Care, 2021",
    chu_de: ["Tự điều hòa và CPPopt", "Guideline"],
    ket_qua: "25 chuyên gia quốc tế đạt đồng thuận 25 tuyên bố: tự điều hòa quan trọng trong sinh lý bệnh, suy giảm theo kiểu động và không phải có hoặc không, liên quan kết cục, và không nên dùng một đích CPP tuyệt đối chung cho mọi bệnh nhân.",
    y_nghia: "Chưa đồng thuận về độ chính xác của phương pháp đo tự điều hòa hiện có; cần nghiên cứu tiến cứu về điều trị theo tự điều hòa.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=Depreitere+Delphi+cerebrovascular+autoregulation+2021",
    nhap: true
  },
  {
    id: "tl018",
    ten: "COGiTATE: thử nghiệm khả thi điều trị theo CPPopt sau chấn thương sọ não",
    tac_gia: "Tas và cộng sự",
    nguon: "2021",
    chu_de: ["Tự điều hòa và CPPopt"],
    ket_qua: "Thử nghiệm ngẫu nhiên hai nhánh tại 4 trung tâm, so sánh đích CPP cá thể hóa theo tự điều hòa với đích CPP cố định ở bệnh nhân chấn thương sọ não cần theo dõi ICP. Mục tiêu là đánh giá tính khả thi và an toàn.",
    y_nghia: "Thử nghiệm ngẫu nhiên đầu tiên về điều trị theo CPPopt, mở đường cho các nghiên cứu hiệu quả lớn hơn.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=COGiTATE+CPPopt+feasibility+randomized+traumatic+brain+injury",
    nhap: true
  },
  {
    id: "tl019",
    ten: "SIBICC: phác đồ điều trị khi theo dõi cả ICP và oxy mô não",
    tac_gia: "Chesnut và cộng sự",
    nguon: "Intensive Care Medicine, 2020",
    chu_de: ["Guideline", "Oxy mô não", "Áp lực nội sọ"],
    ket_qua: "42 chuyên gia từ sáu châu lục xây dựng ba phác đồ, mỗi phác đồ ba bậc: ICP tăng với oxy mô não bình thường; thiếu oxy mô não với ICP bình thường; và khi có cả hai.",
    y_nghia: "Khung xử trí thực tế cho khoa có theo dõi PbtO2, bổ sung cho phác đồ chỉ theo dõi ICP.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=Chesnut+SIBICC+brain+oxygen+ICP+2020",
    nhap: true
  },
  {
    id: "tl041",
    ten: "SIBICC: thuật toán điều trị khi chỉ theo dõi ICP",
    tac_gia: "Hawryluk và cộng sự",
    nguon: "Intensive Care Medicine, 2019",
    chu_de: ["Guideline", "Áp lực nội sọ"],
    ket_qua: "42 chuyên gia thống nhất phác đồ: bậc 0 cho mọi bệnh nhân có theo dõi ICP; điều trị khi ICP trên 22 mmHg; ba bậc với nguy cơ tăng dần, được phép bỏ bậc; đánh giá lại mỗi lần chuyển bậc; nghiệm pháp thử thách MAP ở bậc 2.",
    y_nghia: "Phác đồ được dùng làm khung cho kịch bản ICP tăng trong simulator.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=Hawryluk+SIBICC+management+algorithm+2019",
    nhap: true
  },
  {
    id: "tl023",
    ten: "Cá thể hóa ngưỡng CPP bằng giới hạn tự điều hòa ước tính",
    tac_gia: "Donnelly và cộng sự",
    nguon: "Critical Care Medicine, 2017",
    chu_de: ["Tự điều hòa và CPPopt"],
    ket_qua: "Nhóm Cambridge ước tính giới hạn trên và dưới của tự điều hòa cho từng bệnh nhân từ dữ liệu theo dõi liên tục, làm cơ sở cho ngưỡng CPP cá thể hóa.",
    y_nghia: "Nền tảng cho khái niệm giới hạn dưới tự điều hòa được dùng trong các nghiên cứu CPPopt sau này.",
    link: "https://doi.org/10.1097/CCM.0000000000002575",
    nhap: true
  },
  {
    id: "tl024",
    ten: "Guideline Brain Trauma Foundation phiên bản 4",
    tac_gia: "Brain Trauma Foundation",
    nguon: "2016",
    chu_de: ["Guideline", "Áp lực nội sọ"],
    ket_qua: "Khuyến cáo điều trị khi ICP trên 22 mmHg; đích CPP khoảng 60–70 mmHg; theo dõi ICP ở chấn thương sọ não nặng nhằm giảm tử vong trong viện và 2 tuần sau chấn thương.",
    y_nghia: "Nguồn của các ngưỡng ICP 22 mmHg và CPP 60 mmHg dùng trong simulator.",
    link: "https://braintrauma.org/coma/guidelines/guidelines-for-the-management-of-severe-tbi-4th-ed",
    nhap: true
  },
  {
    id: "tl038",
    ten: "Đo hemoglobin toàn phần liên tục không xâm lấn bằng NIRS trong mổ tim",
    tac_gia: "van Wonderen và cộng sự",
    nguon: "2025",
    chu_de: ["Huyết động", "Gây mê"],
    ket_qua: "189 bệnh nhân mổ tim ở 3 trung tâm. Thuật toán NIRS đo tHb liên tục có sai lệch trung bình 0,08 g/dL so với khí máu; 84% số đo nằm trong vùng an toàn của phân tích lưới sai số.",
    y_nghia: "Nghiên cứu thăm dò; cần thêm dữ liệu trước khi dùng tHb không xâm lấn để ra quyết định truyền máu.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=van+Wonderen+NIRS+total+hemoglobin+cardiac+surgery",
    nhap: true
  },
  {
    id: "tl005",
    ten: "Giá trị tiên lượng hạ huyết áp của chỉ số tưới máu trong gây tê tủy sống mổ lấy thai",
    tac_gia: "Phạm Thị Lan, Đặng Quang Dũng, Nguyễn Văn Nghị",
    nguon: "Tạp chí Y học Cộng đồng, 2024 · Bệnh viện Trung ương Thái Nguyên",
    chu_de: ["Gây mê", "Huyết động"],
    viet_nam: true,
    ket_qua: "90 sản phụ đủ tháng, ASA I–II, mổ lấy thai dưới gây tê tủy sống. Chỉ số tưới máu (PI) trước gây tê tương quan nghịch mạnh với mức hạ huyết áp sau gây tê.",
    y_nghia: "PI đo bằng máy SpO2 sẵn có, có giá trị dự báo sớm hạ huyết áp sau gây tê tủy sống mổ lấy thai.",
    link: "https://doi.org/10.52163/yhc.v65iCD9.1552",
    nhap: true
  },
  {
    id: "tl007",
    ten: "Thuật toán học máy dự báo tụt huyết áp từ sóng huyết áp động mạch (HPI)",
    tac_gia: "Hatib và cộng sự",
    nguon: "Anesthesiology, 2018",
    chu_de: ["Huyết động", "Gây mê"],
    ket_qua: "Thuật toán huấn luyện trên dữ liệu sóng động mạch của 1.334 bệnh nhân dự báo tụt huyết áp trước 15 phút với độ nhạy 88% và độ đặc hiệu 87%; trước 5 phút đạt 92% và 92%.",
    y_nghia: "Cơ sở của chỉ số HPI trên HemoSphere; được dùng trong kịch bản “Dự báo tụt huyết áp” của simulator.",
    link: "https://pubmed.ncbi.nlm.nih.gov/?term=Hatib+machine+learning+hypotension+prediction+Anesthesiology+2018",
    nhap: true
  }
];
