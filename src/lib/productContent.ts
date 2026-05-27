export interface PainItem    { icon: string; title: string; desc: string; }
export interface FeatureItem { icon: string; title: string; desc: string; }
export interface TestiItem   { text: string; name: string; role: string; avatar: string; }
export interface IncludeItem { title: string; desc: string; }
export interface FaqItem     { q: string; a: string; }

export interface ProductCopy {
  headline: string;
  subheadline: string;
  pains: PainItem[];
  solutionTitle: string;
  solutionDesc: string;
  solutionFormula: { a: string; b: string; result: string };
  features: FeatureItem[];
  testimonials: TestiItem[];
  includes: IncludeItem[];
  faqs: FaqItem[];
}

const CONTENT: Record<string, ProductCopy> = {
  "Notion Second Brain": {
    headline: "Đầu óc đang chứa quá nhiều thứ — và vẫn sợ quên điều quan trọng?",
    subheadline: "Hệ thống lưu trữ và xử lý thông tin cá nhân trên Notion — mọi ý tưởng, ghi chú và tài liệu đều có chỗ, không bao giờ thất lạc.",
    pains: [
      { icon: "🧠", title: "Phải nhớ quá nhiều thứ trong đầu", desc: "Meeting, deadline, idea, task — tất cả đang nằm trong đầu bạn. Mỗi sáng thức dậy là lo sợ mình đang bỏ quên điều gì đó quan trọng." },
      { icon: "📁", title: "Tài liệu nằm rải rác khắp nơi", desc: "Google Drive, email, Telegram, Notes app... Khi cần tìm lại một thứ, bạn mất 10 phút chỉ để nhớ nó đang ở đâu." },
      { icon: "💡", title: "Ý tưởng hay loé lên rồi biến mất", desc: "Bạn nghĩ ra một ý tưởng tuyệt vời lúc đang tắm. Không ghi lại kịp. Một tiếng sau — không còn nhớ gì nữa." },
    ],
    solutionTitle: "Một nơi duy nhất cho mọi thứ trong cuộc sống của bạn",
    solutionDesc: "Second Brain hoạt động như một bộ nhớ ngoài — thu nhận mọi thông tin, tổ chức có hệ thống và đưa đúng thứ bạn cần đúng lúc bạn cần.",
    solutionFormula: { a: "📥 Capture nhanh", b: "🗂️ Hệ thống PARA", result: "🧠 Không bao giờ quên" },
    features: [
      { icon: "📥", title: "Quick Capture Inbox", desc: "Ghi mọi ý tưởng trong vài giây, xử lý sau — không để thứ gì lọt qua." },
      { icon: "🗂️", title: "Cấu trúc PARA", desc: "Projects, Areas, Resources, Archive — framework đã được chứng minh bởi hàng triệu người." },
      { icon: "📚", title: "Thư viện tài liệu", desc: "Lưu bài viết, sách, podcast với highlight và ghi chú cá nhân." },
      { icon: "🔗", title: "Liên kết ý tưởng", desc: "Kết nối các ghi chú với nhau, tạo ra insight mà bạn không ngờ tới." },
      { icon: "📊", title: "Dashboard cá nhân", desc: "Tổng quan toàn bộ dự án, task và mục tiêu đang chạy." },
      { icon: "🔍", title: "Tìm kiếm tức thì", desc: "Tag thông minh, tìm lại bất cứ thứ gì trong vài giây." },
    ],
    testimonials: [
      { text: "Trước đây tôi dùng 5-6 app để ghi chú. Sau khi dùng template này, mọi thứ về một chỗ. Không bao giờ bỏ lỡ một ý tưởng hay deadline nào nữa.", name: "Minh Tuấn", role: "Product Manager · HCM", avatar: "👨‍💼" },
      { text: "Setup mất khoảng 45 phút. Sau đó hệ thống chạy cực smooth. Tôi giờ không còn cảm giác stress vì quá nhiều thứ cần nhớ nữa.", name: "Thu Hương", role: "Content Creator", avatar: "👩‍💻" },
      { text: "Second Brain thực sự thay đổi cách tôi làm việc. Focus hơn hẳn vì biết mọi thứ đã được ghi lại đúng chỗ.", name: "Đức Anh", role: "Startup Founder", avatar: "🧑‍🚀" },
    ],
    includes: [
      { title: "Dashboard tổng quan", desc: "Nhìn vào là biết toàn bộ hệ thống" },
      { title: "Quick Capture Inbox", desc: "Ghi chú nhanh, xử lý sau" },
      { title: "Project Tracker", desc: "Theo dõi mọi dự án đang chạy" },
      { title: "Thư viện tài liệu & Reading List", desc: "Lưu bài viết, sách, podcast" },
      { title: "Daily Journal template", desc: "Ghi chú ngày có cấu trúc sẵn" },
      { title: "Hướng dẫn setup từng bước", desc: "Video + text, dễ làm theo" },
    ],
    faqs: [
      { q: "Template có phù hợp với người mới dùng Notion không?", a: "Hoàn toàn phù hợp. Template có chú thích rõ ràng ở từng phần, kèm hướng dẫn setup chi tiết cho người mới bắt đầu." },
      { q: "Mất bao lâu để setup xong?", a: "Khoảng 30–60 phút để duplicate và điền thông tin cá nhân. Sau đó bạn dùng được ngay." },
      { q: "Sau khi mua tôi nhận được gì?", a: "Link Notion để duplicate về workspace của bạn. Template là của bạn vĩnh viễn — thoải mái chỉnh sửa theo ý muốn." },
      { q: "Có thể dùng trên điện thoại không?", a: "Được. Notion có app iOS và Android. Bạn capture ý tưởng trên điện thoại, xử lý chi tiết trên máy tính." },
    ],
  },

  "Google Sheets Budget Tracker": {
    headline: "Tháng nào cũng hết tiền mà không biết mình đã tiêu vào đâu?",
    subheadline: "Spreadsheet theo dõi thu chi tự động — nhìn vào là biết ngay tiền đi đâu, tiết kiệm được bao nhiêu, còn bao xa đến mục tiêu.",
    pains: [
      { icon: "💸", title: "Hết tiền cuối tháng mà không rõ lý do", desc: "Lương vừa về tuần trước, giờ nhìn tài khoản đã gần trống. Bạn biết mình tiêu nhiều nhưng không biết tiêu vào cái gì." },
      { icon: "📝", title: "Ghi chép thủ công quá mệt mỏi", desc: "Thử ghi sổ tay, thử dùng app — nhưng sau 1 tuần bỏ cuộc vì quá tốn công. Kết quả là không có dữ liệu nào để nhìn lại." },
      { icon: "🎯", title: "Không có mục tiêu tài chính rõ ràng", desc: "Bạn muốn tiết kiệm mua xe, du lịch hay quỹ dự phòng nhưng không biết mỗi tháng cần để ra bao nhiêu." },
    ],
    solutionTitle: "Nhìn vào một chỗ — hiểu ngay tài chính của mình",
    solutionDesc: "Budget Tracker tự động tổng hợp thu chi, tính toán tỉ lệ tiết kiệm và cảnh báo khi sắp vượt ngân sách — chỉ cần nhập số liệu, mọi thứ còn lại đã có công thức lo.",
    solutionFormula: { a: "📋 Nhập thu chi", b: "⚡ Công thức tự động", result: "📊 Hiểu tài chính" },
    features: [
      { icon: "📊", title: "Dashboard tháng", desc: "Thu nhập, chi tiêu, tiết kiệm — tổng quan tức thì." },
      { icon: "🏷️", title: "15+ danh mục sẵn", desc: "Ăn uống, đi lại, giải trí, hoá đơn... phân loại rõ ràng." },
      { icon: "📈", title: "Biểu đồ xu hướng", desc: "Chart theo tuần và tháng, thấy ngay khoản nào đang tăng." },
      { icon: "🎯", title: "Ngân sách từng mục", desc: "Đặt giới hạn và nhận cảnh báo màu đỏ khi gần vượt." },
      { icon: "💰", title: "Theo dõi mục tiêu", desc: "Thanh tiến trình cho từng quỹ tiết kiệm — mua xe, du lịch, khẩn cấp." },
      { icon: "📅", title: "So sánh theo tháng", desc: "Thấy ngay tháng này tốt hơn hay tệ hơn tháng trước." },
    ],
    testimonials: [
      { text: "Sau 3 tháng dùng, tôi tiết kiệm thêm được 3 triệu mỗi tháng chỉ bằng cách cắt những khoản không cần thiết mà trước đây không để ý.", name: "Lan Anh", role: "Marketing Executive", avatar: "👩‍💼" },
      { text: "Đơn giản và hiệu quả. 5 phút mỗi tối để cập nhật, cuối tháng có báo cáo đầy đủ. Không cần biết gì về Excel hay Google Sheets.", name: "Thanh Bình", role: "Kỹ sư phần mềm", avatar: "👨‍💻" },
    ],
    includes: [
      { title: "Dashboard tháng", desc: "Tổng quan thu nhập, chi tiêu, tiết kiệm" },
      { title: "Nhật ký giao dịch", desc: "Ghi chép chi tiết từng khoản chi" },
      { title: "Ngân sách theo danh mục", desc: "15+ danh mục chi tiêu có sẵn" },
      { title: "Tracker mục tiêu tài chính", desc: "Tiến trình tiết kiệm trực quan" },
      { title: "Báo cáo so sánh tháng", desc: "Xem xu hướng chi tiêu theo thời gian" },
      { title: "Hướng dẫn trong file", desc: "Tab hướng dẫn giải thích từng cột" },
    ],
    faqs: [
      { q: "Tôi cần biết Google Sheets không?", a: "Không cần. Chỉ cần biết nhập số. Mọi công thức, biểu đồ đã được setup sẵn — bạn chỉ điền dữ liệu vào là xong." },
      { q: "Có thể thêm danh mục mới không?", a: "Được hoàn toàn. File là của bạn sau khi copy, thoải mái thêm bớt danh mục theo nhu cầu cá nhân." },
      { q: "Dữ liệu có an toàn không?", a: "Dữ liệu lưu trên Google Drive của bạn, chỉ bạn mới truy cập được. Chúng tôi không thể xem dữ liệu của bạn." },
      { q: "Có dùng được trên điện thoại không?", a: "Được. Google Sheets có app mobile đầy đủ tính năng, nhập liệu mọi lúc mọi nơi." },
    ],
  },

  "Notion Habit Tracker": {
    headline: "Quyết tâm xây dựng thói quen — nhưng bỏ cuộc sau tuần đầu tiên?",
    subheadline: "Hệ thống theo dõi thói quen trực quan với heatmap, streak và thống kê — biến việc xây dựng thói quen từ ý chí thành dữ liệu.",
    pains: [
      { icon: "🔄", title: "Bắt đầu hăng hái, bỏ cuộc sau 1 tuần", desc: "Bạn đã thử dậy sớm, tập thể dục, đọc sách... Mỗi lần đều hứa hẹn lắm. Nhưng không có hệ thống nào giúp bạn duy trì qua giai đoạn khó khăn nhất." },
      { icon: "📉", title: "Không thấy được tiến trình của mình", desc: "Bỏ lỡ 1 ngày rồi thấy như đã thất bại hoàn toàn, mất động lực để tiếp tục. Không có con số nào cho bạn thấy bạn đã đi được bao xa." },
      { icon: "🗓️", title: "Theo dõi thủ công quá phiền phức", desc: "Dùng app tick-tick rồi lại bỏ. Dùng sổ tay viết rồi quên. Không có công cụ nào vừa dễ dùng vừa cho thấy bức tranh toàn cảnh." },
    ],
    solutionTitle: "Theo dõi thói quen như một vận động viên theo dõi thành tích",
    solutionDesc: "Habit Tracker biến mỗi ngày thực hiện thành một điểm dữ liệu — heatmap, streak, tỉ lệ hoàn thành theo tuần/tháng. Khi thấy streak dài, bạn sẽ không nỡ phá vỡ nó.",
    solutionFormula: { a: "✅ Check-in hàng ngày", b: "📊 Dữ liệu trực quan", result: "🔥 Streak bền vững" },
    features: [
      { icon: "🔥", title: "Streak counter", desc: "Đếm chuỗi ngày liên tiếp — động lực mạnh nhất để không bỏ cuộc." },
      { icon: "🗓️", title: "Heatmap tháng", desc: "Nhìn toàn bộ tháng một lúc, thấy ngay ngày nào còn trống." },
      { icon: "📊", title: "Thống kê tuần/tháng", desc: "Tỉ lệ hoàn thành, xu hướng và so sánh giữa các tuần." },
      { icon: "🏷️", title: "Phân nhóm thói quen", desc: "Sức khoẻ, học tập, tinh thần — theo dõi từng nhóm riêng biệt." },
      { icon: "⏰", title: "Gợi nhớ tích hợp", desc: "Reminder tích hợp sẵn trong Notion để không bỏ quên." },
      { icon: "🎯", title: "Đặt mục tiêu tháng", desc: "Cam kết số ngày mục tiêu, theo dõi tiến trình rõ ràng." },
    ],
    testimonials: [
      { text: "Nhờ cái streak này tôi đã duy trì được 90 ngày đọc sách liên tiếp. Trước đây nhiều nhất chỉ được 2 tuần. Nhìn số đếm tăng lên mỗi ngày là không nỡ bỏ.", name: "Phương Linh", role: "Sinh viên đại học", avatar: "👩‍🎓" },
      { text: "Heatmap mới là thứ tôi cần. Nhìn cả tháng một lúc mà thấy nhiều ô trống là tự ngượng với bản thân, tự nhiên có động lực hơn hẳn.", name: "Hoàng Nam", role: "Freelance Designer", avatar: "👨‍🎨" },
    ],
    includes: [
      { title: "Dashboard thói quen tháng", desc: "Heatmap và thống kê tổng quan" },
      { title: "Streak counter tự động", desc: "Đếm chuỗi ngày liên tiếp" },
      { title: "Tracker theo tuần", desc: "Check-in nhanh, xem lại tổng kết tuần" },
      { title: "Phân nhóm thói quen", desc: "Sức khoẻ, học tập, tinh thần, công việc" },
      { title: "Template review tháng", desc: "Nhìn lại và điều chỉnh mục tiêu" },
      { title: "Hướng dẫn trong template", desc: "Cách dùng hiệu quả nhất" },
    ],
    faqs: [
      { q: "Theo dõi được bao nhiêu thói quen cùng lúc?", a: "Không giới hạn. Bạn có thể thêm bao nhiêu thói quen tuỳ thích. Nhưng khuyến nghị bắt đầu với 3-5 thói quen để dễ duy trì." },
      { q: "Mỗi ngày mất bao lâu để cập nhật?", a: "Khoảng 1-2 phút. Chỉ cần tick vào ô của ngày hôm đó là xong." },
      { q: "Template có tự động tính streak không?", a: "Có. Streak và tỉ lệ hoàn thành được tính tự động bằng formula Notion — bạn không cần làm gì thêm." },
      { q: "Tôi có thể thêm thói quen mới sau khi đã dùng một thời gian không?", a: "Được hoàn toàn. Thêm thói quen mới bất cứ lúc nào mà không ảnh hưởng đến dữ liệu cũ." },
    ],
  },

  "Notion Project Manager": {
    headline: "Deadline chồng chéo — bạn đang quản lý dự án hay đang bị dự án quản lý?",
    subheadline: "Hệ thống quản lý dự án Kanban + Timeline trên Notion — nhìn vào là biết mọi thứ đang ở đâu, ai làm gì, deadline còn bao lâu.",
    pains: [
      { icon: "🌀", title: "Không biết dự án đang ở đâu trong tiến trình", desc: "Có chục task đang chạy song song. Bạn không có cái nhìn tổng quan để biết cái nào quan trọng hơn, cái nào đang bị block." },
      { icon: "📅", title: "Deadline bị bỏ lỡ vì không ai theo dõi", desc: "Giao task qua chat, nhắc nhở qua chat — không ai nhìn thấy bức tranh toàn cảnh nên deadline cứ trượt mà không ai biết trước." },
      { icon: "🔀", title: "Thông tin dự án nằm rải rác khắp nơi", desc: "Brief trong email, cập nhật trong Slack, file trong Drive. Khi cần tìm lại quyết định đã đưa ra 2 tuần trước — mất cả buổi sáng." },
    ],
    solutionTitle: "Mọi dự án trong tầm nhìn — mọi lúc, mọi nơi",
    solutionDesc: "Project Manager tích hợp Kanban board, Timeline và task list trong một workspace duy nhất. Nhìn vào Dashboard là biết ngay toàn bộ portfolio đang ở trạng thái gì.",
    solutionFormula: { a: "📋 Kanban Board", b: "📅 Timeline View", result: "🎯 Deliver đúng hạn" },
    features: [
      { icon: "📋", title: "Kanban Board", desc: "Kéo thả task qua các cột — To Do, In Progress, Review, Done." },
      { icon: "📅", title: "Timeline / Gantt", desc: "Xem toàn bộ timeline dự án, phát hiện xung đột deadline sớm." },
      { icon: "👥", title: "Phân công task", desc: "Gán người phụ trách, priority và deadline cho từng task." },
      { icon: "📊", title: "Dashboard portfolio", desc: "Tổng quan tất cả dự án đang chạy trong một trang." },
      { icon: "🔗", title: "Liên kết tài nguyên", desc: "Đính kèm brief, file, note trực tiếp vào task." },
      { icon: "⚡", title: "Template task nhanh", desc: "Tạo task mới trong 10 giây với template có sẵn." },
    ],
    testimonials: [
      { text: "Từ khi dùng template này, team tôi không còn tình trạng 'tưởng ai đó lo rồi' nữa. Mọi thứ rõ ràng, ai làm gì, đến bao giờ — nhìn vào là biết.", name: "Quang Huy", role: "Project Manager · Agency", avatar: "👨‍💼" },
      { text: "Tôi quản lý 3 dự án song song một mình. Template này giúp tôi không bị overwhelmed — mỗi sáng mở ra là biết hôm nay cần làm gì đầu tiên.", name: "Bảo Ngọc", role: "Freelance PM", avatar: "👩‍💼" },
    ],
    includes: [
      { title: "Portfolio Dashboard", desc: "Tổng quan tất cả dự án" },
      { title: "Kanban Board template", desc: "To Do → In Progress → Done" },
      { title: "Timeline / Gantt view", desc: "Lịch trình trực quan theo thời gian" },
      { title: "Task database chi tiết", desc: "Priority, deadline, assignee, status" },
      { title: "Meeting Notes template", desc: "Ghi chép họp với action items" },
      { title: "Hướng dẫn adapt cho team", desc: "Dùng solo hoặc collaborative" },
    ],
    faqs: [
      { q: "Template này phù hợp cho cá nhân hay team?", a: "Cả hai. Dùng solo để quản lý nhiều dự án cá nhân, hoặc share workspace cho team dưới 5 người (Notion free plan cho phép)." },
      { q: "Có thể kết nối với công cụ khác không?", a: "Notion có thể embed Google Docs, Figma, GitHub và nhiều tool khác trực tiếp vào trang. Template đã có sẵn vị trí cho các embed này." },
      { q: "Nếu tôi đang dùng Trello / Jira, chuyển sang có khó không?", a: "Không khó. Template có cấu trúc tương tự Trello nhưng linh hoạt hơn nhiều. Kèm hướng dẫn migrate data từ Trello sang." },
      { q: "Template có phù hợp với dự án sáng tạo không?", a: "Rất phù hợp. Dùng cho thiết kế, viết lách, marketing campaign... Template đủ linh hoạt để adapt cho bất kỳ loại dự án nào." },
    ],
  },

  "Notion Reading List": {
    headline: "Đọc xong 2 tuần sau không nhớ gì — như chưa từng đọc?",
    subheadline: "Hệ thống đọc sách thông minh — lưu highlight, ghi chú cá nhân và ôn lại kiến thức đúng lúc để nhớ lâu hơn.",
    pains: [
      { icon: "📚", title: "Đọc nhiều nhưng nhớ rất ít", desc: "Bạn đọc cuốn sách xong, cảm thấy rất hay. Hai tuần sau hỏi lại — không nhớ được gì đáng kể. Thời gian đọc gần như bị lãng phí." },
      { icon: "📖", title: "Highlight nhưng không bao giờ xem lại", desc: "Kindle highlight, ghi chú trong sách, tab sticky notes — đầy rẫy nhưng chưa bao giờ thực sự ngồi xem lại và nghiền ngẫm." },
      { icon: "🗂️", title: "Không biết mình đã đọc gì, đang đọc gì", desc: "Danh sách 'muốn đọc' ngày càng dài nhưng bạn không nhớ mình đã thực sự đọc được cuốn nào, đang đọc dở cuốn nào." },
    ],
    solutionTitle: "Đọc ít hơn nhưng nhớ nhiều hơn — bằng hệ thống ghi chú đúng cách",
    solutionDesc: "Reading List tích hợp việc theo dõi sách với ghi chú có cấu trúc — summary, key ideas, quote yêu thích và action items. Kiến thức được lọc qua ngôn ngữ của bạn, não bộ sẽ nhớ lâu hơn.",
    solutionFormula: { a: "📖 Đọc có chủ đích", b: "✍️ Ghi chú có cấu trúc", result: "🧠 Nhớ lâu, áp dụng được" },
    features: [
      { icon: "📚", title: "Thư viện sách cá nhân", desc: "Danh sách đang đọc, đã đọc, muốn đọc — đầy đủ thông tin." },
      { icon: "✍️", title: "Template ghi chú sách", desc: "Summary, key ideas, quotes, action items — cấu trúc sẵn." },
      { icon: "⭐", title: "Rating & Review", desc: "Đánh giá và ghi lại cảm nhận cá nhân sau mỗi cuốn." },
      { icon: "🏷️", title: "Tag theo chủ đề", desc: "Gắn tag để tìm lại kiến thức theo chủ đề khi cần." },
      { icon: "📊", title: "Thống kê đọc sách", desc: "Số sách đọc theo tháng, tổng trang, danh mục yêu thích." },
      { icon: "🔗", title: "Liên kết kiến thức", desc: "Kết nối ý tưởng giữa các cuốn sách khác nhau." },
    ],
    testimonials: [
      { text: "Tôi đọc sách nhiều năm nhưng không nhớ được gì. Sau khi dùng template này để ghi chú có hệ thống, kiến thức thực sự được internalize vào mình.", name: "Khánh Linh", role: "Giáo viên IELTS", avatar: "👩‍🏫" },
      { text: "Nhờ có thư viện đọc sách này, tôi có thể tìm lại quote hay ý tưởng từ sách đọc 2 năm trước trong vài giây. Như có một trợ lý cá nhân vậy.", name: "Trọng Đạt", role: "Blogger công nghệ", avatar: "👨‍💻" },
    ],
    includes: [
      { title: "Thư viện sách cá nhân", desc: "Đang đọc, đã đọc, muốn đọc" },
      { title: "Template ghi chú sách", desc: "Summary, insights, quotes, actions" },
      { title: "Reading tracker theo tháng", desc: "Thống kê tiến độ đọc sách" },
      { title: "Bảng tag kiến thức", desc: "Phân loại theo chủ đề, áp dụng" },
      { title: "Book review template", desc: "Rating và cảm nhận cá nhân" },
      { title: "Hướng dẫn ghi chú hiệu quả", desc: "Method Progressive Summarization" },
    ],
    faqs: [
      { q: "Template có phù hợp với sách tiếng Anh không?", a: "Hoàn toàn phù hợp. Template dùng được cho sách bất kỳ ngôn ngữ nào — tiếng Việt, Anh, Nhật..." },
      { q: "Tôi có thể import highlight từ Kindle không?", a: "Có thể làm thủ công bằng cách copy-paste. Template có sẵn section cho Kindle highlights." },
      { q: "Template có phù hợp cho audiobook và podcast không?", a: "Có. Template đủ linh hoạt cho sách giấy, ebook, audiobook và podcast — đều có trường ghi chú phù hợp." },
      { q: "Có giới hạn số sách có thể theo dõi không?", a: "Không giới hạn. Notion free plan không giới hạn số lượng record trong database." },
    ],
  },

  "Notion Content Calendar": {
    headline: "Deadline đăng bài đến rồi vẫn đang ngồi chờ ý tưởng?",
    subheadline: "Hệ thống lên kế hoạch nội dung cho mọi nền tảng — idea bank, lịch đăng bài và theo dõi trạng thái sản xuất trong một workspace.",
    pains: [
      { icon: "⏰", title: "Luôn trong trạng thái 'deadline đến rồi mà chưa có gì'", desc: "Bạn biết hôm nay cần đăng bài nhưng chưa chuẩn bị gì. Cuối cùng đăng vội, chất lượng không như mong muốn." },
      { icon: "💭", title: "Ý tưởng đến bất chợt rồi biến mất", desc: "Lúc tắm, lúc đi xe nghĩ ra ý tưởng hay. Nhưng không có chỗ lưu ngay, đến khi cần thì không nhớ được." },
      { icon: "🔀", title: "Quản lý nhiều nền tảng cùng lúc rất rối", desc: "Instagram, TikTok, YouTube, Blog — mỗi nơi một lịch riêng, một format riêng. Không có cái nhìn tổng quan nào cho cả tháng." },
    ],
    solutionTitle: "Lên kế hoạch 1 tháng trong 1 buổi chiều",
    solutionDesc: "Content Calendar tích hợp idea bank, lịch biên tập và trạng thái sản xuất. Mỗi đầu tháng ngồi lên kế hoạch một lần — cả tháng còn lại chỉ cần execute.",
    solutionFormula: { a: "💡 Idea Bank", b: "📅 Lịch biên tập", result: "🚀 Đăng đều đặn" },
    features: [
      { icon: "💡", title: "Idea Bank", desc: "Capture ý tưởng bất cứ lúc nào, không để thứ gì rơi mất." },
      { icon: "📅", title: "Calendar view", desc: "Nhìn toàn tháng, thấy ngay ngày nào còn trống." },
      { icon: "🔄", title: "Trạng thái sản xuất", desc: "Idea → Script → Draft → Review → Published — từng bước rõ ràng." },
      { icon: "📱", title: "Multi-platform", desc: "Instagram, YouTube, TikTok, Blog — tất cả trong một chỗ." },
      { icon: "♻️", title: "Repurpose content", desc: "Tag nội dung để repurpose sang nhiều format khác nhau." },
      { icon: "📊", title: "Analytics ghi chú", desc: "Ghi lại performance để biết content nào hiệu quả nhất." },
    ],
    testimonials: [
      { text: "Từ khi dùng Content Calendar, tôi đăng đều đặn hơn hẳn. Không còn tình trạng stress vì deadline đăng bài nữa — mọi thứ đã được lên kế hoạch từ đầu tháng.", name: "Ngọc Mai", role: "Content Creator · 50k followers", avatar: "👩‍🎤" },
      { text: "Idea bank mới là thứ tôi cần nhất. Giờ mỗi khi nghĩ ra gì hay là ghi ngay, đến cuối tuần ngồi xử lý một lần — không mất đi ý tưởng nào nữa.", name: "Văn Tùng", role: "YouTube creator", avatar: "🎬" },
    ],
    includes: [
      { title: "Content Calendar tháng", desc: "Calendar view cho tất cả nền tảng" },
      { title: "Idea Bank database", desc: "Capture và phân loại ý tưởng" },
      { title: "Content production tracker", desc: "Theo dõi từng bước sản xuất" },
      { title: "Template brief nội dung", desc: "Cấu trúc cho từng loại content" },
      { title: "Performance notes", desc: "Ghi nhận kết quả để học hỏi" },
      { title: "Batch planning template", desc: "Lên kế hoạch cả tháng hiệu quả" },
    ],
    faqs: [
      { q: "Template phù hợp cho loại content nào?", a: "Phù hợp cho tất cả — blog, social media, YouTube, podcast, newsletter. Có thể customize columns theo loại content của bạn." },
      { q: "Có thể dùng cho team content không?", a: "Được. Share workspace Notion cho các thành viên, phân công content theo người và theo dõi tiến trình." },
      { q: "Tôi chỉ làm 1 nền tảng thôi, template có quá phức tạp không?", a: "Không. Chỉ dùng những gì bạn cần. Template đủ đơn giản cho 1 nền tảng nhưng cũng scale được khi bạn mở rộng." },
      { q: "Có thể kết nối với lịch Google Calendar không?", a: "Notion có thể embed Google Calendar. Template có hướng dẫn cách sync để nhìn lịch ở một chỗ duy nhất." },
    ],
  },

  "Notion Job Hunt Tracker": {
    headline: "Apply hàng chục nơi nhưng không biết mình đang ở đâu trong pipeline?",
    subheadline: "Hệ thống theo dõi hành trình tìm việc — từng công ty, từng vòng phỏng vấn, từng deadline, tất cả trong một nơi.",
    pains: [
      { icon: "📨", title: "Apply nhiều nơi mà quên mất hầu hết", desc: "Bạn nộp CV cho 20 công ty. Khi HR gọi điện hỏi về 'vị trí đã apply', bạn không nhớ mình đã apply cái gì ở công ty đó." },
      { icon: "📞", title: "Bỏ lỡ deadline và follow-up quan trọng", desc: "Sau mỗi buổi phỏng vấn, bạn có gửi email cảm ơn không? Sau 1 tuần không có phản hồi, bạn có follow-up lại không? Không có hệ thống thì rất dễ bỏ quên." },
      { icon: "😓", title: "Không biết mình đang tệ ở đâu", desc: "Reject ở vòng CV hay vòng phỏng vấn? Vòng nào tỉ lệ pass cao? Không có dữ liệu thì không biết cần cải thiện gì." },
    ],
    solutionTitle: "Tìm việc như một dự án — có hệ thống, có dữ liệu, có chiến lược",
    solutionDesc: "Job Hunt Tracker biến quá trình tìm việc thành một pipeline rõ ràng. Biết mọi thứ: ai đang xem xét hồ sơ, ai cần follow-up, vòng nào cần chuẩn bị gì.",
    solutionFormula: { a: "📋 Track mọi application", b: "📊 Phân tích pipeline", result: "🎯 Offer trong tầm tay" },
    features: [
      { icon: "🏢", title: "Database công ty target", desc: "Thông tin công ty, văn hóa, review từ Glassdoor." },
      { icon: "📋", title: "Application pipeline", desc: "Applied → Screening → Interview → Offer — từng bước rõ ràng." },
      { icon: "📅", title: "Deadline tracker", desc: "Deadline nộp, follow-up, ngày phỏng vấn — không bỏ sót." },
      { icon: "📝", title: "Interview prep notes", desc: "Ghi chú chuẩn bị cho từng vòng phỏng vấn." },
      { icon: "📊", title: "Thống kê pipeline", desc: "Tỉ lệ pass từng vòng — biết mình cần cải thiện ở đâu." },
      { icon: "✉️", title: "Template email follow-up", desc: "Email cảm ơn và follow-up chuyên nghiệp có sẵn." },
    ],
    testimonials: [
      { text: "Nhờ track được tỉ lệ pass từng vòng, tôi phát hiện CV của mình đang pass 80% nhưng phỏng vấn chỉ pass 20%. Tập trung luyện phỏng vấn và nhận offer sau 3 tuần.", name: "Hải Đăng", role: "Software Engineer", avatar: "👨‍💻" },
      { text: "Apply 30 nơi trong 2 tháng mà không bị lộn xộn gì hết. Biết rõ từng công ty đang ở đâu, cần follow-up chỗ nào. Nhận được 4 offer để lựa chọn.", name: "Thảo Vy", role: "Marketing Manager", avatar: "👩‍💼" },
    ],
    includes: [
      { title: "Company research database", desc: "Thông tin và ghi chú về từng công ty" },
      { title: "Application pipeline tracker", desc: "Kanban board theo từng vòng" },
      { title: "Interview prep template", desc: "Chuẩn bị câu hỏi và câu trả lời" },
      { title: "Deadline calendar", desc: "Follow-up và ngày phỏng vấn" },
      { title: "Thống kê tìm việc", desc: "Tỉ lệ pass từng vòng" },
      { title: "Email templates", desc: "Cảm ơn, follow-up, accept/reject offer" },
    ],
    faqs: [
      { q: "Template phù hợp cho loại công việc nào?", a: "Phù hợp cho bất kỳ ngành nghề nào — tech, marketing, tài chính, thiết kế... Cấu trúc pipeline apply ở đâu cũng giống nhau." },
      { q: "Có thể track nhiều loại cơ hội cùng lúc không?", a: "Được. Bạn có thể track full-time, part-time, freelance và internship trong cùng một database với filter riêng." },
      { q: "Tôi chưa biết dùng Notion, có dùng được không?", a: "Được. Template kèm hướng dẫn chi tiết cho người mới. Dùng 30 phút là quen ngay." },
      { q: "Có thể share cho mentor hoặc career coach không?", a: "Được. Share link Notion với quyền view để mentor theo dõi và cho feedback trên quá trình tìm việc của bạn." },
    ],
  },

  "Notion Freelance CRM": {
    headline: "Làm freelance mà quản lý client bằng chat history và ghi chú tay?",
    subheadline: "CRM đơn giản dành cho freelancer — theo dõi client, project, invoice và doanh thu trong một workspace, không cần phần mềm phức tạp.",
    pains: [
      { icon: "💬", title: "Client info nằm rải rác trong chat", desc: "Brief trong Messenger, yêu cầu sửa trong email, deadline trong Zalo. Khi cần tổng hợp lại cho 1 project — mất cả buổi sáng để đọc lại." },
      { icon: "💰", title: "Không biết mình đang kiếm được bao nhiêu", desc: "Nhiều project chạy song song nhưng không biết tổng doanh thu tháng, ai chưa trả tiền, dự án nào profitable nhất." },
      { icon: "🔄", title: "Quên follow-up dẫn đến mất client tiềm năng", desc: "Lead mới liên hệ, bạn báo giá rồi... quên mất. 2 tuần sau họ đã chọn người khác. Không có hệ thống follow-up nên cứ mất cơ hội." },
    ],
    solutionTitle: "Chạy freelance như một business thực sự — có hệ thống, có dữ liệu",
    solutionDesc: "Freelance CRM tập trung mọi thứ về client và project vào một chỗ. Biết ngay ai cần follow-up, project nào đến deadline, tổng doanh thu tháng này là bao nhiêu.",
    solutionFormula: { a: "👥 Client database", b: "💼 Project tracker", result: "💰 Kiểm soát doanh thu" },
    features: [
      { icon: "👥", title: "Client database", desc: "Hồ sơ từng client với lịch sử làm việc và ghi chú." },
      { icon: "💼", title: "Project pipeline", desc: "Lead → Negotiation → In Progress → Done — toàn bộ lifecycle." },
      { icon: "🧾", title: "Invoice tracker", desc: "Theo dõi invoices, đã thanh toán, còn nợ — không bỏ sót." },
      { icon: "💰", title: "Revenue dashboard", desc: "Doanh thu theo tháng, theo client, theo loại project." },
      { icon: "📅", title: "Deadline management", desc: "Tất cả deadline client trong một calendar." },
      { icon: "📝", title: "Proposal templates", desc: "Template báo giá chuyên nghiệp, tái sử dụng nhanh." },
    ],
    testimonials: [
      { text: "Trước đây tôi không biết tháng này kiếm được bao nhiêu cho đến khi ngồi tổng kết cuối tháng. Giờ nhìn vào dashboard là biết ngay real-time.", name: "Anh Khoa", role: "Freelance Designer · 5 năm kinh nghiệm", avatar: "👨‍🎨" },
      { text: "Phần invoice tracker một mình nó đã đáng giá rồi. Không bao giờ quên follow-up client chưa thanh toán nữa. Dòng tiền ổn định hơn hẳn.", name: "Thu Nga", role: "Freelance Copywriter", avatar: "✍️" },
    ],
    includes: [
      { title: "Client database", desc: "Hồ sơ client với lịch sử đầy đủ" },
      { title: "Project pipeline CRM", desc: "Từ lead đến completed project" },
      { title: "Invoice & payment tracker", desc: "Theo dõi thanh toán, nhắc nhở tự động" },
      { title: "Revenue dashboard", desc: "Doanh thu theo tháng và theo client" },
      { title: "Proposal template", desc: "Báo giá chuyên nghiệp có sẵn" },
      { title: "Contract checklist", desc: "Những điều cần có trong hợp đồng" },
    ],
    faqs: [
      { q: "Template phù hợp cho freelancer ở lĩnh vực nào?", a: "Phù hợp cho mọi lĩnh vực freelance — design, dev, writing, marketing, tư vấn... Có thể tùy chỉnh columns theo ngành của bạn." },
      { q: "Tôi có vài chục client, template có handle được không?", a: "Được hoàn toàn. Notion database không giới hạn số lượng record. Có thể filter, sort và search client bất cứ lúc nào." },
      { q: "Có thể share cho accountant xem doanh thu không?", a: "Có thể share view-only link cho accountant. Họ thấy được số liệu mà không chỉnh sửa được data của bạn." },
      { q: "Template có thể export ra Excel không?", a: "Được. Notion cho phép export database ra CSV, dễ dàng mở bằng Excel hay Google Sheets khi cần báo cáo." },
    ],
  },

  "Notion Study Planner": {
    headline: "Ôn thi đến khuya nhưng vẫn không tự tin khi bước vào phòng thi?",
    subheadline: "Hệ thống học tập có kế hoạch — chia nhỏ syllabus, lên lịch ôn tập theo Pomodoro và theo dõi tiến trình từng môn học.",
    pains: [
      { icon: "😰", title: "Học nhiều nhưng không biết học đủ chưa", desc: "Ôn thi mà không có kế hoạch — cứ học random, phần nào thấy dễ học thêm, phần khó thì né. Đến ngày thi mới phát hiện có mảng kiến thức chưa chạm đến." },
      { icon: "⏳", title: "Không quản lý được thời gian ôn tập", desc: "Mở sách ra định học 2 tiếng, mất 30 phút scroll điện thoại, học 45 phút mệt rồi nghỉ. Không có cấu trúc thì không học được hiệu quả." },
      { icon: "📉", title: "Học xong rồi quên — cứ phải ôn lại từ đầu", desc: "Ôn phần A xong chuyển qua B, quay lại A đã quên gần hết. Không có lịch ôn tập spaced repetition thì công sức học như đổ vào cái thùng rỗng." },
    ],
    solutionTitle: "Học ít hơn, nhớ nhiều hơn — bằng kế hoạch khoa học",
    solutionDesc: "Study Planner chia nhỏ syllabus thành các session Pomodoro, lên lịch ôn tập spaced repetition và track tiến trình từng môn. Bạn luôn biết cần học gì tiếp theo.",
    solutionFormula: { a: "📅 Kế hoạch chi tiết", b: "⏱️ Pomodoro sessions", result: "🎯 Vào thi tự tin" },
    features: [
      { icon: "📚", title: "Syllabus breakdown", desc: "Chia nhỏ toàn bộ chương trình thành các unit học được." },
      { icon: "⏱️", title: "Pomodoro tracker", desc: "Log session học, thống kê giờ học theo ngày/tuần." },
      { icon: "📅", title: "Lịch ôn tập", desc: "Calendar lên lịch ôn tập spaced repetition từng môn." },
      { icon: "📊", title: "Tiến trình từng môn", desc: "% hoàn thành, điểm mạnh yếu, cần ôn thêm phần nào." },
      { icon: "📝", title: "Ghi chú bài học", desc: "Template ghi chú có cấu trúc — concept, ví dụ, câu hỏi." },
      { icon: "🎯", title: "Goal tracker", desc: "Mục tiêu điểm số, đếm ngược đến ngày thi." },
    ],
    testimonials: [
      { text: "Lần đầu dùng Study Planner để ôn IELTS, điểm tôi tăng từ 6.0 lên 7.5 chỉ trong 3 tháng. Bí quyết là có kế hoạch rõ ràng và biết mình đang ở đâu.", name: "Minh Châu", role: "Du học sinh", avatar: "👩‍🎓" },
      { text: "Pomodoro tracker và lịch ôn tập là hai tính năng tôi dùng nhất. Giờ tôi học 4 tiếng hiệu quả hơn trước học 8 tiếng mà không có kế hoạch.", name: "Quốc Bảo", role: "Sinh viên Y khoa", avatar: "👨‍🎓" },
    ],
    includes: [
      { title: "Syllabus planner", desc: "Breakdown toàn bộ chương trình học" },
      { title: "Pomodoro tracker", desc: "Log session và thống kê giờ học" },
      { title: "Lịch ôn tập spaced repetition", desc: "Calendar tự động theo lịch ôn" },
      { title: "Ghi chú bài học có cấu trúc", desc: "Template theo Cornell method" },
      { title: "Dashboard tiến trình tổng quan", desc: "% hoàn thành từng môn học" },
      { title: "Đếm ngược ngày thi", desc: "Motivation và time management" },
    ],
    faqs: [
      { q: "Template phù hợp cho kỳ thi nào?", a: "Phù hợp cho mọi kỳ thi — đại học, chứng chỉ (IELTS, TOEIC, CPA), thi công chức, hay bất kỳ môn học nào cần ôn tập có hệ thống." },
      { q: "Phương pháp Pomodoro là gì?", a: "Học 25 phút, nghỉ 5 phút — lặp lại 4 lần rồi nghỉ dài 15-30 phút. Đã được nghiên cứu chứng minh giúp tập trung tốt hơn và tránh kiệt sức." },
      { q: "Tôi có nhiều môn học cùng lúc, template handle được không?", a: "Được. Có thể tạo section riêng cho từng môn, lên kế hoạch và track tiến trình độc lập." },
      { q: "Template có thể dùng cho việc học online course không?", a: "Hoàn toàn phù hợp cho online course, self-study hay bất kỳ hình thức học nào ngoài trường học truyền thống." },
    ],
  },

  "Notion Personal Finance": {
    headline: "Thu nhập tăng nhưng tài khoản vẫn gần trống vào cuối tháng?",
    subheadline: "Hệ thống quản lý tài chính cá nhân toàn diện — thu nhập, chi tiêu, đầu tư và mục tiêu tài chính trong một dashboard duy nhất.",
    pains: [
      { icon: "📈", title: "Thu nhập tăng nhưng không tích luỹ được", desc: "Bạn kiếm được nhiều hơn 2 năm trước nhưng tài khoản không dày hơn là bao. Tiền tăng lên đâu mà không thấy." },
      { icon: "🎯", title: "Không có kế hoạch tài chính dài hạn", desc: "Bạn muốn mua nhà trong 5 năm, muốn có quỹ hưu trí, muốn du lịch nước ngoài — nhưng không biết mỗi tháng cần để ra bao nhiêu để đạt được." },
      { icon: "😰", title: "Không có quỹ khẩn cấp khiến luôn bị động", desc: "Một khoản phát sinh bất ngờ — sửa xe, chi phí y tế — và tài chính đảo lộn hoàn toàn. Không có quỹ dự phòng là sống trong trạng thái dễ bị tổn thương." },
    ],
    solutionTitle: "Kiểm soát tài chính như CFO của cuộc sống mình",
    solutionDesc: "Personal Finance không chỉ track chi tiêu — nó giúp bạn xây dựng hệ thống phân bổ thu nhập, đặt mục tiêu tài chính có thời hạn và theo dõi danh mục đầu tư.",
    solutionFormula: { a: "📊 Track thu chi", b: "🎯 Kế hoạch tài chính", result: "💎 Tự do tài chính" },
    features: [
      { icon: "📊", title: "Net worth tracker", desc: "Tài sản trừ nợ — con số quan trọng nhất về tài chính." },
      { icon: "💰", title: "Phân bổ thu nhập", desc: "Quy tắc 50/30/20 hay custom — phân bổ tự động." },
      { icon: "🎯", title: "Mục tiêu tài chính", desc: "Quỹ khẩn cấp, mua nhà, hưu trí — tiến trình rõ ràng." },
      { icon: "📈", title: "Theo dõi đầu tư", desc: "Chứng khoán, gửi tiết kiệm, bất động sản — tổng quan danh mục." },
      { icon: "💳", title: "Debt tracker", desc: "Theo dõi và lên kế hoạch trả nợ hiệu quả." },
      { icon: "📅", title: "Lịch chi phí cố định", desc: "Tiền nhà, điện nước, subscription — không bao giờ quên." },
    ],
    testimonials: [
      { text: "Sau 6 tháng dùng Personal Finance, lần đầu tiên trong đời tôi có quỹ khẩn cấp đủ 6 tháng chi phí sinh hoạt. Ngủ yên giấc hơn hẳn.", name: "Gia Hân", role: "Kế toán · 32 tuổi", avatar: "👩‍💼" },
      { text: "Net worth tracker là công cụ thay đổi tư duy của tôi. Nhìn con số tăng lên mỗi tháng tạo ra động lực tiết kiệm và đầu tư rất mạnh.", name: "Bảo Long", role: "Software Developer", avatar: "👨‍💻" },
    ],
    includes: [
      { title: "Net worth dashboard", desc: "Tài sản ròng theo thời gian" },
      { title: "Monthly budget tracker", desc: "Thu chi theo quy tắc 50/30/20" },
      { title: "Financial goals tracker", desc: "Mục tiêu ngắn và dài hạn" },
      { title: "Investment portfolio", desc: "Theo dõi danh mục đầu tư" },
      { title: "Debt payoff planner", desc: "Kế hoạch trả nợ snowball/avalanche" },
      { title: "Recurring expenses calendar", desc: "Chi phí cố định hàng tháng" },
    ],
    faqs: [
      { q: "Template phù hợp cho người mới bắt đầu quản lý tài chính không?", a: "Rất phù hợp. Template kèm hướng dẫn về các khái niệm cơ bản như quỹ khẩn cấp, quy tắc 50/30/20 và cách bắt đầu." },
      { q: "Tôi có thu nhập không ổn định (freelance), template có handle được không?", a: "Được. Có section riêng cho thu nhập biến động, giúp bạn tính trung bình và lập kế hoạch dựa trên thu nhập tháng thấp nhất." },
      { q: "Template có tích hợp với app ngân hàng không?", a: "Chưa có tích hợp trực tiếp — bạn cần nhập thủ công. Nhiều người dùng dành 10 phút mỗi tuần để cập nhật một lần." },
      { q: "Dữ liệu tài chính có an toàn trên Notion không?", a: "Notion mã hoá dữ liệu và có bảo mật 2 lớp (2FA). Bạn cũng có thể dùng Notion offline để tăng bảo mật." },
    ],
  },

  "Notion Travel Planner": {
    headline: "Lên kế hoạch du lịch mà cứ sợ quên mất điều gì đó quan trọng?",
    subheadline: "Hệ thống lên kế hoạch du lịch toàn diện — lịch trình từng ngày, checklist đồ đạc, ngân sách và ghi chú địa điểm, tất cả trong một chỗ.",
    pains: [
      { icon: "🧳", title: "Luôn quên đồ quan trọng khi đi du lịch", desc: "Đến nơi mới nhớ ra quên sạc dự phòng, quên đặt khách sạn ngày cuối, quên check visa requirements. Những sự cố nhỏ phá hỏng cả chuyến đi." },
      { icon: "💸", title: "Chi tiêu vượt ngân sách mà không biết sao", desc: "Đặt kế hoạch budget 10 triệu nhưng về nhà check lại đã tiêu 15 triệu. Không track thời gian thực nên không kịp điều chỉnh." },
      { icon: "😵", title: "Lịch trình rối, không tận dụng được thời gian", desc: "Đến nơi mới không biết đi đâu trước, đi đâu sau. Cuối cùng lại đi đúng chỗ mà sáng hôm trước vừa đi qua mà không ghé." },
    ],
    solutionTitle: "Chuẩn bị kỹ, đi nhẹ đầu — tận hưởng chuyến đi 100%",
    solutionDesc: "Travel Planner tổ chức toàn bộ chuyến đi từ khi lên kế hoạch đến khi về nhà. Lịch trình rõ ràng, checklist đầy đủ, ngân sách trong tầm kiểm soát.",
    solutionFormula: { a: "📋 Chuẩn bị kỹ", b: "🗺️ Lịch trình chi tiết", result: "✈️ Chuyến đi hoàn hảo" },
    features: [
      { icon: "🗓️", title: "Lịch trình từng ngày", desc: "Timeline chi tiết từng buổi sáng tối, di chuyển, ăn uống." },
      { icon: "🧳", title: "Checklist packing", desc: "Danh sách đồ cần mang — không bao giờ quên thứ quan trọng." },
      { icon: "💰", title: "Budget tracker thời gian thực", desc: "Nhập chi phí ngay lúc phát sinh, biết còn lại bao nhiêu." },
      { icon: "🏨", title: "Accommodation log", desc: "Địa chỉ, check-in/out, booking confirmation số." },
      { icon: "📍", title: "Database địa điểm", desc: "Nhà hàng, điểm tham quan với ghi chú và link." },
      { icon: "📝", title: "Travel journal", desc: "Ghi lại kỷ niệm và cảm xúc trong chuyến đi." },
    ],
    testimonials: [
      { text: "Lần đầu đi solo trip dài ngày, template này giúp tôi chuẩn bị kỹ đến mức không có gì bất ngờ xảy ra cả. Từ visa, tiêm chủng đến backup plan đều có checklist sẵn.", name: "Thanh Trúc", role: "Solo traveler · 12 quốc gia", avatar: "🌏" },
      { text: "Budget tracker là thứ tôi cần nhất. Trước đây đi về xong mới biết tiêu bao nhiêu. Giờ nhập real-time, điều chỉnh được ngay khi thấy đang vượt kế hoạch.", name: "Hùng Anh", role: "Photographer", avatar: "📷" },
    ],
    includes: [
      { title: "Trip overview dashboard", desc: "Thông tin tổng quan chuyến đi" },
      { title: "Lịch trình từng ngày", desc: "Timeline chi tiết theo giờ" },
      { title: "Packing checklist", desc: "80+ items phân theo danh mục" },
      { title: "Budget tracker", desc: "Ngân sách và chi tiêu thực tế" },
      { title: "Accommodation & transport log", desc: "Booking confirmations tập trung" },
      { title: "Travel journal template", desc: "Ghi lại kỷ niệm chuyến đi" },
    ],
    faqs: [
      { q: "Template phù hợp cho chuyến đi bao nhiêu ngày?", a: "Phù hợp từ weekend trip 2 ngày đến round-the-world trip nhiều tháng. Cấu trúc ngày có thể scale tuỳ ý." },
      { q: "Có thể dùng offline khi đang đi không?", a: "Được. Notion có chế độ offline, sync lại khi có mạng. Rất tiện khi ở nơi mạng kém." },
      { q: "Template phù hợp cho nhóm đi cùng nhau không?", a: "Được. Share workspace, phân công nhau research và cùng edit lịch trình. Mọi người đều có thể xem và cập nhật real-time." },
      { q: "Có thể share lịch trình với người thân không?", a: "Được. Share link view-only cho gia đình để họ biết bạn đang ở đâu và kế hoạch của bạn." },
    ],
  },

  "Notion Goal Setting OKR": {
    headline: "Đặt mục tiêu đầu năm — cuối năm không nhớ mình đã đặt những gì?",
    subheadline: "Hệ thống OKR cá nhân trên Notion — đặt mục tiêu có cấu trúc, chia nhỏ Key Results, review hàng tuần và đo lường tiến độ bằng số.",
    pains: [
      { icon: "🎯", title: "Mục tiêu mơ hồ, không đo lường được", desc: "'Muốn khoẻ hơn', 'muốn giàu hơn', 'muốn học tiếng Anh' — những mục tiêu này không có cách nào biết đã đạt được chưa." },
      { icon: "📉", title: "Đặt mục tiêu xong rồi quên luôn", desc: "Tháng 1 viết mục tiêu cả năm. Tháng 3 không còn nhớ đã viết gì. Không có hệ thống review thì mục tiêu chỉ là lời hứa với bản thân." },
      { icon: "🌀", title: "Bận rộn nhiều nhưng không tiến đến mục tiêu", desc: "Làm việc cả ngày nhưng cuối tuần nhìn lại không thấy mình đã tiến đến đâu. Busy ≠ Productive — không có alignment thì nỗ lực bị phân tán." },
    ],
    solutionTitle: "Mục tiêu rõ ràng, tiến độ đo được, review đều đặn",
    solutionDesc: "OKR (Objectives & Key Results) là framework đặt mục tiêu của Google và các công ty lớn. Template này adapt cho cá nhân — đủ đơn giản để dùng một mình, đủ mạnh để thay đổi cuộc sống.",
    solutionFormula: { a: "🎯 Objective rõ ràng", b: "📊 Key Results đo được", result: "🚀 Đạt mục tiêu" },
    features: [
      { icon: "🎯", title: "Objective setting", desc: "Đặt mục tiêu theo quý với mô tả rõ ràng tại sao." },
      { icon: "📊", title: "Key Results tracking", desc: "3-5 metrics đo lường cho mỗi Objective — tiến độ bằng số." },
      { icon: "📅", title: "Weekly review", desc: "Check-in hàng tuần — đang on track hay cần điều chỉnh." },
      { icon: "🔗", title: "Liên kết daily tasks", desc: "Kết nối task hàng ngày với Key Results — mọi hành động đều có ý nghĩa." },
      { icon: "📈", title: "Progress visualization", desc: "Progress bar từng Objective — nhìn vào là thấy ngay." },
      { icon: "🗂️", title: "OKR history", desc: "Lưu lại OKR các quý để nhìn lại hành trình phát triển." },
    ],
    testimonials: [
      { text: "Dùng OKR template được 2 năm, tôi đã đạt được 3 trong số những mục tiêu mà trước đây cứ đặt rồi quên: học được tiếng Nhật N3, chạy half marathon và tiết kiệm đủ 6 tháng lương.", name: "Minh Triết", role: "Business Analyst", avatar: "👨‍💼" },
      { text: "Weekly review mới là phần thay đổi tôi nhiều nhất. Ngồi 15 phút mỗi Chủ nhật để nhìn lại — tự mình thấy rõ tuần nào focus, tuần nào bị phân tán.", name: "Yến Nhi", role: "Product Designer", avatar: "👩‍🎨" },
    ],
    includes: [
      { title: "Annual & Quarterly OKR board", desc: "Mục tiêu năm chia theo quý" },
      { title: "Key Results tracker", desc: "Metrics và tiến độ theo số" },
      { title: "Weekly review template", desc: "Check-in 15 phút mỗi tuần" },
      { title: "Daily task alignment", desc: "Kết nối task ngày với OKR" },
      { title: "Progress dashboard", desc: "Tổng quan tiến độ tất cả Objectives" },
      { title: "OKR archive", desc: "Lịch sử mục tiêu theo quý/năm" },
    ],
    faqs: [
      { q: "OKR là gì? Tôi chưa biết gì về phương pháp này.", a: "OKR = Objectives & Key Results. Objective là 'muốn đạt được gì', Key Results là 'bằng chứng đo lường được'. Template kèm hướng dẫn đầy đủ về phương pháp." },
      { q: "Nên đặt bao nhiêu Objective mỗi quý?", a: "Khuyến nghị 3-5 Objectives, mỗi Objective có 3 Key Results. Ít hơn để tập trung, đừng cố làm quá nhiều." },
      { q: "Template có phù hợp cho cả mục tiêu công việc lẫn cá nhân không?", a: "Có. Thực ra OKR hoạt động tốt nhất khi cover cả hai. Template có section cho Work OKRs và Personal OKRs riêng biệt." },
      { q: "Nếu giữa quý thấy Objective không còn phù hợp, có thể điều chỉnh không?", a: "Được. OKR không phải là cam kết cứng nhắc. Có thể update mid-quarter nếu hoàn cảnh thay đổi. Template có trường ghi chú lý do điều chỉnh." },
    ],
  },
};

