import express from 'express';
import fs from 'fs';
import path from 'path';

export type ExpertStance = 'SUPPORT' | 'CRITIQUE' | 'WARNING' | 'NEUTRAL';
export type ExpertSpeakerType = 'EXPERT' | 'ORGANIZATION';

export interface ServerExpertOpinion {
  id: string;
  articleId?: string;
  articleTitle: string;
  articleUrl?: string;
  source: string;
  publishedAt: string | number;
  speakerName: string;
  speakerRole: string;
  speakerType: ExpertSpeakerType;
  organizationName?: string;
  opinionSummary: string;
  stance: ExpertStance;
  policyArea: string;
  isWatchlist: boolean; // ⭐ Mục đáng lưu tâm
  mentionCount: number; // Tần suất nhận định
  statementQuote?: string;
  manualWatchlistOverride?: boolean;
  createdAt: string;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'expert_opinions_db.json');

// Well-known influencer dictionary for automated entity extraction in Vietnamese financial policy
export const KNOWN_INFLUENCERS: Array<{
  name: string;
  patterns: RegExp[];
  role: string;
  type: ExpertSpeakerType;
  org: string;
  defaultPolicy: string;
}> = [
  {
    name: 'GS. Đặng Hùng Võ',
    patterns: [/Đặng Hùng Võ/i, /GS\.?\s*Đặng Hùng Võ/i, /GS\.TS\.?\s*Đặng Hùng Võ/i],
    role: 'Nguyên Thứ trưởng Bộ TN&MT, Chuyên gia Kinh tế Đất đai',
    type: 'EXPERT',
    org: 'Bộ Tài nguyên và Môi trường',
    defaultPolicy: 'Chính sách Thuế & Quản lý Đất đai'
  },
  {
    name: 'TS. Cấn Văn Lực',
    patterns: [/Cấn Văn Lực/i, /TS\.?\s*Cấn Văn Lực/i],
    role: 'Chuyên gia Kinh tế trưởng BIDV, Thành viên Hội đồng TVCSTT Quốc gia',
    type: 'EXPERT',
    org: 'Hội đồng Tư vấn Chính sách Tiền tệ Quốc gia',
    defaultPolicy: 'Thị trường Tài chính & Trái phiếu'
  },
  {
    name: 'TS. Lê Đăng Doanh',
    patterns: [/Lê Đăng Doanh/i, /TS\.?\s*Lê Đăng Doanh/i],
    role: 'Nguyên Viện trưởng Viện Nghiên cứu Quản lý Kinh tế TW (CIEM)',
    type: 'EXPERT',
    org: 'Viện CIEM',
    defaultPolicy: 'Cải cách Thể chế & Doanh nghiệp'
  },
  {
    name: 'PGS.TS. Đinh Trọng Thịnh',
    patterns: [/Đinh Trọng Thịnh/i, /PGS\.?\s*(?:TS\.?)?\s*Đinh Trọng Thịnh/i],
    role: 'Chuyên gia Kinh tế cao cấp, Giảng viên Học viện Tài chính',
    type: 'EXPERT',
    org: 'Học viện Tài chính (BTC)',
    defaultPolicy: 'Quản lý Giá & Kiềm chế Lạm phát'
  },
  {
    name: 'TS. Nguyễn Trí Hiếu',
    patterns: [/Nguyễn Trí Hiếu/i, /TS\.?\s*Nguyễn Trí Hiếu/i],
    role: 'Chuyên gia Tài chính - Ngân hàng độc lập',
    type: 'EXPERT',
    org: 'Chuyên gia Độc lập',
    defaultPolicy: 'Tín dụng & Thị trường Vốn'
  },
  {
    name: 'GS. Trần Thọ Đạt',
    patterns: [/Trần Thọ Đạt/i, /GS\.?\s*(?:TS\.?)?\s*Trần Thọ Đạt/i],
    role: 'Chủ tịch Hội đồng Khoa học ĐH KTQD, Thành viên Tổ TVKT của Thủ tướng',
    type: 'EXPERT',
    org: 'Đại học Kinh tế Quốc dân',
    defaultPolicy: 'Kinh tế Vĩ mô & Ngân sách'
  },
  {
    name: 'TS. Vũ Đình Ánh',
    patterns: [/Vũ Đình Ánh/i, /TS\.?\s*Vũ Đình Ánh/i],
    role: 'Nguyên Phó Viện trưởng Viện Nghiên cứu Khoa học Thị trường Giá cả',
    type: 'EXPERT',
    org: 'Viện Nghiên cứu Thị trường Giá cả (BTC)',
    defaultPolicy: 'Thuế & Ngân sách Nhà nước'
  },
  {
    name: 'VCCI (Liên đoàn Thương mại và Công nghiệp VN)',
    patterns: [/\bVCCI\b/i, /Liên đoàn Thương mại và Công nghiệp/i],
    role: 'Tổ chức đại diện cộng đồng doanh nghiệp và nhà tuyển dụng',
    type: 'ORGANIZATION',
    org: 'VCCI',
    defaultPolicy: 'Cải cách Thủ tục Thuế & Hải quan'
  },
  {
    name: 'HoREA (Hiệp hội Bất động sản TP.HCM)',
    patterns: [/\bHoREA\b/i, /Hiệp hội Bất động sản TP\.?HCM/i, /Lê Hoàng Châu/i],
    role: 'Tổ chức đại diện các doanh nghiệp kinh doanh bất động sản',
    type: 'ORGANIZATION',
    org: 'Hiệp hội BĐS TP.HCM',
    defaultPolicy: 'Pháp lý Dự án & Tiền sử dụng đất'
  },
  {
    name: 'VNBA (Hiệp hội Ngân hàng Việt Nam)',
    patterns: [/\bVNBA\b/i, /Hiệp hội Ngân hàng Việt Nam/i],
    role: 'Tổ chức đại diện các tổ chức tín dụng và ngân hàng thương mại',
    type: 'ORGANIZATION',
    org: 'Hiệp hội Ngân hàng',
    defaultPolicy: 'Chính sách Tín dụng & Lãi suất'
  },
  {
    name: 'VAFI (Hiệp hội Các nhà đầu tư tài chính)',
    patterns: [/\bVAFI\b/i, /Hiệp hội Các nhà đầu tư tài chính/i],
    role: 'Tổ chức bảo vệ quyền lợi nhà đầu tư và thúc đẩy thị trường vốn',
    type: 'ORGANIZATION',
    org: 'Hiệp hội Nhà đầu tư Tài chính',
    defaultPolicy: 'Chứng khoán & Cổ phần hóa DNNN'
  },
  {
    name: 'VEPR (Viện Nghiên cứu Kinh tế và Chính sách)',
    patterns: [/\bVEPR\b/i, /Viện Nghiên cứu Kinh tế và Chính sách/i],
    role: 'Tổ chức tư vấn và nghiên cứu độc lập thuộc Trường ĐH Kinh tế - ĐHQGHN',
    type: 'ORGANIZATION',
    org: 'Viện VEPR',
    defaultPolicy: 'Dự báo Vĩ mô & Chính sách Tài khóa'
  },
  {
    name: 'World Bank (Ngân hàng Thế giới)',
    patterns: [/World Bank/i, /Ngân hàng Thế giới/i, /\bWB\b/],
    role: 'Tổ chức tài chính quốc tế hỗ trợ phát triển',
    type: 'ORGANIZATION',
    org: 'World Bank Group',
    defaultPolicy: 'Cải cách Đầu tư công & Nợ công'
  },
  {
    name: 'IMF (Quỹ Tiền tệ Quốc tế)',
    patterns: [/\bIMF\b/i, /Quỹ Tiền tệ Quốc tế/i],
    role: 'Tổ chức giám sát tài chính và ổn định kinh tế vĩ mô toàn cầu',
    type: 'ORGANIZATION',
    org: 'IMF',
    defaultPolicy: 'Chính sách Tài khóa & Ổn định Vĩ mô'
  }
];

