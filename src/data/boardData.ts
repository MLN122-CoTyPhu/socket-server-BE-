import { BoardCell, EventCard, QuizQuestion } from "../types/game";

// ============================================
// NGÂN HÀNG 21 CÂU HỎI THÂU TÓM — trích từ 26 câu hỏi Chương 4 Mác-Lênin
// Mỗi câu gắn với 1 ô "ownable" (financial_capital / conglomerate / tnc).
// Trả lời đúng + đủ tiền → mua ô (thâu tóm). Trả lời sai → phạt tiền + tự chủ.
// ============================================
const Q_IMF: QuizQuestion = {
  question: "Trong thời kỳ độc quyền, ngân hàng không còn là trung gian thanh toán đơn thuần mà trở thành gì?",
  options: [
    "Người khống chế, chi phối mọi hoạt động kinh tế của xã hội",
    "Một cơ quan trung lập chỉ làm nhiệm vụ giữ hộ tiền cho khách hàng",
    "Một tổ chức từ thiện hỗ trợ vốn không hoàn lại cho doanh nghiệp nhỏ",
    "Một chi nhánh hành chính trực thuộc hoàn toàn chính phủ",
  ],
  correctIndex: 0,
};

const Q_NYSE: QuizQuestion = {
  question: "Hệ thống tài phiệt chi phối đời sống kinh tế thông qua cơ chế nào?",
  options: [
    "Chế độ tham dự (sở hữu cổ phần khống chế)",
    "Ban hành luật thuế trực tiếp lên từng công dân",
    "Kiểm soát hoàn toàn giá lương thực trong nước",
    "Sáp nhập bắt buộc mọi doanh nghiệp vào một công ty duy nhất",
  ],
  correctIndex: 0,
};

const Q_CONCERN: QuizQuestion = {
  question: "Đặc điểm chính của hình thức Concern là gì?",
  options: [
    "Tổ chức độc quyền đa ngành, có sự liên kết về kỹ thuật giữa các ngành",
    "Chỉ hoạt động trong một ngành duy nhất và không mở rộng",
    "Là thỏa thuận miệng, không có ràng buộc pháp lý giữa các bên",
    "Chỉ thống nhất giá bán, không liên quan đến kỹ thuật sản xuất",
  ],
  correctIndex: 0,
};

const Q_CONGLOMERATE: QuizQuestion = {
  question: "Conglomerate thâu tóm các xí nghiệp dựa trên cơ sở nào?",
  options: [
    "Các lĩnh vực kinh doanh hoàn toàn khác nhau, không liên quan về kỹ thuật",
    "Chỉ những xí nghiệp cùng ngành và có liên kết kỹ thuật chặt chẽ",
    "Chỉ những xí nghiệp nằm trong cùng một quốc gia",
    "Chỉ những xí nghiệp nhà nước đã cổ phần hóa",
  ],
  correctIndex: 0,
};

const Q_TNC: QuizQuestion = {
  question: "Hiện nay, chủ thể chính thực hiện đầu tư trực tiếp (FDI) toàn cầu là ai?",
  options: [
    "Các công ty xuyên quốc gia (TNCs)",
    "Các tổ chức phi chính phủ (NGO)",
    "Chính phủ các nước đang phát triển",
    "Các hộ gia đình cá thể ở nước phát triển",
  ],
  correctIndex: 0,
};

const Q_XN_LON: QuizQuestion = {
  question: "Khoa học - kỹ thuật phát triển cuối thế kỷ XIX đã thúc đẩy hình thành loại hình xí nghiệp nào?",
  options: [
    "Các xí nghiệp có quy mô lớn",
    "Các xưởng thủ công quy mô hộ gia đình",
    "Các hợp tác xã nông nghiệp nhỏ lẻ",
    "Các cửa hàng bán lẻ độc lập",
  ],
  correctIndex: 0,
};

const Q_XKTB_GIAI_DOAN: QuizQuestion = {
  question: "Xuất khẩu tư bản là đặc điểm của giai đoạn nào trong chủ nghĩa tư bản?",
  options: [
    "Giai đoạn chủ nghĩa tư bản độc quyền",
    "Giai đoạn chủ nghĩa tư bản tự do cạnh tranh",
    "Giai đoạn phong kiến chuyển sang tư bản",
    "Giai đoạn kinh tế kế hoạch hóa tập trung",
  ],
  correctIndex: 0,
};