export function getProductCopy(productName: string): ProductCopy {
  return CONTENT[productName] ?? getFallback();
}

function getFallback(): ProductCopy {
  return {
    headline: "Template giúp bạn làm việc thông minh hơn, không phải nhiều hơn",
    subheadline: "Hệ thống Notion được thiết kế sẵn — duplicate về workspace và dùng ngay, không cần setup từ đầu.",
    pains: [
      { icon: "⏰", title: "Tốn quá nhiều thời gian setup", desc: "Mỗi lần muốn có hệ thống mới lại phải ngồi build từ đầu. Mất nhiều giờ mà chưa chắc kết quả tốt." },
      { icon: "🔀", title: "Thông tin nằm rải rác khắp nơi", desc: "Nhiều app, nhiều file, nhiều chỗ. Không có cái nhìn tổng quan nào cho những gì đang diễn ra." },
      { icon: "📉", title: "Thiếu hệ thống nhất quán", desc: "Mỗi ngày làm khác nhau, không có quy trình chuẩn. Hiệu suất lên xuống thất thường." },
    ],
    solutionTitle: "Hệ thống đã được thiết kế sẵn — bạn chỉ cần dùng",
    solutionDesc: "Template này tổng hợp best practices từ hàng nghìn người dùng Notion. Bạn nhận được hệ thống đã được chứng minh, không cần mày mò từ đầu.",
    solutionFormula: { a: "📋 Template sẵn", b: "⚡ Dùng ngay", result: "🎯 Hiệu suất tăng" },
    features: [
      { icon: "⚡", title: "Dùng ngay sau 30 phút", desc: "Duplicate và điền thông tin cá nhân là xong." },
      { icon: "🎨", title: "Tùy chỉnh hoàn toàn", desc: "Thêm, xóa, sửa bất cứ phần nào theo ý muốn." },
      { icon: "📱", title: "Hoạt động mọi thiết bị", desc: "Desktop, mobile, tablet — đồng bộ hoàn toàn." },
      { icon: "🔗", title: "Tích hợp Notion đầy đủ", desc: "Dùng được tất cả tính năng Notion — database, formula, filter." },
    ],
    testimonials: [
      { text: "Template chất lượng, thiết kế đẹp và dễ dùng. Sau khi duplicate, mất khoảng 30 phút để customize và dùng được ngay.", name: "Người dùng", role: "Verified purchase", avatar: "👤" },
    ],
    includes: [
      { title: "Template đầy đủ tính năng", desc: "Sẵn sàng dùng ngay" },
      { title: "Hướng dẫn setup chi tiết", desc: "Video + text step by step" },
      { title: "Cập nhật miễn phí", desc: "Nhận bản cập nhật khi có phiên bản mới" },
    ],
    faqs: [
      { q: "Tôi cần tài khoản Notion không?", a: "Cần tài khoản Notion miễn phí. Đăng ký tại notion.so." },
      { q: "Sau khi mua tôi nhận được gì?", a: "Link Notion để duplicate về workspace của bạn. Dùng vĩnh viễn." },
      { q: "Có hỗ trợ nếu tôi gặp vấn đề không?", a: "Có. Liên hệ qua email hoặc Zalo để được hỗ trợ." },
    ],
  };
}