export class ExpertOpinionsManager {
  private opinions: ServerExpertOpinion[] = [];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.opinions = parsed;
          this.recomputeWatchlistStatus();
          console.log(`[ExpertOpinionsManager] Loaded ${this.opinions.length} expert opinions from disk.`);
          return;
        }
      }
    } catch (err: any) {
      console.warn('[ExpertOpinionsManager] Error loading expert opinions from disk:', err?.message || err);
    }

    // Default Seed Records based on real high-impact policy debates in Vietnam
    const now = Date.now();
    this.opinions = [
      {
        id: 'expert_seed_1',
        articleId: 'art_dang_hung_vo_thue_dat',
        articleTitle: "Đề xuất thuế 0,2% với đất bỏ hoang: GS. Đặng Hùng Võ chỉ ra 'khoảng trống' lớn của chính sách",
        articleUrl: 'https://vietnamnet.vn/de-xuat-thue-dat-bo-hoang-gs-dang-hung-vo-chi-ra-khoang-trong-2026.html',
        source: 'VietNamNet',
        publishedAt: new Date(now - 3600000 * 4).toISOString(),
        speakerName: 'GS. Đặng Hùng Võ',
        speakerRole: 'Nguyên Thứ trưởng Bộ TN&MT, Chuyên gia Kinh tế Đất đai',
        speakerType: 'EXPERT',
        organizationName: 'Bộ TN&MT',
        opinionSummary: "GS. Đặng Hùng Võ cho rằng mức thuế suất 0,2% chưa đủ sức nặng để triệt tiêu nạn đầu cơ găm giữ đất đai. Đáng chú ý, dự thảo còn khoảng trống pháp lý nghiêm trọng khi thiếu tiêu chí định lượng minh bạch xác định thế nào là 'bỏ hoang', tiềm ẩn nguy cơ phát sinh cơ chế xin - cho khi áp thuế tại địa phương.",
        statementQuote: "'Nếu chỉ thu thuế 0,2% thì giới đầu cơ vẫn sẵn sàng ôm đất chờ tăng giá. Cần xây dựng cơ sở dữ liệu định giá đất số hóa và lũy tiến thuế đối với bất động sản thứ hai trở lên.'",
        stance: 'CRITIQUE',
        policyArea: 'Chính sách Thuế & Đất đai',
        isWatchlist: true, // ⭐ Tần suất cao, đáng lưu tâm
        mentionCount: 3,
        createdAt: new Date(now - 3600000 * 4).toISOString()
      },
      {
        id: 'expert_seed_2',
        articleId: 'art_can_van_luc_trai_phieu',
        articleTitle: 'Thị trường trái phiếu doanh nghiệp 2026: TS. Cấn Văn Lực kiến nghị 3 giải pháp củng cố niềm tin',
        articleUrl: 'https://vneconomy.vn/ts-can-van-luc-kien-nghi-giai-phap-trai-phieu.htm',
        source: 'VnEconomy',
        publishedAt: new Date(now - 3600000 * 12).toISOString(),
        speakerName: 'TS. Cấn Văn Lực',
        speakerRole: 'Chuyên gia Kinh tế trưởng BIDV, Thành viên Hội đồng TVCSTT Quốc gia',
        speakerType: 'EXPERT',
        organizationName: 'Hội đồng Tư vấn Chính sách Tiền tệ Quốc gia',
        opinionSummary: 'TS. Cấn Văn Lực đánh giá cao quyết tâm chuẩn hóa thị trường của Bộ Tài chính, đồng thời đề xuất sớm hoàn thiện khung pháp lý xếp hạng tín nhiệm bắt buộc, khuyến khích các quỹ đầu tư trái phiếu mở và thúc đẩy thị trường giao dịch thứ cấp minh bạch.',
        statementQuote: "'Thị trường trái phiếu muốn phát triển bền vững cần phải có hệ thống xếp hạng tín nhiệm uy tín độc lập, giúp nhà đầu tư cá nhân tự đánh giá rủi ro thay vì dựa vào bảo lãnh miệng.'",
        stance: 'SUPPORT',
        policyArea: 'Thị trường Trái phiếu & Vốn',
        isWatchlist: true, // ⭐ Đáng lưu tâm
        mentionCount: 4,
        createdAt: new Date(now - 3600000 * 12).toISOString()
      },
      {
        id: 'expert_seed_3',
        articleId: 'art_vcci_giam_thue_vat',
        articleTitle: 'VCCI đề xuất tiếp tục gia hạn giảm thuế VAT 2% và đơn giản hóa thủ tục hoàn thuế điện tử',
        articleUrl: 'https://baodautu.vn/vcci-de-xuat-giam-thue-vat-ho-tro-doanh-nghiep-2026.html',
        source: 'Báo Đầu tư',
        publishedAt: new Date(now - 3600000 * 20).toISOString(),
        speakerName: 'VCCI (Liên đoàn Thương mại và Công nghiệp VN)',
        speakerRole: 'Tổ chức đại diện cộng đồng doanh nghiệp Việt Nam',
        speakerType: 'ORGANIZATION',
        organizationName: 'VCCI',
        opinionSummary: 'VCCI tổng hợp ý kiến từ hơn 500 hiệp hội doanh nghiệp, kiến nghị Bộ Tài chính báo cáo Chính phủ tiếp tục duy trì chính sách giảm 2% thuế GTGT nhằm kích cầu tiêu dùng nội địa, đồng thời chuyển cơ chế tiền kiểm sang hậu kiểm trong hoàn thuế để tháo gỡ dòng tiền cho doanh nghiệp.',
        statementQuote: "'Chính sách giảm thuế GTGT 2% thời gian qua đã chứng minh hiệu quả kích cầu rõ rệt. Việc kéo dài chính sách sẽ tạo đòn bẩy quan trọng cho phục hồi kinh tế.'",
        stance: 'CRITIQUE',
        policyArea: 'Thuế & Hỗ trợ Doanh nghiệp',
        isWatchlist: true, // ⭐ Đáng lưu tâm (tần suất phản biện cao)
        mentionCount: 5,
        createdAt: new Date(now - 3600000 * 20).toISOString()
      },
      {
        id: 'expert_seed_4',
        articleId: 'art_horea_dinh_gia_dat',
        articleTitle: 'HoREA kiến nghị tháo gỡ điểm nghẽn tính tiền sử dụng đất cho hàng chục dự án thương mại',
        articleUrl: 'https://thanhnien.vn/horea-kien-nghi-tinh-tien-su-dung-dat-2026.html',
        source: 'Thanh Niên',
        publishedAt: new Date(now - 3600000 * 36).toISOString(),
        speakerName: 'HoREA (Hiệp hội Bất động sản TP.HCM)',
        speakerRole: 'Hiệp hội đại diện cộng đồng doanh nghiệp địa ốc TP.HCM (Chủ tịch Lê Hoàng Châu)',
        speakerType: 'ORGANIZATION',
        organizationName: 'HoREA',
        opinionSummary: 'HoREA nêu rõ vướng mắc lớn nhất hiện nay của các chủ đầu tư là phương pháp thặng dư trong định giá đất. Việc các cơ quan địa phương chậm ban hành giá đất cụ thể khiến dự án không thể nộp tiền sử dụng đất, không được cấp sổ hồng cho người mua nhà.',
        statementQuote: "'Cần có hướng dẫn liên ngành tài chính - tài nguyên cụ thể về phương pháp định giá đất để cán bộ cơ sở an tâm thực thi công vụ, giải phóng nguồn lực cho thị trường.'",
        stance: 'CRITIQUE',
        policyArea: 'Đất đai & Bất động sản',
        isWatchlist: true, // ⭐ Đáng lưu tâm
        mentionCount: 3,
        createdAt: new Date(now - 3600000 * 36).toISOString()
      },
      {
        id: 'expert_seed_5',
        articleId: 'art_dinh_trong_thinh_gia_xang',
        articleTitle: 'PGS.TS. Đinh Trọng Thịnh: Cơ chế điều hành giá xăng dầu mới giúp triệt tiêu tâm lý găm hàng',
        articleUrl: 'https://vov.vn/kinh-te/dieu-hanh-gia-xang-dau-pgs-ts-dinh-trong-thinh-2026.vov',
        source: 'Đài Tiếng nói Việt Nam (VOV)',
        publishedAt: new Date(now - 3600000 * 48).toISOString(),
        speakerName: 'PGS.TS. Đinh Trọng Thịnh',
        speakerRole: 'Chuyên gia Kinh tế cao cấp, Giảng viên Học viện Tài chính',
        speakerType: 'EXPERT',
        organizationName: 'Học viện Tài chính (BTC)',
        opinionSummary: 'PGS.TS. Đinh Trọng Thịnh đồng tình với phương án rút ngắn chu kỳ điều hành giá xăng dầu xuống 7 ngày và tiến tới cho doanh nghiệp tự quyết định giá bán theo biên độ thị trường có sự kiểm soát của Nhà nước.',
        statementQuote: "'Việc tiệm cận giá thế giới giúp doanh nghiệp đầu mối chủ động nguồn cung, chấm dứt tình trạng đóng cửa cây xăng vì lỗ chiết khấu.'",
        stance: 'SUPPORT',
        policyArea: 'Quản lý Giá & Bình ổn',
        isWatchlist: false, // 1 bài mẫu ban đầu
        mentionCount: 2,
        createdAt: new Date(now - 3600000 * 48).toISOString()
      },
      {
        id: 'expert_seed_6',
        articleId: 'art_dang_hung_vo_dinh_gia_hang_nam',
        articleTitle: 'Bỏ khung giá đất, áp bảng giá hàng năm: GS. Đặng Hùng Võ cảnh báo áp lực đền bù và chi phí doanh nghiệp',
        articleUrl: 'https://dantri.com.vn/kinh-doanh/gs-dang-hung-vo-bang-gia-dat-hang-nam-2026.htm',
        source: 'Dân Trí',
        publishedAt: new Date(now - 3600000 * 60).toISOString(),
        speakerName: 'GS. Đặng Hùng Võ',
        speakerRole: 'Nguyên Thứ trưởng Bộ TN&MT, Chuyên gia Kinh tế Đất đai',
        speakerType: 'EXPERT',
        organizationName: 'Bộ TN&MT',
        opinionSummary: 'GS. Đặng Hùng Võ phân tích rằng việc áp dụng bảng giá đất hàng năm theo giá thị trường là bước tiến lớn, nhưng Bộ Tài chính và các địa phương cần có chính sách chuyển tiếp để tránh tăng đột biến chi phí thuê đất sản xuất kinh doanh.',
        statementQuote: "'Bảng giá đất sát thị trường là đúng quy luật, nhưng phải điều chỉnh tỷ lệ phần trăm tính tiền thuê đất linh hoạt để nuôi dưỡng nguồn thu lâu dài.'",
        stance: 'WARNING',
        policyArea: 'Chính sách Thuế & Đất đai',
        isWatchlist: true, // ⭐ Thường xuyên có nhận định
        mentionCount: 3,
        createdAt: new Date(now - 3600000 * 60).toISOString()
      }
    ];

    this.recomputeWatchlistStatus();
    this.saveToDisk(true);
  }

  // Tiêu chuẩn "Đáng lưu tâm": Người này thường xuyên có nhận định (>= 2 lần) hoặc được ghim thủ công
  public recomputeWatchlistStatus() {
    const speakerCounts = new Map<string, number>();
    this.opinions.forEach((op) => {
      const name = op.speakerName.trim();
      speakerCounts.set(name, (speakerCounts.get(name) || 0) + 1);
    });

    this.opinions.forEach((op) => {
      const name = op.speakerName.trim();
      const count = speakerCounts.get(name) || 1;
      op.mentionCount = count;
      if (op.manualWatchlistOverride !== undefined) {
        op.isWatchlist = op.manualWatchlistOverride;
      } else {
        // Tự động vào mục ĐÁNG LƯU TÂM nếu phát hiện thường xuyên có nhận định (>= 2 lần)
        op.isWatchlist = count >= 2;
      }
    });
  }

  public saveToDisk(immediate: boolean = false) {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    const doSave = () => {
      try {
        const dir = path.dirname(DB_FILE_PATH);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        this.recomputeWatchlistStatus();
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.opinions, null, 2), 'utf-8');
      } catch (err: any) {
        console.error('[ExpertOpinionsManager] Error saving to disk:', err?.message || err);
      }
    };

    if (immediate) {
      doSave();
    } else {
      this.saveTimeout = setTimeout(doSave, 400);
    }
  }

  public getAll(): ServerExpertOpinion[] {
    return [...this.opinions];
  }

  public getFiltered(options: {
    watchlistOnly?: boolean;
    stance?: ExpertStance | 'ALL';
    speakerType?: ExpertSpeakerType | 'ALL';
    search?: string;
    speakerName?: string;
    days?: number;
  }): ServerExpertOpinion[] {
    let filtered = [...this.opinions];

    if (options.watchlistOnly) {
      filtered = filtered.filter((op) => op.isWatchlist);
    }

    if (options.stance && options.stance !== 'ALL') {
      filtered = filtered.filter((op) => op.stance === options.stance);
    }

    if (options.speakerType && options.speakerType !== 'ALL') {
      filtered = filtered.filter((op) => op.speakerType === options.speakerType);
    }

    if (options.speakerName) {
      const target = options.speakerName.toLowerCase().trim();
      filtered = filtered.filter((op) => op.speakerName.toLowerCase().includes(target));
    }

    if (options.days && options.days > 0) {
      const cutoff = Date.now() - options.days * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((op) => {
        const t = new Date(op.publishedAt || op.createdAt).getTime();
        return !isNaN(t) && t >= cutoff;
      });
    }

    if (options.search && options.search.trim()) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter((op) =>
        op.speakerName.toLowerCase().includes(q) ||
        op.speakerRole.toLowerCase().includes(q) ||
        op.articleTitle.toLowerCase().includes(q) ||
        op.opinionSummary.toLowerCase().includes(q) ||
        op.policyArea.toLowerCase().includes(q) ||
        (op.organizationName && op.organizationName.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  public addOrUpdate(item: Partial<ServerExpertOpinion>): ServerExpertOpinion {
    const existingIdx = this.opinions.findIndex((o) => o.id === item.id || (item.articleId && o.articleId === item.articleId && o.speakerName === item.speakerName));
    if (existingIdx >= 0) {
      this.opinions[existingIdx] = {
        ...this.opinions[existingIdx],
        ...item,
      } as ServerExpertOpinion;
      this.recomputeWatchlistStatus();
      this.saveToDisk();
      return this.opinions[existingIdx];
    } else {
      const newItem: ServerExpertOpinion = {
        id: item.id || `expert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        articleId: item.articleId,
        articleTitle: item.articleTitle || 'Ý kiến nhận định chính sách',
        articleUrl: item.articleUrl || '',
        source: item.source || 'Báo chí kinh tế',
        publishedAt: item.publishedAt || new Date().toISOString(),
        speakerName: item.speakerName || 'Chuyên gia kinh tế',
        speakerRole: item.speakerRole || 'Chuyên gia độc lập',
        speakerType: item.speakerType || 'EXPERT',
        organizationName: item.organizationName,
        opinionSummary: item.opinionSummary || 'Nhận định về chính sách điều hành.',
        statementQuote: item.statementQuote,
        stance: item.stance || 'CRITIQUE',
        policyArea: item.policyArea || 'Chính sách Tài chính',
        isWatchlist: Boolean(item.isWatchlist),
        mentionCount: 1,
        createdAt: item.createdAt || new Date().toISOString()
      };
      this.opinions.unshift(newItem);
      this.recomputeWatchlistStatus();
      this.saveToDisk();
      return newItem;
    }
  }

  public toggleWatchlist(id: string, explicitValue?: boolean): ServerExpertOpinion | null {
    const op = this.opinions.find((o) => o.id === id);
    if (!op) return null;
    const speakerName = op.speakerName.trim();
    const newValue = explicitValue !== undefined ? explicitValue : !op.isWatchlist;

    // Cập nhật toàn bộ các bài viết của nhân vật này để đồng bộ trạng thái "Đáng lưu tâm"
    this.opinions.forEach((item) => {
      if (item.speakerName.trim().toLowerCase() === speakerName.toLowerCase()) {
        item.isWatchlist = newValue;
        item.manualWatchlistOverride = newValue;
      }
    });

    this.saveToDisk();
    return op;
  }

  public remove(id: string): boolean {
    const initLen = this.opinions.length;
    this.opinions = this.opinions.filter((o) => o.id !== id);
    if (this.opinions.length !== initLen) {
      this.recomputeWatchlistStatus();
      this.saveToDisk();
      return true;
    }
    return false;
  }

  /**
   * Tự động rà soát danh sách tin tức mới quét để trích xuất phát biểu của các chuyên gia & tổ chức ảnh hưởng
   */
  public scanArticlesForOpinions(articles: any[]): number {
    if (!Array.isArray(articles) || articles.length === 0) return 0;
    let newlyAddedCount = 0;

    articles.forEach((art) => {
      const title = (art.title || '').trim();
      const summary = (art.summary || art.snippet || '').trim();
      const content = `${title} ${summary}`;

      KNOWN_INFLUENCERS.forEach((influencer) => {
        const matches = influencer.patterns.some((pat) => pat.test(content));
        if (!matches) return;

        // Kiểm tra xem đã có nhận định của chuyên gia này trong bài này chưa
        const alreadyExists = this.opinions.some(
          (o) => (o.articleId === art.id || o.articleTitle === title) && o.speakerName === influencer.name
        );
        if (alreadyExists) return;

        // Xác định sắc thái phát biểu
        let stance: ExpertStance = 'CRITIQUE';
        if (/ủng hộ|đồng thuận|đánh giá cao|tích cực|khởi sắc|hoan nghênh|phù hợp/i.test(content)) {
          stance = 'SUPPORT';
        } else if (/cảnh báo|lo ngại|rủi ro|nguy cơ|bất ổn|hệ lụy/i.test(content)) {
          stance = 'WARNING';
        } else if (/khoảng trống|lỗ hổng|bất cập|kiến nghị|đề xuất|chỉ ra|sửa đổi|chưa thỏa đáng|khó khăn/i.test(content)) {
          stance = 'CRITIQUE';
        } else {
          stance = 'NEUTRAL';
        }

        // Trích xuất câu nói hoặc tóm tắt nhận định
        let opinionSummary = summary;
        if (opinionSummary.length > 250) {
          opinionSummary = opinionSummary.slice(0, 247) + '...';
        }
        if (!opinionSummary) {
          opinionSummary = `${influencer.name} phát biểu, nêu quan điểm đóng góp về ${influencer.defaultPolicy}.`;
        }

        const newOp: ServerExpertOpinion = {
          id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          articleId: art.id,
          articleTitle: title,
          articleUrl: art.url || art.link,
          source: art.source || 'Báo chí tài chính',
          publishedAt: art.publishedAt || art.publishedTimestamp || new Date().toISOString(),
          speakerName: influencer.name,
          speakerRole: influencer.role,
          speakerType: influencer.type,
          organizationName: influencer.org,
          opinionSummary,
          stance,
          policyArea: influencer.defaultPolicy,
          isWatchlist: false, // Sẽ được recomputeWatchlistStatus tính tự động
          mentionCount: 1,
          createdAt: new Date().toISOString()
        };

        this.opinions.unshift(newOp);
        newlyAddedCount++;
      });
    });

    if (newlyAddedCount > 0) {
      this.recomputeWatchlistStatus();
      this.saveToDisk(true);
      console.log(`[ExpertOpinionsManager] Automatically extracted ${newlyAddedCount} expert opinions from news scan.`);
    }

    return newlyAddedCount;
  }
}

export const expertOpinionsManager = new ExpertOpinionsManager();

export const expertOpinionsRouter = express.Router();

// GET /api/expert-opinions
expertOpinionsRouter.get('/', (req, res) => {
  try {
    const { watchlistOnly, stance, speakerType, search, speakerName, days } = req.query;
    const daysNum = days ? parseInt(days as string, 10) : undefined;
    const results = expertOpinionsManager.getFiltered({
      watchlistOnly: watchlistOnly === 'true',
      stance: stance as any,
      speakerType: speakerType as any,
      search: search as string,
      speakerName: speakerName as string,
      days: isNaN(daysNum!) ? undefined : daysNum
    });

    const allOpinions = expertOpinionsManager.getAll();
    const watchlistCount = allOpinions.filter((o) => o.isWatchlist).length;

    return res.json({
      success: true,
      total: results.length,
      allTotal: allOpinions.length,
      watchlistCount,
      opinions: results
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi lấy ý kiến chuyên gia' });
  }
});

// POST /api/expert-opinions
expertOpinionsRouter.post('/', (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.speakerName) {
      return res.status(400).json({ success: false, error: 'Cần có tên nhân vật/tổ chức phát biểu' });
    }
    const saved = expertOpinionsManager.addOrUpdate(body);
    return res.json({ success: true, opinion: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi lưu ý kiến chuyên gia' });
  }
});

// POST /api/expert-opinions/:id/toggle-watchlist
expertOpinionsRouter.post('/:id/toggle-watchlist', (req, res) => {
  try {
    const id = req.params.id;
    const { isWatchlist } = req.body || {};
    const updated = expertOpinionsManager.toggleWatchlist(id, isWatchlist);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy mục nhận định' });
    }
    return res.json({ success: true, opinion: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi cập nhật đáng lưu tâm' });
  }
});

// DELETE /api/expert-opinions/:id
expertOpinionsRouter.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const removed = expertOpinionsManager.remove(id);
    return res.json({ success: true, removed });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi xóa ý kiến chuyên gia' });
  }
});

// POST /api/expert-opinions/scan
expertOpinionsRouter.post('/scan', (req, res) => {
  try {
    const { articles } = req.body;
    const count = expertOpinionsManager.scanArticlesForOpinions(articles || []);
    return res.json({ success: true, extractedCount: count, total: expertOpinionsManager.getAll().length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi rà soát ý kiến bài viết' });
  }
});