const Q_DINH_NGHIA_DQ: QuizQuestion = {
  question: "Độc quyền là sự liên minh giữa các doanh nghiệp lớn nhằm mục đích gì?",
  options: [
    "Thâu tóm sản xuất/tiêu thụ, định giá độc quyền và thu lợi nhuận độc quyền cao",
    "Giảm giá bán để cạnh tranh công bằng với doanh nghiệp nhỏ",
    "Chia sẻ công nghệ miễn phí cho toàn ngành",
    "Tăng số lượng đối thủ cạnh tranh trên thị trường",
  ],
  correctIndex: 0,
};

const Q_KET_HOP_NHAN_SU: QuizQuestion = {
  question: "Sự kết hợp nhân sự giữa tư bản tài chính và nhà nước được thực hiện thông qua đâu?",
  options: [
    "Các hội chủ xí nghiệp, liên đoàn công nghiệp tham gia vào bộ máy chính quyền",
    "Các cuộc bầu cử trực tiếp do công nhân tổ chức",
    "Hiến pháp quy định cấm doanh nhân tham gia chính trị",
    "Tòa án quốc tế phân xử tranh chấp thương mại",
  ],
  correctIndex: 0,
};

const Q_XKTB_KET_HOP: QuizQuestion = {
  question: "Hình thức xuất khẩu tư bản hiện đại thường kết hợp với việc gì?",
  options: [
    "Kết hợp giữa xuất khẩu hàng hóa và xuất khẩu tư bản",
    "Chỉ xuất khẩu hàng hóa, không xuất khẩu vốn",
    "Chỉ chuyển giao lao động, không chuyển giao vốn hay hàng hóa",
    "Hoàn toàn tách biệt khỏi hoạt động thương mại quốc tế",
  ],
  correctIndex: 0,
};

const Q_DQNN_MUC_DICH: QuizQuestion = {
  question: "Độc quyền nhà nước hình thành nhằm tạo ra sức mạnh vật chất cho việc gì?",
  options: [
    "Sự ổn định của chế độ chính trị xã hội ứng với điều kiện lịch sử nhất định",
    "Xóa bỏ hoàn toàn vai trò của các tập đoàn tư nhân",
    "Tăng cường cạnh tranh tự do không giới hạn",
    "Giải thể toàn bộ hệ thống ngân hàng trung ương",
  ],
  correctIndex: 0,
};

const Q_BIEN_GIOI_MEM: QuizQuestion = {
  question: "Chiến lược 'Biên giới mềm' nhằm mục đích bành trướng lĩnh vực nào?",
  options: [
    "Bành trướng biên giới kinh tế và ảnh hưởng chính trị",
    "Mở rộng lãnh thổ quân sự bằng vũ lực trực tiếp",
    "Chỉ nhằm quảng bá văn hóa, không liên quan kinh tế",
    "Chỉ áp dụng trong nội bộ một quốc gia, không ra nước ngoài",
  ],
  correctIndex: 0,
};

const Q_CARTEL: QuizQuestion = {
  question: "Tại sao Cartel được coi là liên minh không vững chắc?",
  options: [
    "Vì các thành viên vẫn độc lập về cả sản xuất và lưu thông, dễ vi phạm thỏa thuận",
    "Vì Cartel bị pháp luật cấm hoàn toàn ở mọi quốc gia",
    "Vì Cartel chỉ tồn tại trong một ngày rồi giải thể",
    "Vì các thành viên bị sáp nhập thành một công ty duy nhất ngay từ đầu",
  ],
  correctIndex: 0,
};

const Q_SYNDICATE: QuizQuestion = {
  question: "Mục đích của Syndicate khi thống nhất đầu mối mua bán là gì?",
  options: [
    "Bán hàng hóa với giá đắt và mua nguyên liệu với giá rẻ",
    "Bán hàng hóa dưới giá thành để chiếm thị phần",
    "Loại bỏ hoàn toàn khâu mua bán trung gian",
    "Trao quyền định giá cho từng thành viên độc lập",
  ],
  correctIndex: 0,
};

