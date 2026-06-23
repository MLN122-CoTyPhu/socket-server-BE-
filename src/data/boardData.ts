import { BoardCell, EventCard } from "../types/game";

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
    description: "Quỹ Tiền tệ Quốc tế — cho vay kèm điều kiện khắt khe về cải cách kinh tế",
    effect: { money: -80, autonomy: -15 }
  },
  // 2
  {
    id: 2, name: "📈 Thị trường Chứng khoán NYSE", type: "financial_capital",
    description: "Tư bản tài chính chi phối qua hệ thống cổ phần và chứng khoán quốc tế",
    effect: { money: -60, softPower: -10 }
  },
  // 3 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (điều tiết nhà nước — Lenin: công cụ thuế, ngân sách)
  {
    id: 3, name: "🇻🇳 VIỆT NAM — Điều tiết Nhà nước", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước Việt Nam chủ động bảo vệ nền kinh tế.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 4
  {
    id: 4, name: "🏢 Samsung Conglomerate", type: "conglomerate",
    description: "Tập đoàn đa ngành kiểm soát thị trường — biểu hiện của tập trung tư bản",
    effect: { money: -70, autonomy: -10 }
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
      acceptEffect: { money: 150, autonomy: -25 },
      refuseEffect: { autonomy: 20, softPower: 15 },
    }
  },
  // 6
  {
    id: 6, name: "💻 Google (Big Tech)", type: "conglomerate",
    description: "Xuất khẩu tư bản qua dữ liệu và nền tảng số — biên giới mềm kỹ thuật số",
    effect: { money: -90, softPower: -15, autonomy: -5 }
  },
  // 7
  {
    id: 7, name: "🏭 Foxconn TNC", type: "tnc",
    description: "Chuỗi cung ứng xuyên quốc gia — khai thác lao động và chiếm đoạt giá trị thặng dư",
    effect: { money: -50, autonomy: -20 }
  },
  // 8 — Ô Việt Nam: rút thẻ Toàn cầu hóa (FDI = tận dụng mặt tích cực của độc quyền)
  {
    id: 8, name: "🇻🇳 VIỆT NAM — FDI Công nghệ cao", type: "vietnam",
    description: "Rút thẻ Toàn cầu hóa. Chủ động thu hút FDI chất lượng cao, chuyển đổi cơ cấu kinh tế.",
    effect: { drawCard: true, drawCardType: "globalization" }
  },
  // 9
  {
    id: 9, name: "💳 Fintech Platform", type: "financial_capital",
    description: "Nền tảng tài chính công nghệ tạo kênh luân chuyển vốn mới, vượt kiểm soát nhà nước",
    effect: { money: -40, softPower: -20 }
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
    description: "Ngân hàng Thế giới — vốn kèm điều kiện 'cải cách cơ cấu' áp đặt mô hình kinh tế",
    effect: { money: -100, autonomy: -20 }
  },
  // 12
  {
    id: 12, name: "📦 Amazon Supply Chain", type: "tnc",
    description: "Mạng lưới lưu thông toàn cầu — kiểm soát cả sản xuất lẫn phân phối",
    effect: { money: -80, autonomy: -10 }
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
      acceptEffect: { money: 80, autonomy: -20, softPower: -10 },
      refuseEffect: { autonomy: 25, softPower: 10 },
    }
  },
  // 14 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (thuế quan bảo hộ)
  {
    id: 14, name: "🇻🇳 VIỆT NAM — Hàng rào Thuế quan", type: "vietnam",
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
    description: "Ngân hàng độc quyền lớn nhất — không còn là trung gian mà là 'chủ nhân' của nền kinh tế",
    effect: { money: -120, autonomy: -15 }
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
      acceptEffect: { money: 200, autonomy: -35 },
      refuseEffect: { autonomy: 30, softPower: 10 },
    }
  },
  // 18
  {
    id: 18, name: "📱 Apple Supply Chain", type: "tnc",
    description: "Chuỗi giá trị toàn cầu — thiết kế ở Mỹ, sản xuất ở châu Á, chiếm đoạt giá trị thặng dư từ xa",
    effect: { money: -70, softPower: -10 }
  },
  // 19 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (cảnh giác biên giới mềm)
  {
    id: 19, name: "🇻🇳 VIỆT NAM — Cảnh giác Biên giới mềm", type: "vietnam",
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
      acceptEffect: { money: 100, autonomy: -30, softPower: -15 },
      refuseEffect: { autonomy: 25, softPower: 20 },
    }
  },
  // 21
  {
    id: 21, name: "💰 BlackRock Investment Fund", type: "financial_capital",
    description: "Quỹ đầu tư lớn nhất thế giới quản lý tài sản vượt GDP nhiều quốc gia — chi phối qua cổ phần",
    effect: { money: -110, softPower: -20 }
  },
  // 22
  {
    id: 22, name: "🏗️ BRI Infrastructure (Biên giới mềm)", type: "tnc",
    description: "Đầu tư hạ tầng núp bóng — bành trướng biên giới kinh tế, bẫy nợ và mất chủ quyền tài sản",
    effect: { money: -60, autonomy: -30, softPower: -10 }
  },
  // 23 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (xây dựng nội lực)
  {
    id: 23, name: "🇻🇳 VIỆT NAM — Xây dựng Nội lực", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Khuyến khích tập đoàn trong nước đủ mạnh cạnh tranh với TNC.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 24
  {
    id: 24, name: "🚗 Toyota TNC", type: "tnc",
    description: "Sản xuất xuyên quốc gia — nước đang phát triển phụ thuộc vào chuỗi cung ứng do TNC kiểm soát",
    effect: { money: -65, autonomy: -15 }
  },
  // 25
  {
    id: 25, name: "💳 Visa/Mastercard Fintech", type: "financial_capital",
    description: "Hạ tầng thanh toán toàn cầu — ai kiểm soát hạ tầng thanh toán kiểm soát dòng chảy tiền tệ",
    effect: { money: -55, softPower: -25 }
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
      acceptEffect: { money: 150, autonomy: -20, softPower: 10 },
      refuseEffect: { autonomy: 20, softPower: -5 },
    }
  },
  // 27 — Ô Việt Nam: rút thẻ Toàn cầu hóa (ASEAN/RCEP = khu vực hóa như chiến lược bảo vệ tập thể)
  {
    id: 27, name: "🇻🇳 VIỆT NAM — Liên kết Khu vực ASEAN/RCEP", type: "vietnam",
    description: "Rút thẻ Toàn cầu hóa. Tham gia ASEAN, RCEP — liên kết khu vực để bảo vệ không gian phát triển.",
    effect: { drawCard: true, drawCardType: "globalization" }
  },
  // 28
  {
    id: 28, name: "🔬 Intel TNC (Bán dẫn)", type: "tnc",
    description: "Công nghệ cao — mặt tích cực của độc quyền: thúc đẩy R&D và cơ hội chuyển đổi cơ cấu kinh tế",
    effect: { money: -50, autonomy: -5, softPower: 10 }
  },
  // 29
  {
    id: 29, name: "📊 Goldman Sachs", type: "financial_capital",
    description: "Tư bản tài chính Phố Wall thống trị thị trường vốn — liên minh nhân sự với bộ máy nhà nước nhiều nước",
    effect: { money: -130, autonomy: -20 }
  },
  // 30 — Vào Tù: bị chi phối hoàn toàn = mất 2 lượt (Lenin: chi phối kinh tế → chi phối chính trị)
  {
    id: 30, name: "🚨 BỊ CHI PHỐI HOÀN TOÀN", type: "crisis",
    description: "Bị chi phối hoàn toàn về kinh tế và chính trị — mất 2 lượt tiếp theo.",
    effect: { autonomy: -40, softPower: -20, skipTurns: 2 }
  },
  // 31
  {
    id: 31, name: "🧩 Tencent Conglomerate", type: "conglomerate",
    description: "Tập đoàn số đa ngành — thâu tóm dữ liệu và nền tảng, chiếm đoạt tài nguyên số",
    effect: { money: -85, softPower: -20 }
  },
  // 32 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (fintech nội địa = tự chủ tài chính số)
  {
    id: 32, name: "🇻🇳 VIỆT NAM — Fintech Nội địa", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Bảo hộ công nghệ tài chính trong nước, xây dựng chủ quyền số.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 33
  {
    id: 33, name: "✈️ Nike Manufacturing TNC", type: "tnc",
    description: "Thiết kế ở Mỹ, sản xuất ở Việt Nam — khai thác lao động giá rẻ và chiếm đoạt giá trị thặng dư",
    effect: { money: -60, autonomy: -15 }
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
    description: "Vốn phát triển kèm điều kiện cải cách cơ cấu — phản ánh lợi ích địa chính trị của nước cho vay",
    effect: { money: -70, autonomy: -10 }
  },
  // 36 — Ô Việt Nam: rút thẻ Chính sách Nhà nước (tiền tệ và tín dụng = đòn bẩy chỉ huy của nhà nước)
  {
    id: 36, name: "🇻🇳 VIỆT NAM — Tiền tệ & Tín dụng", type: "vietnam",
    description: "Rút thẻ Chính sách Nhà nước. Nhà nước dùng tiền tệ và tín dụng bảo vệ kinh tế vĩ mô.",
    effect: { drawCard: true, drawCardType: "state_policy" }
  },
  // 37
  {
    id: 37, name: "🔋 TSMC TNC (Chip)", type: "tnc",
    description: "Ai kiểm soát chip kiểm soát nền kinh tế số — độc quyền công nghệ cao nhất trong kỷ nguyên số",
    effect: { money: -90, softPower: -15 }
  },
  // 38
  {
    id: 38, name: "💼 Financial Trust (Tập đoàn Tài chính)", type: "conglomerate",
    description: "Trust tài chính thống nhất cả sản xuất lẫn lưu thông — hình thức độc quyền cao nhất theo Lenin",
    effect: { money: -100, autonomy: -20, softPower: -10 }
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
