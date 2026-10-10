import { ScrapedNewsItem, CommunicationGapItem, SectorType, BuzzKeyword, SECTOR_NAMES } from '../types';

/**
 * Động cơ phát hiện Nguy cơ & Khoảng trống truyền thông (Media Vacuum & Communication Gap Engine)
 * Định nghĩa: Vấn đề A được dư luận, người dân, DN đặc biệt quan tâm nhưng chưa được cơ quan quản lý
 * thông tin đầy đủ, chưa giải thích chính sách, chưa được tư vấn cụ thể xem người dân, DN cần làm gì.
 */
export function detectCommunicationGaps(
  articles: ScrapedNewsItem[],
  trendingKeywords?: BuzzKeyword[]
): CommunicationGapItem[] {
  // Danh mục các chuyên đề thể chế, chính sách tài chính trọng điểm có nguy cơ xuất hiện khoảng trống thông tin
  const CANDIDATE_GAP_DOMAINS = [
    {
      id: 'gap_ecommerce_tax_guidance',
      topic: 'Quy định Kê khai & Nộp thuế Sàn Thương mại Điện tử (TMĐT) Xuyên biên giới & Hộ cá nhân bán hàng online',
      sector: 'tax' as SectorType,
      keywords: ['thuế tmđt', 'sàn tmđt', 'bán hàng online', 'shopee', 'tiktok shop', 'kê khai thuế', 'kinh doanh online', 'livestream'],
      publicInterestLevel: 'very_high' as const,
      buzzVolumeDesc: 'Dư luận, hàng triệu hộ kinh doanh và cá nhân bán hàng online đặc biệt quan tâm; số lượng tìm kiếm và thảo luận tăng đột biến.',
      gapDescription: 'Dư luận hoang mang về cách tính doanh thu chịu thuế khi bán hàng đa kênh, lo ngại bị truy thu thuế các năm trước, nhưng chưa có cẩm nang hướng dẫn thực tế dễ hiểu.',
      potentialRisks: [
        'Người nộp thuế hiểu lầm rằng cơ quan thuế tận thu, dẫn đến phản ứng tiêu cực trên mạng xã hội.',
        'Xuất hiện các dịch vụ "cò thuế", lừa đảo hướng dẫn né thuế hoặc thông tin sai lệch gây hoang mang.',
      ],
      whatPeopleNeedToKnow: [
        'Cá nhân, hộ kinh doanh có doanh thu trên 100 triệu đồng/năm thuộc diện phải nộp thuế GTGT và TNCN.',
        'Trách nhiệm của sàn TMĐT trong việc khấu trừ, nộp thuế thay và cung cấp dữ liệu theo Nghị định 126/Nghị định 91.',
        'Các bước tự tra cứu mã số thuế, đăng ký tài khoản thuế điện tử (eTax Mobile) và nộp tờ khai trực tuyến.',
      ],
      proactiveActionPlan: {
        recommendedCampaign: 'Chiến dịch truyền thông chủ động: "Đồng hành cùng Hộ kinh doanh & Cá nhân khởi nghiệp số"',
        leadUnit: 'Cục Thuế (Vụ Quản lý thuế Doanh nghiệp nhỏ và vừa, Hộ kinh doanh & Cá nhân)',
        tactics: [
          'Chủ động tăng cường loạt tin bài và infographic: "3 bước đơn giản kê khai thuế cho người bán hàng online" trên Cổng TTĐT Bộ và Thời báo Tài chính.',
          'Biên soạn bộ tài liệu "20 Câu hỏi - Đáp thực tế về nghĩa vụ thuế sàn TMĐT" phát hành rộng rãi trên mạng xã hội và kênh truyền thông của các sàn.',
          'Tổ chức chương trình Tọa đàm / Livestream trực tuyến giải đáp trực tiếp khúc mắc cho các hộ kinh doanh.',
        ],
        priorityLevel: 'Khẩn cấp' as const,
      },
    },
    {
      id: 'gap_non_prefunding_process',
      topic: 'Quy trình Giao dịch Không Ký quỹ 100% Tiền (Non-prefunding) cho Nhà đầu tư Tổ chức Nước ngoài',
      sector: 'stocks' as SectorType,
      keywords: ['non-prefunding', 'thông tư 68', 'tt68', 'ký quỹ', 'ctck', 'nâng hạng ftse', 'khối ngoại', 'lưu ký'],
      publicInterestLevel: 'high' as const,
      buzzVolumeDesc: 'Cộng đồng nhà đầu tư, các CTCK và tổ chức xếp hạng quốc tế (FTSE) theo dõi sát sao từng văn bản hướng dẫn.',
      gapDescription: 'Các thành viên thị trường cần hướng dẫn chi tiết về cơ chế quản trị rủi ro thanh toán khi nhà đầu tư ngoại không có đủ tiền tại ngày T+0, trách nhiệm bù trừ của CTCK.',
      potentialRisks: [
        'Các công ty chứng khoán vừa và nhỏ lúng túng trong triển khai hạ tầng kỹ thuật, làm chậm tiến độ nâng hạng TTCK.',
        'Nhà đầu tư ngoại e ngại rủi ro pháp lý và chi phí dự phòng rủi ro không rõ ràng.',
      ],
      whatPeopleNeedToKnow: [
        'Điều kiện để NĐT tổ chức nước ngoài được áp dụng cơ chế không ký quỹ 100% tiền theo Thông tư 68/2024/TT-BTC.',
        'Quy trình xử lý giao dịch mất khả năng thanh toán và trách nhiệm của CTCK nơi mở tài khoản.',
        'Lợi ích dài hạn của việc nâng hạng giúp thu hút hàng tỷ USD vốn ngoại gián tiếp vào nền kinh tế.',
      ],
      proactiveActionPlan: {
        recommendedCampaign: 'Chiến dịch: "Minh bạch Quy chuẩn Nâng hạng & Sẵn sàng Hạ tầng Thanh toán"',
        leadUnit: 'Ủy ban Chứng khoán Nhà nước (Vụ Phát triển Thị trường Chứng khoán / Vụ Quản lý Kinh doanh Chứng khoán)',
        tactics: [
          'Chủ động đăng tải các bài phân tích kỹ thuật của chuyên gia UBCKNN giải thích cơ chế Non-prefunding trên các báo tài chính quốc tế và trong nước.',
          'Ban hành Sổ tay Hướng dẫn nghiệp vụ dành riêng cho các CTCK và Ngân hàng lưu ký.',
          'Họp báo định kỳ thông tin về kết quả làm việc với FTSE Russell để củng cố niềm tin nhà đầu tư.',
        ],
        priorityLevel: 'Ưu tiên cao' as const,
      },
    },
    {
      id: 'gap_vat_2_reduction_scope',
      topic: 'Phạm vi & Cách tra cứu Hàng hóa, Dịch vụ được Giảm 2% Thuế VAT theo Nghị quyết của Quốc hội',
      sector: 'tax' as SectorType,
      keywords: ['giảm thuế 2%', 'thuế vat', 'nghị quyết quốc hội', 'nghị định 72', 'mã ngành', 'hóa đơn 8%', 'hàng hóa giảm thuế'],
      publicInterestLevel: 'very_high' as const,
      buzzVolumeDesc: 'Doanh nghiệp thương mại, dịch vụ, bán lẻ và kế toán viên liên tục tìm kiếm danh mục mã ngành giảm thuế.',
      gapDescription: 'Kế toán doanh nghiệp gặp khó khăn trong việc đối chiếu mã sản phẩm (HS code / Phụ lục Nghị định), lo ngại xuất hóa đơn 8% bị cơ quan thuế xử phạt truy thu nếu tra sai mã.',
      potentialRisks: [
        'Doanh nghiệp né tránh áp dụng chính sách giảm thuế vì sợ rủi ro sai sót, làm giảm hiệu quả kích cầu tiêu dùng của Chính phủ.',
        'Tranh chấp hóa đơn thương mại giữa bên mua và bên bán do không thống nhất mức thuế suất 8% hay 10%.',
      ],
      whatPeopleNeedToKnow: [
        'Các nhóm hàng hóa không được giảm thuế (Bất động sản, chứng khoán, bảo hiểm, viễn thông, khai khoáng, than...).',
        'Cách lập hóa đơn điện tử ghi rõ thuế suất 8% và cách xử lý khi đã lỡ xuất hóa đơn 10%.',
        'Quyền lợi của người tiêu dùng khi mua hàng hóa được giảm giá tương ứng với 2% thuế VAT.',
      ],
      proactiveActionPlan: {
        recommendedCampaign: 'Chiến dịch: "Đưa chính sách giảm thuế 2% vào cuộc sống & Tháo gỡ khó khăn cho Doanh nghiệp"',
        leadUnit: 'Cục Thuế (Vụ Chính sách Thuế & Cục Công nghệ Thông tin)',
        tactics: [
          'Chủ động phát hành công cụ tra cứu tự động mã ngành hàng được giảm thuế trên Trang thông tin điện tử Cục Thuế.',
          'Tăng cường tin bài hướng dẫn lập hóa đơn trên các diễn đàn kế toán, mạng xã hội và báo chí tài chính.',
          'Ban hành công văn chỉ đạo các Cục Thuế địa phương không xử phạt hành chính đối với các trường hợp sai sót vô ý trong giai đoạn đầu chuyển tiếp.',
        ],
        priorityLevel: 'Khẩn cấp' as const,
      },
    },
    {
      id: 'gap_corporate_bond_restructuring',
      topic: 'Hướng dẫn Pháp lý cho Trái chủ về Thỏa thuận Hoán đổi Tài sản & Gia hạn Trái phiếu theo Nghị định 08',
      sector: 'bonds' as SectorType,
      keywords: ['hoán đổi trái phiếu', 'nghị định 08', 'trái chủ', 'thỏa thuận hoán đổi', 'bất động sản', 'tpdn'],
      publicInterestLevel: 'high' as const,
      buzzVolumeDesc: 'Hàng chục nghìn nhà đầu tư cá nhân sở hữu TPDN đang tìm kiếm giải pháp bảo toàn vốn và thủ tục pháp lý.',
      gapDescription: 'Trái chủ cá nhân thiếu kiến thức pháp lý để đánh giá giá trị tài sản hoán đổi (căn hộ, đất nền), chưa rõ quy trình biểu quyết và quyền khiếu nại nếu doanh nghiệp bội tín.',
      potentialRisks: [
        'Trái chủ bị ép nhận tài sản hoán đổi với giá trị định giá khống, phát sinh khiếu nại kéo dài.',
        'Nguy cơ tụ tập đông người phản đối tại các trụ sở doanh nghiệp hoặc cơ quan nhà nước.',
      ],
      whatPeopleNeedToKnow: [
        'Thỏa thuận hoán đổi tài sản hoặc gia hạn nợ phải dựa trên nguyên tắc tự nguyện, có sự đồng thuận của hội nghị trái chủ.',
        'Trách nhiệm pháp lý của tổ chức bảo lãnh, đại lý quản lý tài sản bảo đảm và tổ chức tư vấn phát hành.',
        'Kênh tiếp nhận phản ánh, khiếu nại của UBCKNN và cơ quan thanh tra tài chính.',
      ],
      proactiveActionPlan: {
        recommendedCampaign: 'Chiến dịch: "Bảo vệ quyền lợi hợp pháp của Trái chủ & Lành mạnh hóa Thị trường Trái phiếu"',
        leadUnit: 'Cục Quản lý Nợ & Tài chính Đối ngoại / Vụ Tài chính Ngân hàng / UBCKNN',
        tactics: [
          'Chủ động đăng tải các bài viết tham vấn pháp lý độc lập từ các luật sư uy tín hướng dẫn trái chủ các bước thẩm định hồ sơ.',
          'Yêu cầu các tổ chức phát hành công khai thông tin định giá tài sản độc lập khi đề xuất hoán đổi.',
          'Tăng cường các bài viết cảnh báo các rủi ro pháp lý cần tránh trong hợp đồng hoán đổi nợ.',
        ],
        priorityLevel: 'Ưu tiên cao' as const,
      },
    },
    {
      id: 'gap_global_minimum_tax_rules',
      topic: 'Cơ chế Thực thi Thuế Tối thiểu Toàn cầu (GMT) & Chính sách Ưu đãi Hỗ trợ Đầu tư Bổ sung',
      sector: 'fdi' as SectorType,
      keywords: ['thuế tối thiểu toàn cầu', 'gmt', '15%', 'fdi', 'quỹ hỗ trợ đầu tư', 'tập đoàn đa quốc gia'],
      publicInterestLevel: 'medium' as const,
      buzzVolumeDesc: 'Các tập đoàn FDI quy mô lớn (Samsung, LG, Intel, Foxconn) và hiệp hội doanh nghiệp nước ngoài đặc biệt quan tâm.',
      gapDescription: 'Doanh nghiệp FDI cần lộ trình chi tiết về cách tính thuế thu nhập doanh nghiệp bổ sung và cơ chế tiếp cận Quỹ hỗ trợ đầu tư để bù đắp chi phí tuân thủ.',
      potentialRisks: [
        'Các tập đoàn FDI đa quốc gia tạm hoãn quyết định mở rộng quy mô vốn đầu tư do chưa rõ chính sách hỗ trợ bổ sung.',
        'Việt Nam mất lợi thế cạnh tranh thu hút dòng vốn bán dẫn, công nghệ cao so với các nước trong khu vực (Ấn Độ, Indonesia, Malaysia).',
      ],
      whatPeopleNeedToKnow: [
        'Tiêu chí áp dụng mức thuế tối thiểu 15% cho các tập đoàn có doanh thu hợp nhất từ 750 triệu EUR trở lên.',
        'Hồ sơ, thủ tục kê khai tờ khai thông tin và nộp thuế bổ sung theo chuẩn OECD.',
        'Các chính sách hỗ trợ đầu tư về chi phí nghiên cứu phát triển (R&D), đào tạo nhân lực và hạ tầng công nghệ cao.',
      ],
      proactiveActionPlan: {
        recommendedCampaign: 'Chiến dịch: "Giữ vững Môi trường Đầu tư Hấp dẫn & Hiện đại hóa Hệ thống Thuế Quốc tế"',
        leadUnit: 'Vụ Chính sách Thuế / Cục Thuế / Cục Tài chính Doanh nghiệp',
        tactics: [
          'Chủ động tổ chức Hội nghị Đối thoại song phương và đa phương với các Hiệp hội Doanh nghiệp AmCham, EuroCham, KoCham, JBIC.',
          'Xuất bản tài liệu hướng dẫn song ngữ (Việt - Anh) về quy chế khai nộp thuế GMT và tiếp cận quỹ hỗ trợ đầu tư.',
          'Tăng cường tin bài trên báo chí đối ngoại khẳng định cam kết của Chính phủ Việt Nam trong việc đồng hành cùng nhà đầu tư chiến lược.',
        ],
        priorityLevel: 'Trung hạn' as const,
      },
    },
  ];

  const detectedGaps: CommunicationGapItem[] = [];
  const scannedArticleTitles = articles.map((a) => `${a.title} ${a.summary}`).join(' ').toLowerCase();

  CANDIDATE_GAP_DOMAINS.forEach((domain) => {
    // Đếm số lượng bài viết quét được liên quan đến chủ đề này
    const relatedArticles = articles.filter((art) => {
      const text = `${art.title} ${art.summary} ${(art.keyPoints || []).join(' ')}`.toLowerCase();
      return domain.keywords.some((kw) => text.includes(kw.toLowerCase())) || art.sector === domain.sector;
    });

    // Kiểm tra xem đã có bài viết mang tính "HƯỚNG DẪN / GIẢI THÍCH / FAQ" cụ thể chưa
    const hasPracticalGuidanceArticle = relatedArticles.some((art) => {
      const text = art.title.toLowerCase();
      return text.includes('hướng dẫn') || text.includes('cẩm nang') || text.includes('hỏi đáp') || text.includes('faq') || text.includes('chi tiết');
    });

    // Nếu chủ đề có độ quan tâm cao mà chưa có bài viết hướng dẫn thực tế chi tiết -> Xác nhận là Khoảng trống truyền thông!
    if (!hasPracticalGuidanceArticle || relatedArticles.length > 0) {
      detectedGaps.push({
        id: domain.id,
        topic: domain.topic,
        sector: domain.sector,
        sectorNameVi: SECTOR_NAMES[domain.sector] || 'Trọng điểm Tài chính',
        publicInterestLevel: domain.publicInterestLevel,
        buzzVolumeDesc: domain.buzzVolumeDesc,
        gapDescription: domain.gapDescription,
        potentialRisks: domain.potentialRisks,
        whatPeopleNeedToKnow: domain.whatPeopleNeedToKnow,
        proactiveActionPlan: domain.proactiveActionPlan,
        relatedArticles: relatedArticles.slice(0, 3),
      });
    }
  });

  return detectedGaps;
}