const Q_TRUST: QuizQuestion = {
  question: "Hình thức độc quyền nào đánh dấu bước ngoặt về sự vận động của quan hệ sản xuất tư bản chủ nghĩa?",
  options: ["Trust (Tơ-rớt)", "Cartel", "Syndicate", "Concern"],
  correctIndex: 0,
};

const Q_XKTB_MUC_DICH: QuizQuestion = {
  question: "Mục đích cuối cùng của việc xuất khẩu tư bản ra nước ngoài là gì?",
  options: [
    "Chiếm đoạt giá trị thặng dư tại nước nhập khẩu tư bản",
    "Giúp đỡ nước nhập khẩu phát triển kinh tế không vụ lợi",
    "Chuyển giao toàn bộ công nghệ miễn phí",
    "Tăng viện trợ nhân đạo không hoàn lại",
  ],
  correctIndex: 0,
};

const Q_XKTB_BIEU_HIEN_MOI: QuizQuestion = {
  question: "Ngày nay, các nước tư bản phát triển thường xuất khẩu tư bản sang đâu là chủ yếu?",
  options: [
    "Xuất khẩu lẫn nhau giữa các nước tư bản phát triển",
    "Chỉ xuất khẩu sang các nước nghèo nhất thế giới",
    "Chỉ xuất khẩu trong nội bộ một quốc gia",
    "Ngừng hoàn toàn hoạt động xuất khẩu tư bản",
  ],
  correctIndex: 0,
};

const Q_CONG_CU_THUE: QuizQuestion = {
  question: "Nhà nước sử dụng công cụ Thuế để làm gì trong nền kinh tế độc quyền?",
  options: [
    "Điều tiết quá trình tái sản xuất xã hội theo hướng có lợi cho tư bản độc quyền",
    "Xóa bỏ hoàn toàn vai trò của thuế trong nền kinh tế",
    "Chỉ dùng để trả lương công chức, không điều tiết kinh tế",
    "Chuyển giao toàn quyền thu thuế cho tập đoàn tư nhân",
  ],
  correctIndex: 0,
};

const Q_SO_HUU_NN: QuizQuestion = {
  question: "Sở hữu độc quyền nhà nước là sở hữu tập thể của giai cấp nào?",
  options: [
    "Giai cấp tư bản độc quyền",
    "Giai cấp nông dân",
    "Toàn thể nhân dân lao động không phân biệt giai cấp",
    "Giai cấp tiểu tư sản thành thị",
  ],
  correctIndex: 0,
};

const Q_TAC_DONG_TICH_CUC: QuizQuestion = {
  question: "Độc quyền góp phần chuyển nền sản xuất nhỏ thành nền sản xuất như thế nào?",
  options: [
    "Nền sản xuất hiện đại",
    "Nền sản xuất thủ công truyền thống",
    "Nền sản xuất tự cung tự cấp",
    "Nền sản xuất phi tập trung hoàn toàn",
  ],
  correctIndex: 0,
};

const Q_TAC_DONG_TIEU_CUC: QuizQuestion = {
  question: "Độc quyền có thể gây ra hệ quả gì đối với sự phân hóa xã hội?",
  options: [
    "Làm gia tăng sự phân hóa giàu nghèo sâu sắc",
    "Xóa bỏ hoàn toàn khoảng cách giàu nghèo",
    "Không có tác động gì đến cơ cấu xã hội",
    "Làm giảm chênh lệch thu nhập giữa các tầng lớp",
  ],
  correctIndex: 0,
};

