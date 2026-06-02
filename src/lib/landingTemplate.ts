import type { ProductCopy } from "./productContent";

// Tạo nội dung landing page mặc định thông minh dựa trên tên + danh mục
export function buildDefaultLanding(
  name: string,
  category: string,
  description?: string,
): ProductCopy {
  const isSheet = category === "google_sheet";
  const categoryLabel = isSheet ? "Google Sheets" : "Notion";

  // Phân tích tên sản phẩm để tạo nội dung phù hợp
  const nameLower = name.toLowerCase();
  const isBudget    = /budget|tài chính|chi tiêu|tiết kiệm|finance/.test(nameLower);
  const isProject   = /project|dự án|quản lý|crm|freelance/.test(nameLower);
  const isHabit     = /habit|thói quen|hàng ngày|daily/.test(nameLower);
  const isStudy     = /study|học|ôn thi|planner/.test(nameLower);
  const isContent   = /content|calendar|lịch|đăng bài/.test(nameLower);
  const isTravel    = /travel|du lịch|chuyến đi/.test(nameLower);
  const isReading   = /reading|đọc sách|book/.test(nameLower);
  const isGoal      = /goal|okr|mục tiêu/.test(nameLower);
  const isBrain     = /brain|second brain|ghi chú|knowledge/.test(nameLower);

  // Headline theo loại
  let headline = `Bắt đầu dùng ${name} — ngay hôm nay?`;
  let subheadline = `Template ${categoryLabel} giúp bạn ${description ?? "làm việc thông minh hơn, không phải nhiều hơn"}. Duplicate một lần — dùng vĩnh viễn.`;

  if (isBudget) {
    headline = "Tháng nào cũng hết tiền mà không biết tiêu vào đâu?";
    subheadline = `${name} giúp bạn theo dõi thu chi tự động, biết rõ tiền đi đâu và tiết kiệm được bao nhiêu mỗi tháng.`;
  } else if (isProject) {
    headline = "Dự án chồng chéo — bạn đang quản lý hay đang bị quản lý?";
    subheadline = `${name} tập trung mọi thứ về dự án, khách hàng và deadline vào một chỗ — nhìn vào là biết ngay cần làm gì tiếp theo.`;
  } else if (isHabit) {
    headline = "Quyết tâm xây thói quen nhưng bỏ cuộc sau tuần đầu?";
    subheadline = `${name} biến việc theo dõi thói quen thành dữ liệu — streak, heatmap và thống kê giúp bạn duy trì đến ngày thành công.`;
  } else if (isStudy) {
    headline = "Ôn thi đến khuya nhưng vẫn không tự tin khi bước vào phòng thi?";
    subheadline = `${name} giúp bạn lên kế hoạch học tập khoa học — chia nhỏ syllabus, lịch ôn tập và theo dõi tiến trình từng môn.`;
  } else if (isContent) {
    headline = "Deadline đăng bài đến rồi vẫn đang ngồi chờ ý tưởng?";
    subheadline = `${name} giúp bạn lên kế hoạch nội dung trước, đăng đều đặn và không bao giờ thiếu ý tưởng nữa.`;
  } else if (isTravel) {
    headline = "Lên kế hoạch du lịch mà cứ sợ quên mất điều gì?";
    subheadline = `${name} tổ chức toàn bộ chuyến đi từ checklist đến ngân sách — chuẩn bị kỹ, đi nhẹ đầu, tận hưởng 100%.`;
  } else if (isReading) {
    headline = "Đọc xong 2 tuần sau không nhớ gì — như chưa từng đọc?";
    subheadline = `${name} giúp bạn ghi chú có hệ thống, lưu highlight và ôn lại kiến thức đúng lúc để nhớ lâu hơn.`;
  } else if (isGoal) {
    headline = "Đặt mục tiêu đầu năm — cuối năm không nhớ mình đã đặt gì?";
    subheadline = `${name} biến mục tiêu mơ hồ thành kế hoạch đo lường được — review hàng tuần, tiến trình bằng số, đạt được là chắc.`;
  } else if (isBrain) {
    headline = "Đầu óc đang chứa quá nhiều thứ — và vẫn sợ quên điều quan trọng?";
    subheadline = `${name} hoạt động như bộ nhớ ngoài — capture mọi ý tưởng, tổ chức có hệ thống và tìm lại bất cứ thứ gì trong vài giây.`;
  }

  const toolLabel = isSheet ? "spreadsheet" : "template Notion";

  return {
    headline,
    subheadline,
    pains: [
      {
        icon: "⏰",
        title: "Tốn thời gian setup từ đầu",
        desc: `Mỗi lần muốn có hệ thống mới lại phải xây từ đầu. Mất nhiều giờ mày mò mà chưa chắc kết quả tốt như mong muốn.`,
      },
      {
        icon: "🔀",
        title: "Thông tin nằm rải rác khắp nơi",
        desc: `Nhiều app, nhiều file, không có cái nhìn tổng quan. Khi cần tìm lại một thứ là mất thời gian không cần thiết.`,
      },
      {
        icon: "📉",
        title: "Thiếu hệ thống nhất quán",
        desc: `Làm việc mỗi ngày một kiểu, không có quy trình chuẩn. Hiệu suất lên xuống thất thường và không biết cần cải thiện gì.`,
      },
      {
        icon: "😩",
        title: "Bắt đầu mãi không xong",
        desc: `Biết là cần có hệ thống nhưng không biết bắt đầu từ đâu. Cứ trì hoãn vì sợ làm sai rồi phải làm lại từ đầu.`,
      },
      {
        icon: "🔁",
        title: "Lặp lại công việc thủ công",
        desc: `Cùng một loại task nhưng mỗi lần lại phải làm lại từ đầu. Không có template chuẩn nên tốn thêm thời gian không cần thiết.`,
      },
      {
        icon: "📊",
        title: "Không theo dõi được tiến trình",
        desc: `Không biết mình đang tiến triển đến đâu. Thiếu dữ liệu để nhìn lại và cải thiện từng tuần.`,
      },
    ],
    solutionTitle: `${name} — hệ thống đã được thiết kế sẵn cho bạn`,
    solutionDesc: `Thay vì mày mò build từ đầu, bạn nhận ngay ${toolLabel} đã được tối ưu. Duplicate một lần, customize theo ý, dùng vĩnh viễn.`,
    solutionFormula: {
      a: `📋 ${categoryLabel} sẵn`,
      b: "⚡ Dùng ngay",
      result: "🎯 Hiệu suất tăng",
    },
    features: [
      { icon: "⚡", title: "Sẵn sàng trong 30 phút", desc: "Duplicate và điền thông tin cá nhân là xong, không cần setup." },
      { icon: "🎨", title: "Tùy chỉnh hoàn toàn", desc: "Thêm, xóa, sửa bất cứ phần nào theo nhu cầu của bạn." },
      { icon: "📱", title: "Hoạt động mọi thiết bị", desc: "Desktop, mobile, tablet — đồng bộ hoàn toàn, dùng mọi lúc mọi nơi." },
      { icon: "🔗", title: "Tích hợp đầy đủ tính năng", desc: `Tận dụng toàn bộ sức mạnh của ${categoryLabel} — không giới hạn.` },
      { icon: "♾️", title: "Cập nhật miễn phí", desc: "Nhận phiên bản cải tiến khi có — không cần trả thêm bất cứ thứ gì." },
      { icon: "🛡️", title: "Hỗ trợ tận tình", desc: "Gặp vấn đề? Liên hệ qua Zalo hoặc email — phản hồi trong ngày làm việc." },
    ],
    goals: [
      { icon: "⏱️", title: "Tiết kiệm hàng giờ mỗi tuần", desc: "Không còn mày mò setup hay xây lại từ đầu — tập trung 100% vào việc thực sự quan trọng." },
      { icon: "📈", title: "Tăng năng suất rõ rệt", desc: "Hệ thống có cấu trúc giúp bạn làm việc có trọng tâm, không bị phân tán hay bỏ sót." },
      { icon: "🧘", title: "Giảm stress, đầu óc nhẹ nhàng", desc: "Mọi thứ có chỗ cố định — không còn lo lắng quên hay bỏ sót điều quan trọng." },
      { icon: "🎯", title: "Nhìn rõ mục tiêu mỗi ngày", desc: `${categoryLabel} giúp bạn luôn biết mình cần làm gì tiếp theo và đang tiến triển đến đâu.` },
    ],
    testimonials: [
      {
        text: `Template chất lượng, thiết kế đẹp và dễ dùng. Sau khi duplicate mất khoảng 30 phút để customize là dùng được ngay. Rất đáng đồng tiền.`,
        name: "Minh Tuấn",
        role: "Product Manager · TP.HCM",
        avatar: "👨‍💼",
      },
      {
        text: `Mình đã thử tự build nhiều lần nhưng mất quá nhiều thời gian. Template này tiết kiệm cho mình hàng chục giờ setup và kết quả còn tốt hơn tự làm.`,
        name: "Thu Hương",
        role: "Freelancer · Hà Nội",
        avatar: "👩‍💻",
      },
      {
        text: `Đơn giản, dễ hiểu và hiệu quả. Hướng dẫn rõ ràng cho người mới. Dùng được ngay sau khi duplicate, không cần biết gì phức tạp.`,
        name: "Đức Anh",
        role: "Sinh viên · Đà Nẵng",
        avatar: "🧑‍🎓",
      },
    ],
    audience: [
      { icon: "💼", title: "Người đi làm bận rộn", desc: "Muốn có hệ thống tổ chức ngay mà không có thời gian tự build từ đầu." },
      { icon: "🧑‍💻", title: "Freelancer & Remote worker", desc: "Cần công cụ linh hoạt để quản lý nhiều dự án và khách hàng cùng lúc." },
      { icon: "🎓", title: "Sinh viên & Người học", desc: "Muốn học hiệu quả hơn với hệ thống ghi chú và lên kế hoạch khoa học." },
      { icon: "🚀", title: "Người mới bắt đầu", desc: `Chưa quen ${categoryLabel} nhưng muốn có hệ thống tốt ngay — không cần biết gì phức tạp.` },
    ],
    includes: [
      { title: "Template đầy đủ tính năng", desc: "Sẵn sàng dùng ngay sau khi duplicate" },
      { title: "Hướng dẫn setup chi tiết", desc: "Text step-by-step, dễ làm theo" },
      { title: `Tối ưu cho ${categoryLabel}`, desc: "Tận dụng tối đa tính năng platform" },
      { title: "Tùy chỉnh linh hoạt", desc: "Thêm bớt theo nhu cầu cá nhân" },
      { title: "Cập nhật miễn phí", desc: "Nhận phiên bản mới khi có cải tiến" },
    ],
    faqs: [
      {
        q: `Tôi cần tài khoản ${categoryLabel} không?`,
        a: isSheet
          ? "Cần tài khoản Google (miễn phí). Đăng nhập Google Drive và copy file về là xong."
          : "Cần tài khoản Notion miễn phí. Đăng ký tại notion.so — hoàn toàn miễn phí.",
      },
      {
        q: "Sau khi mua tôi nhận được gì?",
        a: isSheet
          ? "Link Google Sheets để copy về Google Drive của bạn. Dùng vĩnh viễn, thoải mái chỉnh sửa."
          : "Link Notion để duplicate về workspace của bạn. Dùng vĩnh viễn, thoải mái chỉnh sửa.",
      },
      {
        q: "Mất bao lâu để setup xong?",
        a: "Khoảng 15-30 phút để duplicate và điền thông tin cá nhân. Sau đó dùng được ngay.",
      },
      {
        q: "Có hỗ trợ nếu tôi gặp vấn đề không?",
        a: "Có. Liên hệ qua Zalo hoặc email để được hỗ trợ. Phản hồi trong ngày làm việc.",
      },
      {
        q: "Tôi có thể dùng trên điện thoại không?",
        a: isSheet
          ? "Được. Google Sheets có app mobile đầy đủ tính năng cho iOS và Android."
          : "Được. Notion có app iOS và Android. Capture ý tưởng trên điện thoại, xử lý chi tiết trên máy tính.",
      },
    ],
  };
}