// ============================================
// BÀN CỜ 40 Ô — bám sát Chương 4 Mác-Lênin
// ============================================
export const BOARD_CELLS: BoardCell[] = [
  // 0
  {
    id: 0, name: "🌏 XUẤT PHÁT", type: "start",
    description: "Nhận 200$ khi đi qua ô này",
    effect: { money: 200 }
  },
  // 1 — IMF: ô tư bản tài chính điển hình nhất của Lenin
  {
    id: 1, name: "🏦 IMF", type: "financial_capital",
    description: "Quỹ Tiền tệ Quốc tế — trả lời đúng để thâu tóm, hoặc trả phí thuê nếu đã có chủ",
    effect: {},
    ownable: true, price: 480, rent: 80, quiz: Q_IMF,
  },
  // 2
  {
    id: 2, name: "📈 Thị trường Chứng khoán NYSE", type: "financial_capital",
    description: "Tư bản tài chính chi phối qua hệ thống cổ phần — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 360, rent: 60, quiz: Q_NYSE,
  },
  // 3 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (điều tiết nhà nước — Lenin: công cụ thuế, ngân sách)
  {
    id: 3, name: "VIỆT NAM — Điều tiết Nhà nước", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước Việt Nam chủ động bảo vệ nền kinh tế.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 4
  {
    id: 4, name: "🏢 Samsung Conglomerate", type: "conglomerate",
    description: "Tập đoàn đa ngành kiểm soát thị trường — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 420, rent: 70, quiz: Q_CONCERN,
  },
  // 5 — Oil Consortium: biểu quyết về chủ quyền tài nguyên (Lenin: liên minh tư bản ngân hàng+công nghiệp)
  {
    id: 5, name: "🌐 Liên minh Dầu mỏ Quốc tế (Oil Consortium)", type: "consortium",
    description: "Hội đồng tư vấn họp — quyết định về chủ quyền tài nguyên dầu mỏ chiến lược.",
    effect: { councilVote: true },
    voteConfig: {
      question: "Ký hợp đồng khai thác dầu mỏ dài hạn với Liên minh dầu mỏ quốc tế?",
      acceptLabel: "✅ Ký hợp đồng — Nhận vốn đầu tư, nhượng quyền kiểm soát tài nguyên quốc gia",
      refuseLabel: "❌ Từ chối — Giữ chủ quyền tài nguyên, bảo vệ lợi ích quốc gia dài hạn",
      acceptEffect: { money: 300, autonomy: -15 },
      refuseEffect: { autonomy: 10, softPower: 10 },
    }
  },
  // 6
  {
    id: 6, name: "💻 Google (Big Tech)", type: "conglomerate",
    description: "Xuất khẩu tư bản qua dữ liệu và nền tảng số — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 540, rent: 90, quiz: Q_CONGLOMERATE,
  },
  // 7
  {
    id: 7, name: "🏭 Foxconn TNC", type: "tnc",
    description: "Chuỗi cung ứng xuyên quốc gia — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 300, rent: 50, quiz: Q_TNC,
  },
  // 8 — Ô Việt Nam: rút thẻ Toàn cầu hóa (FDI = tận dụng mặt tích cực của độc quyền)
  {
    id: 8, name: "VIỆT NAM — FDI Công nghệ cao", type: "vietnam",
    description: "Rút thẻ Toàn cầu hóa. Chủ động thu hút FDI chất lượng cao, chuyển đổi cơ cấu kinh tế.",
    effect: { drawCard: true, drawCardType: "globalization" }
  },
  // 9
  {
    id: 9, name: "💳 Fintech Platform", type: "financial_capital",
    description: "Nền tảng tài chính công nghệ tạo kênh luân chuyển vốn mới — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 240, rent: 40, quiz: Q_XN_LON,
  },
  // 10
  {
    id: 10, name: "⚓ TỰ DO — Không hiệu ứng", type: "free",
    description: "Nghỉ ngơi một lượt — quan sát thị trường toàn cầu",
    effect: {}
  },
  // 11
  {
    id: 11, name: "🌍 World Bank", type: "financial_capital",
    description: "Ngân hàng Thế giới — vốn kèm điều kiện 'cải cách cơ cấu' — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 600, rent: 100, quiz: Q_XKTB_GIAI_DOAN,
  },
  // 12
  {
    id: 12, name: "📦 Amazon Supply Chain", type: "tnc",
    description: "Mạng lưới lưu thông toàn cầu — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 480, rent: 80, quiz: Q_DINH_NGHIA_DQ,
  },
  // 13 — Tech Alliance: biểu quyết về tiêu chuẩn công nghệ (Lenin: biên giới mềm công nghệ)
  {
    id: 13, name: "🔗 Liên minh Công nghệ Quốc tế (Tech Consortium)", type: "consortium",
    description: "Liên minh công nghệ áp đặt tiêu chuẩn quốc tế — hội đồng quyết định hội nhập hay kháng cự.",
    effect: { councilVote: true },
    voteConfig: {
      question: "Chấp nhận tiêu chuẩn công nghệ của Liên minh Big Tech, phụ thuộc nền tảng nước ngoài?",
      acceptLabel: "✅ Hội nhập công nghệ — Tiếp cận công nghệ tiên tiến, chịu phụ thuộc nền tảng số ngoại",
      refuseLabel: "❌ Xây dựng tiêu chuẩn riêng — Giữ tự chủ công nghệ, tăng chi phí phát triển",
      acceptEffect: { money: 160, autonomy: -10, softPower: -5 },
      refuseEffect: { autonomy: 15, softPower: 5 },
    }
  },
  // 14 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (thuế quan bảo hộ)
  {
    id: 14, name: "VIỆT NAM — Hàng rào Thuế quan", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Thuế quan bảo vệ sản xuất nội địa trước hàng hóa độc quyền ngoại.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 15
  {
    id: 15, name: "💥 KHỦNG HOẢNG Tín dụng", type: "crisis",
    description: "Tất cả người chơi mất tiền — khủng hoảng tái cấu trúc độc quyền theo hướng tập trung hơn",
    effect: { money: -150, allPlayers: true }
  },
  // 16
  {
    id: 16, name: "🏦 JP Morgan", type: "financial_capital",
    description: "Ngân hàng độc quyền lớn nhất — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 720, rent: 120, quiz: Q_KET_HOP_NHAN_SU,
  },
  // 17 — Banking Syndicate: biểu quyết về tự chủ tiền tệ (Lenin: syndicate = thỏa thuận giá cả)
  {
    id: 17, name: "🛢️ Tổ hợp Ngân hàng Toàn cầu (Banking Syndicate)", type: "consortium",
    description: "Syndicate ngân hàng kiểm soát lãi suất toàn cầu — hội đồng quyết định về tự chủ tiền tệ.",
    effect: { councilVote: true },
    voteConfig: {
      question: "Gia nhập Syndicate ngân hàng toàn cầu, chấp nhận điều kiện lãi suất do tổ hợp này kiểm soát?",
      acceptLabel: "✅ Gia nhập Syndicate — Tiếp cận nguồn vốn khổng lồ, mất quyền tự chủ chính sách tiền tệ",
      refuseLabel: "❌ Giữ độc lập tiền tệ — Bảo vệ quyền tự quyết về lãi suất và chính sách tiền tệ quốc gia",
      acceptEffect: { money: 400, autonomy: -25 },
      refuseEffect: { autonomy: 20, softPower: 5 },
    }
  },
  // 18
  {
    id: 18, name: "📱 Apple Supply Chain", type: "tnc",
    description: "Chuỗi giá trị toàn cầu — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 420, rent: 70, quiz: Q_XKTB_KET_HOP,
  },
  // 19 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (cảnh giác biên giới mềm)
  {
    id: 19, name: "VIỆT NAM — Cảnh giác Biên giới mềm", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhận diện chiến lược bành trướng kinh tế núp bóng đầu tư.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 20 — Hội đồng Tư vấn: biểu quyết về liên minh nhân sự (Lenin: Personal Union)
  {
    id: 20, name: "🎯 TRUNG TÂM — Hội đồng Tư vấn", type: "free",
    description: "Toàn bộ người chơi biểu quyết về một quyết sách kinh tế quan trọng — mô phỏng liên minh nhân sự.",
    effect: { councilVote: true },
    voteConfig: {
      question: "Chấp nhận liên minh nhân sự: để đại diện tập đoàn tài chính quốc tế tham gia Hội đồng Cố vấn Kinh tế Quốc gia?",
      acceptLabel: "✅ Chấp nhận liên minh nhân sự — Nhận hỗ trợ tài chính, chính sách kinh tế bị ảnh hưởng bởi tài phiệt",
      refuseLabel: "❌ Giữ bộ máy độc lập — Bảo vệ tính tự chủ chính sách, từ chối ảnh hưởng của tư bản tài chính",
      acceptEffect: { money: 200, autonomy: -20, softPower: -10 },
      refuseEffect: { autonomy: 15, softPower: 15 },
    }
  },
  // 21
  {
    id: 21, name: "💰 BlackRock Investment Fund", type: "financial_capital",
    description: "Quỹ đầu tư lớn nhất thế giới — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 660, rent: 110, quiz: Q_DQNN_MUC_DICH,
  },
  // 22
  {
    id: 22, name: "🏗️ BRI Infrastructure (Biên giới mềm)", type: "tnc",
    description: "Đầu tư hạ tầng núp bóng, bẫy nợ — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 360, rent: 60, rentAutonomy: -8, quiz: Q_BIEN_GIOI_MEM,
  },
  // 23 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (xây dựng nội lực)
  {
    id: 23, name: "VIỆT NAM — Xây dựng Nội lực", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Khuyến khích tập đoàn trong nước đủ mạnh cạnh tranh với TNC.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 24
  {
    id: 24, name: "🚗 Toyota TNC", type: "tnc",
    description: "Sản xuất xuyên quốc gia — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 390, rent: 65, quiz: Q_CARTEL,
  },
  // 25
  {
    id: 25, name: "💳 Visa/Mastercard Fintech", type: "financial_capital",
    description: "Hạ tầng thanh toán toàn cầu — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 330, rent: 55, quiz: Q_SYNDICATE,
  },
  // 26 — WTO: biểu quyết về mở cửa thị trường (Lenin: thể chế phản ánh lợi ích nước phát triển)
  {
    id: 26, name: "🤝 Tổ chức Thương mại Thế giới (WTO)", type: "consortium",
    description: "Gia nhập WTO mở thị trường nhưng kèm điều kiện — hội đồng biểu quyết hội nhập hay bảo hộ.",
    effect: { councilVote: true },
    voteConfig: {
      question: "Mở cửa thị trường hoàn toàn theo điều kiện WTO — giảm bảo hộ nội địa để tiếp cận thị trường toàn cầu?",
      acceptLabel: "✅ Ký kết và mở cửa — Mở rộng xuất khẩu, tiếp cận 164 quốc gia thành viên WTO",
      refuseLabel: "❌ Duy trì bảo hộ chiến lược — Bảo vệ sản xuất và nông nghiệp nội địa trước cạnh tranh ngoại",
      acceptEffect: { money: 300, autonomy: -10, softPower: 5 },
      refuseEffect: { autonomy: 10 },
    }
  },
  // 27 — Ô Việt Nam: rút thẻ Toàn cầu hóa (ASEAN/RCEP = khu vực hóa như chiến lược bảo vệ tập thể)
  {
    id: 27, name: "VIỆT NAM — Liên kết Khu vực ASEAN/RCEP", type: "vietnam",
    description: "Rút thẻ Toàn cầu hóa. Tham gia ASEAN, RCEP — liên kết khu vực để bảo vệ không gian phát triển.",
    effect: { drawCard: true, drawCardType: "globalization" }
  },
  // 28
  {
    id: 28, name: "🔬 Intel TNC (Bán dẫn)", type: "tnc",
    description: "Công nghệ cao — mặt tích cực của độc quyền — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 300, rent: 50, quiz: Q_TAC_DONG_TICH_CUC,
  },
  // 29
  {
    id: 29, name: "📊 Goldman Sachs", type: "financial_capital",
    description: "Tư bản tài chính Phố Wall thống trị thị trường vốn — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 780, rent: 130, quiz: Q_XKTB_BIEU_HIEN_MOI,
  },
  // 30 — Vào Tù: bị chi phối hoàn toàn = mất 2 lượt (Lenin: chi phối kinh tế → chi phối chính trị)
  {
    id: 30, name: "🚧 ĐÌNH TRỆ SẢN XUẤT", type: "crisis",
    description: "Vẫn di chuyển bình thường nhưng không thể thu phí thuê hay thâu tóm ô mới trong 2 lượt tiếp theo (vẫn được biểu quyết Hội đồng).",
    effect: { autonomy: -30, softPower: -20, skipTurns: 2 }
  },
  // 31
  {
    id: 31, name: "🧩 Tencent Conglomerate", type: "conglomerate",
    description: "Tập đoàn số đa ngành — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 510, rent: 85, quiz: Q_TAC_DONG_TIEU_CUC,
  },
  // 32 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (fintech nội địa = tự chủ tài chính số)
  {
    id: 32, name: "VIỆT NAM — Fintech Nội địa", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Bảo hộ công nghệ tài chính trong nước, xây dựng chủ quyền số.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 33
  {
    id: 33, name: "✈️ Nike Manufacturing TNC", type: "tnc",
    description: "Thiết kế ở Mỹ, sản xuất ở Việt Nam — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 360, rent: 60, quiz: Q_XKTB_MUC_DICH,
  },
  // 34
  {
    id: 34, name: "🌊 Khủng hoảng Tài chính Toàn cầu", type: "crisis",
    description: "Tích tụ tư bản bắt buộc — hợp nhất tài sản để tồn tại, độc quyền tập trung hơn sau khủng hoảng",
    effect: { money: -200, allPlayers: true }
  },
  // 35
  {
    id: 35, name: "🏛️ ADB (Ngân hàng Phát triển Châu Á)", type: "financial_capital",
    description: "Vốn phát triển kèm điều kiện cải cách cơ cấu — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 420, rent: 70, quiz: Q_CONG_CU_THUE,
  },
  // 36 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (tiền tệ và tín dụng = đòn bẩy chỉ huy của nhà nước)
  {
    id: 36, name: "VIỆT NAM — Tiền tệ & Tín dụng", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước dùng tiền tệ và tín dụng bảo vệ kinh tế vĩ mô.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 37
  {
    id: 37, name: "🔋 TSMC TNC (Chip)", type: "tnc",
    description: "Ai kiểm soát chip kiểm soát nền kinh tế số — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 540, rent: 90, quiz: Q_SO_HUU_NN,
  },
  // 38
  {
    id: 38, name: "💼 Financial Trust (Tập đoàn Tài chính)", type: "conglomerate",
    description: "Trust tài chính thống nhất cả sản xuất lẫn lưu thông — trả lời đúng để thâu tóm",
    effect: {},
    ownable: true, price: 600, rent: 100, rentAutonomy: -10, quiz: Q_TRUST,
  },
  // 39
  {
    id: 39, name: "🎴 CƠ HỘI — Rút thẻ Vận mệnh", type: "free",
    description: "Rút thẻ ngẫu nhiên — cơ hội hay rủi ro trong nền kinh tế toàn cầu hóa",
    effect: { drawCard: true }
  },
];

// ============================================
// BỘ THẺ SỰ KIỆN — 3 loại theo Chương 4
// ============================================
export const EVENT_CARDS: EventCard[] = [
  // 🟢 THẺ CHÍNH SÁCH NHÀ NƯỚC (state_policy)
  // Dựa theo mln2.docx: "Vai trò điều tiết của Nhà nước Việt Nam"
  {
    id: "sp1", type: "state_policy",
    title: "🛡️ Bảo hộ Fintech Nội địa",
    description: "Việt Nam ban hành chính sách hỗ trợ công ty công nghệ tài chính trong nước. Không phải trả phí ô Fintech 1 lượt.",
    effect: { softPower: 20, autonomy: 15 }
  },
  {
    id: "sp2", type: "state_policy",
    title: "🏗️ Điều tiết Nhà nước hiệu quả",
    description: "Nhà nước sử dụng công cụ thuế và ngân sách bảo vệ nền kinh tế trước các cú sốc bên ngoài.",
    effect: { autonomy: 25, money: 50 }
  },
  {
    id: "sp3", type: "state_policy",
    title: "⚖️ Hàng rào Thuế quan",
    description: "Hạn chế sự thao túng của hàng hóa độc quyền nước ngoài. Các tập đoàn quốc tế phải nộp thuế cao.",
    effect: { money: 120, autonomy: 10 }
  },
  {
    id: "sp4", type: "state_policy",
    title: "🔍 Cảnh giác Biên giới mềm",
    description: "Nhận diện chiến lược bành trướng kinh tế núp bóng đầu tư hạ tầng. Giữ vững quyền lực mềm và tự chủ.",
    effect: { softPower: 30, autonomy: 20 }
  },
  {
    id: "sp5", type: "state_policy",
    title: "🏭 Xây dựng Tập đoàn Nội địa",
    description: "Khuyến khích tập đoàn trong nước đủ mạnh cạnh tranh với TNC. Tăng năng lực nội sinh.",
    effect: { softPower: 15, money: 80, autonomy: 10 }
  },

  // 🔴 THẺ TƯ BẢN TÀI CHÍNH (financial_capital)
  // Dựa theo mln2.docx: "Tác động đối với các nước đang phát triển"
  {
    id: "fc1", type: "financial_capital",
    title: "💥 Khủng hoảng Tín dụng Toàn cầu",
    description: "Tất cả người chơi mất tiền — quá trình tích tụ tư bản bắt buộc xảy ra khi khủng hoảng.",
    effect: { money: -150, allPlayers: true }
  },
  {
    id: "fc2", type: "financial_capital",
    title: "📉 Dòng vốn rút khỏi Thị trường",
    description: "Các quỹ đầu tư quốc tế rút vốn đột ngột khi thị trường bất ổn — mất tài sản và quyền lực mềm.",
    effect: { money: -100, softPower: -15 }
  },
  {
    id: "fc3", type: "financial_capital",
    title: "🏢 Thâu tóm Doanh nghiệp Nội địa",
    description: "Tập đoàn độc quyền nước ngoài thâu tóm công ty trong nước — mất quyền kiểm soát tài sản chiến lược.",
    effect: { money: -80, autonomy: -25 }
  },
  {
    id: "fc4", type: "financial_capital",
    title: "🔗 Kết hợp Nhân sự (Personal Union)",
    description: "Đại diện tập đoàn độc quyền xâm nhập bộ máy nhà nước — mất tự chủ chính sách kinh tế.",
    effect: { autonomy: -30, softPower: -20 }
  },
  {
    id: "fc5", type: "financial_capital",
    title: "💸 Xuất khẩu Tư bản Chiếm đoạt Giá trị Thặng dư",
    description: "Tư bản nước ngoài chiếm đoạt giá trị thặng dư từ lao động trong nước — mất tiền và tự chủ.",
    effect: { money: -120, autonomy: -20 }
  },

  // 🟡 THẺ TOÀN CẦU HÓA (globalization)
  // Dựa theo mln2.docx: "Tận dụng mặt tích cực của độc quyền" và "Áp lực hội nhập"
  {
    id: "gl1", type: "globalization",
    title: "🌟 Thu hút FDI Công nghệ cao",
    description: "Tập đoàn đa quốc gia đầu tư vào ngành bán dẫn — chuyển đổi cơ cấu kinh tế theo hướng công nghệ cao.",
    effect: { money: 100, softPower: 20 }
  },
  {
    id: "gl2", type: "globalization",
    title: "🤝 Gia nhập Hiệp định Thương mại Khu vực",
    description: "Tham gia RCEP mở rộng thị trường — nhưng giảm bảo hộ. Cân bằng giữa hội nhập và tự chủ.",
    effect: { money: 80, autonomy: -10, softPower: 15 }
  },
  {
    id: "gl3", type: "globalization",
    title: "📡 Hội nhập Kinh tế số",
    description: "Tiếp nhận công nghệ và dòng vốn số — tăng năng suất nhưng phụ thuộc nền tảng nước ngoài.",
    effect: { money: 60, softPower: -10, autonomy: -5 }
  },
  {
    id: "gl4", type: "globalization",
    title: "⚡ Cách mạng Công nghiệp 4.0",
    description: "Độc quyền thúc đẩy tiến bộ kỹ thuật — mặt tích cực của độc quyền mà Lenin đề cập. Năng suất tăng mạnh.",
    effect: { money: 90, softPower: 10 }
  },
];
