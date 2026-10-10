import { ScrapedNewsItem, SectorType, SentimentType, ImpactLevel } from '../types';
import {
  EntityGraphNode,
  EntityGraphLink,
  EntityCluster,
  GraphPropagationScenario,
  SystemicRiskHub,
  EntityKnowledgeGraphData,
  EntityType,
  RelationType,
  DeltaAlertType,
  EntityDeltaMetrics,
} from '../types/entityGraph';

// Danh mục định danh chuẩn thực thể tài chính Việt Nam
const KNOWN_AGENCIES: Array<{ id: string; label: string; role: string; sector: SectorType }> = [
  { id: 'agency-mof', label: 'Bộ Tài chính', role: 'Cơ quan điều hành tài chính vĩ mô & chính sách', sector: 'policy' },
  { id: 'agency-tax', label: 'Cục Thuế và Thuế địa phương', role: 'Quản lý thu ngân sách, hóa đơn điện tử & chống thất thu', sector: 'tax' },
  { id: 'agency-customs', label: 'Tổng cục Hải quan', role: 'Kiểm soát thông quan, thuế XNK & chống gian lận xuất xứ', sector: 'customs' },
  { id: 'agency-ssc', label: 'Ủy ban Chứng khoán Nhà nước (UBCKNN)', role: 'Quản lý thị trường chứng khoán & nâng hạng FTSE/MSCI', sector: 'stocks' },
  { id: 'agency-treasury', label: 'Kho bạc Nhà nước (KBNN)', role: 'Quản lý quỹ ngân quỹ, phát hành TPCP & giải ngân NSNN', sector: 'treasury_budget' },
  { id: 'agency-scic', label: 'Tổng công ty Đầu tư & Kinh doanh Vốn Nhà nước (SCIC)', role: 'Quản lý & thoái vốn Nhà nước tại doanh nghiệp', sector: 'state_economy' },
  { id: 'agency-price', label: 'Cục Quản lý Giá', role: 'Bình ổn giá xăng dầu, điện, viện phí, vật tư chiến lược', sector: 'price_management' },
  { id: 'agency-debt', label: 'Cục Quản lý Nợ & TC Đối ngoại', role: 'Kiểm soát an toàn nợ công, đàm phán ODA & xếp hạng tín nhiệm', sector: 'public_debt' },
  { id: 'agency-insurance', label: 'Cục Quản lý Giám sát Bảo hiểm', role: 'Giám sát thị trường bảo hiểm nhân thọ & phi nhân thọ', sector: 'insurance' },
  { id: 'agency-sbv', label: 'Ngân hàng Nhà nước (NHNN)', role: 'Điều hành chính sách tiền tệ, tỷ giá & lãi suất tín dụng', sector: 'banking_credit' },
];

const KNOWN_ENTERPRISES: Array<{ id: string; label: string; ticker: string; sector: SectorType }> = [
  { id: 'ent-vic', label: 'Tập đoàn Vingroup', ticker: 'VIC', sector: 'realestate' },
  { id: 'ent-vhm', label: 'Vinhomes', ticker: 'VHM', sector: 'realestate' },
  { id: 'ent-hpg', label: 'Tập đoàn Hòa Phát', ticker: 'HPG', sector: 'enterprise' },
  { id: 'ent-vcb', label: 'Vietcombank', ticker: 'VCB', sector: 'banking_credit' },
  { id: 'ent-bid', label: 'BIDV', ticker: 'BID', sector: 'banking_credit' },
  { id: 'ent-ctg', label: 'VietinBank', ticker: 'CTG', sector: 'banking_credit' },
  { id: 'ent-tcb', label: 'Techcombank', ticker: 'TCB', sector: 'banking_credit' },
  { id: 'ent-mbb', label: 'MB Bank', ticker: 'MBB', sector: 'banking_credit' },
  { id: 'ent-ssi', label: 'Chứng khoán SSI', ticker: 'SSI', sector: 'stocks' },
  { id: 'ent-vnd', label: 'Chứng khoán VNDirect', ticker: 'VND', sector: 'stocks' },
  { id: 'ent-nvl', label: 'Tập đoàn Novaland', ticker: 'NVL', sector: 'realestate' },
  { id: 'ent-fpt', label: 'Tập đoàn FPT', ticker: 'FPT', sector: 'fintech_digital' },
  { id: 'ent-msn', label: 'Tập đoàn Masan', ticker: 'MSN', sector: 'enterprise' },
  { id: 'ent-gas', label: 'Tổng công ty Khí VN (PV GAS)', ticker: 'GAS', sector: 'enterprise' },
  { id: 'ent-vnm', label: 'Vinamilk', ticker: 'VNM', sector: 'enterprise' },
  { id: 'ent-pdr', label: 'Bất động sản Phát Đạt', ticker: 'PDR', sector: 'realestate' },
  { id: 'ent-sjc', label: 'Công ty Vàng bạc SJC', ticker: 'SJC', sector: 'gold' },
];

const KNOWN_POLICIES: Array<{ id: string; label: string; description: string; sector: SectorType }> = [
  { id: 'pol-tt68', label: 'Thông tư 68/2024/TT-BTC', description: 'Cơ chế Non-prefunding cho nhà đầu tư ngoại & công bố thông tin', sector: 'stocks' },
  { id: 'pol-nd08', label: 'Nghị định 08/2023/NĐ-CP', description: 'Tháo gỡ cơ chế giãn hoãn nợ & thanh toán TPDN bằng tài sản khác', sector: 'bonds' },
  { id: 'pol-nd65', label: 'Nghị định 65/2022/NĐ-CP', description: 'Quy định điều kiện phát hành TPDN riêng lẻ & NĐT chuyên nghiệp', sector: 'bonds' },
  { id: 'pol-gmt', label: 'Thuế Tối thiểu Toàn cầu (Pillar 2)', description: 'Áp dụng thuế suất tối thiểu 15% đối với các tập đoàn đa quốc gia', sector: 'tax' },
  { id: 'pol-einvoice', label: 'Hóa đơn Điện tử theo từng lần bán', description: 'Bắt buộc xuất hóa đơn từng lần trong kinh doanh xăng dầu, vàng bạc & TMĐT', sector: 'tax' },
  { id: 'pol-landlaw', label: 'Luật Đất đai 2024', description: 'Khung pháp lý định giá đất, bảng giá đất mới & tháo gỡ dự án BĐS', sector: 'realestate' },
  { id: 'pol-publicinv', label: 'Nghị quyết Đẩy mạnh Giải ngân Đầu tư công', description: 'Đôn đốc tiến độ hạ tầng cao tốc, sân bay Long Thành & vốn ODA', sector: 'public_investment' },
  { id: 'pol-growth-target', label: 'Mục tiêu Tăng trưởng GDP & Đổi mới Mô hình Tăng trưởng', description: 'Định hướng tăng trưởng kinh tế, kích hoạt động lực mới và kịch bản GDP quý III/quý 3', sector: 'macro' },
];

const KNOWN_SECTORS: Array<{ id: string; label: string; description: string; sector: SectorType }> = [
  { id: 'sec-macro-gdp', label: 'Tăng trưởng GDP & Mô hình Kinh tế', description: 'Mục tiêu tăng trưởng 2 con số, động lực quý III/quý 3 & ổn định kinh tế vĩ mô', sector: 'macro' },
  { id: 'sec-bonds', label: 'Thị trường Trái phiếu Doanh nghiệp', description: 'Khối lượng đáo hạn, thanh khoản thứ cấp HNX & áp lực thanh toán', sector: 'bonds' },
  { id: 'sec-stocks', label: 'Thị trường Chứng khoán & Nâng hạng', description: 'VN-Index, giao dịch khối ngoại, KRX & chỉ số FTSE', sector: 'stocks' },
  { id: 'sec-realestate', label: 'Thị trường Bất động sản', description: 'Pháp lý dự án, tiếp cận tín dụng & hấp thụ nguồn cung nhà ở', sector: 'realestate' },
  { id: 'sec-gold', label: 'Thị trường Vàng & Ngoại tệ', description: 'Bình ổn giá vàng miếng SJC, chênh lệch thế giới & tỷ giá USD/VND', sector: 'gold' },
  { id: 'sec-ecommerce-tax', label: 'Thuế Thương mại Điện tử', description: 'Quản lý thu sàn Shopee, TikTok Shop, người bán livestream xuyên biên giới', sector: 'tax' },
  { id: 'sec-public-inv', label: 'Vốn Giải ngân Đầu tư Công', description: 'Tiến độ phân bổ vốn 63 tỉnh thành & công trình giao thông trọng điểm', sector: 'public_investment' },
];

/**
 * Xây dựng Bản đồ Tri thức Thực thể từ danh sách bài viết cào được
 */
export function buildEntityKnowledgeGraph(articles: ScrapedNewsItem[]): EntityKnowledgeGraphData {
  const nodesMap = new Map<string, EntityGraphNode>();
  const linksMap = new Map<string, EntityGraphLink>();

  // 1. Thêm các nodes cơ sở trọng tâm
  KNOWN_AGENCIES.forEach((ag) => {
    nodesMap.set(ag.id, {
      id: ag.id,
      label: ag.label,
      type: 'agency',
      categoryNameVi: 'Cơ quan Quản lý Nhà nước',
      description: ag.role,
      sentiment: 'neutral',
      sentimentScore: 0,
      impactLevel: 'high',
      buzzScore: 85,
      mentionCount: 0,
      articleIds: [],
      riskStatus: 'safe',
      primaryRole: ag.role,
      sectorTag: ag.sector,
    });
  });

  KNOWN_ENTERPRISES.forEach((ent) => {
    nodesMap.set(ent.id, {
      id: ent.id,
      label: `${ent.label} (${ent.ticker})`,
      type: 'enterprise',
      categoryNameVi: 'Doanh nghiệp & Tập đoàn',
      description: `Doanh nghiệp niêm yết mã ${ent.ticker}`,
      sentiment: 'neutral',
      sentimentScore: 0,
      impactLevel: 'medium',
      buzzScore: 60,
      mentionCount: 0,
      articleIds: [],
      tickers: [ent.ticker],
      riskStatus: 'safe',
      primaryRole: `Mã CK: ${ent.ticker}`,
      sectorTag: ent.sector,
    });
  });

  KNOWN_POLICIES.forEach((pol) => {
    nodesMap.set(pol.id, {
      id: pol.id,
      label: pol.label,
      type: 'policy',
      categoryNameVi: 'Chính sách & Pháp quy',
      description: pol.description,
      sentiment: 'neutral',
      sentimentScore: 10,
      impactLevel: 'high',
      buzzScore: 75,
      mentionCount: 0,
      articleIds: [],
      riskStatus: 'safe',
      primaryRole: pol.description,
      sectorTag: pol.sector,
    });
  });

  KNOWN_SECTORS.forEach((sec) => {
    nodesMap.set(sec.id, {
      id: sec.id,
      label: sec.label,
      type: 'sector',
      categoryNameVi: 'Lĩnh vực & Nhóm tài sản',
      description: sec.description,
      sentiment: 'neutral',
      sentimentScore: 0,
      impactLevel: 'high',
      buzzScore: 70,
      mentionCount: 0,
      articleIds: [],
      riskStatus: 'safe',
      primaryRole: sec.description,
      sectorTag: sec.sector,
    });
  });

  // 2. Quét qua từng bài viết để trích xuất thực thể & cập nhật trạng thái
  const nowMs = Date.now();
  const articleTimeMap = new Map<string, number>();
  let maxArticleTimeMs = 0;

  // Tính toán thời gian thực tế của từng bài viết
  articles.forEach((art, idx) => {
    let ts = nowMs - idx * 3 * 60 * 1000;
    if (art.publishedAt) {
      const parsed = new Date(art.publishedAt).getTime();
      if (!isNaN(parsed) && parsed > 0) ts = parsed;
    }
    if (art.timeAgo) {
      const minMatch = art.timeAgo.match(/(\d+)\s*(?:phút|m|min)/i);
      if (minMatch) {
        ts = nowMs - parseInt(minMatch[1], 10) * 60 * 1000;
      } else {
        const hourMatch = art.timeAgo.match(/(\d+)\s*(?:giờ|h|hour)/i);
        if (hourMatch) {
          ts = nowMs - parseInt(hourMatch[1], 10) * 60 * 60 * 1000;
        }
      }
    }
    articleTimeMap.set(art.id, ts);
    if (ts > maxArticleTimeMs) maxArticleTimeMs = ts;
  });

  if (maxArticleTimeMs === 0) maxArticleTimeMs = nowMs;
  const cutoff15mMs = maxArticleTimeMs - 15 * 60 * 1000;

  articles.forEach((art) => {
    const textCorpus = `${art.title || ''} ${art.summary || ''} ${(art.keyPoints || []).join(' ')} ${(art.policyTags || []).join(' ')} ${(art.agencies || []).join(' ')} ${(art.tickers || []).join(' ')}`.toLowerCase();
    const matchedNodeIdsInArticle: string[] = [];

    // Check Agencies
    nodesMap.forEach((node) => {
      let isMatched = false;

      if (node.type === 'agency') {
        const keywords: Record<string, string[]> = {
          'agency-mof': ['bộ tài chính', 'bộ tc', 'lãnh đạo bộ', 'mof'],
          'agency-tax': ['tổng cục thuế', 'ngành thuế', 'thuế', 'chi cục thuế', 'hoàn thuế'],
          'agency-customs': ['tổng cục hải quan', 'hải quan', 'cửa khẩu', 'thông quan'],
          'agency-ssc': ['ubck', 'chứng khoán nhà nước', 'ubcknn', 'nâng hạng'],
          'agency-treasury': ['kho bạc nhà nước', 'kbnn', 'ngân quỹ', 'phát hành tpcp'],
          'agency-scic': ['scic', 'thoái vốn nhà nước', 'vốn nhà nước'],
          'agency-price': ['cục quản lý giá', 'giá xăng', 'giá điện', 'bình ổn giá'],
          'agency-debt': ['cục quản lý nợ', 'nợ công', 'xếp hạng tín nhiệm'],
          'agency-insurance': ['bảo hiểm', 'quản lý bảo hiểm', 'bancassurance'],
          'agency-sbv': ['ngân hàng nhà nước', 'nhnn', 'thống đốc', 'lãi suất', 'tỷ giá'],
        };
        const searchTerms = keywords[node.id] || [node.label.toLowerCase()];
        isMatched = searchTerms.some((term) => textCorpus.includes(term));
      } else if (node.type === 'enterprise') {
        const ticker = node.tickers?.[0]?.toLowerCase() || '';
        const entName = node.label.toLowerCase();
        if (ticker && (textCorpus.includes(` ${ticker} `) || textCorpus.includes(`(${ticker})`) || textCorpus.includes(`${ticker}:`) || (art.tickers || []).map(t => t.toLowerCase()).includes(ticker))) {
          isMatched = true;
        } else if (entName && textCorpus.includes(entName.split(' ')[0])) {
          isMatched = true;
        }
      } else if (node.type === 'policy') {
        const polKeywords: Record<string, string[]> = {
          'pol-tt68': ['thông tư 68', 'tt68', 'non-prefunding', 'ký quỹ'],
          'pol-nd08': ['nghị định 08', 'nđ 08', 'nd08', 'hoãn nợ'],
          'pol-nd65': ['nghị định 65', 'nđ 65', 'nd65', 'nhà đầu tư chuyên nghiệp'],
          'pol-gmt': ['thuế tối thiểu toàn cầu', 'pillar 2', 'fdi tối thiểu'],
          'pol-einvoice': ['hóa đơn điện tử', 'hđđt', 'xăng dầu hóa đơn'],
          'pol-landlaw': ['luật đất đai', 'bảng giá đất', 'định giá đất'],
          'pol-publicinv': ['đầu tư công', 'giải ngân', 'cao tốc', 'vốn ngân sách'],
        };
        const searchTerms = polKeywords[node.id] || [node.label.toLowerCase()];
        isMatched = searchTerms.some((term) => textCorpus.includes(term));
      } else if (node.type === 'sector') {
        if (art.sector === node.sectorTag || textCorpus.includes(node.label.toLowerCase())) {
          isMatched = true;
        }
      }

      if (isMatched) {
        node.mentionCount += 1;
        if (!node.articleIds.includes(art.id)) {
          node.articleIds.push(art.id);
        }
        // Cập nhật điểm sắc thái
        const artScore = art.sentiment === 'bullish' ? 40 : art.sentiment === 'bearish' ? -40 : 0;
        node.sentimentScore = Math.round((node.sentimentScore * (node.mentionCount - 1) + artScore) / node.mentionCount);
        node.sentiment = node.sentimentScore > 15 ? 'bullish' : node.sentimentScore < -15 ? 'bearish' : 'neutral';
        node.buzzScore = Math.min(100, node.buzzScore + 4);

        if (art.sentiment === 'bearish' && (art.impactLevel === 'high' || art.isEmergency)) {
          node.riskStatus = 'high_risk';
        } else if (art.sentiment === 'bearish') {
          node.riskStatus = 'monitoring';
        } else if (art.sentiment === 'bullish' && art.impactLevel === 'high') {
          node.riskStatus = 'opportunity';
        }

        matchedNodeIdsInArticle.push(node.id);
      }
    });

    // 3. Trích xuất nhân vật kinh tế nếu có trong bài viết
    if (art.keyPeople && art.keyPeople.length > 0) {
      art.keyPeople.forEach((personName) => {
        const personId = `person-${personName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        if (!nodesMap.has(personId)) {
          nodesMap.set(personId, {
            id: personId,
            label: personName,
            type: 'person',
            categoryNameVi: 'Lãnh đạo & Nhân vật',
            description: `Nhân vật chủ chốt được nhắc tới trong tin tức điều hành`,
            sentiment: art.sentiment,
            sentimentScore: art.sentiment === 'bullish' ? 30 : art.sentiment === 'bearish' ? -30 : 0,
            impactLevel: art.impactLevel,
            buzzScore: 70,
            mentionCount: 1,
            articleIds: [art.id],
            riskStatus: art.sentiment === 'bearish' ? 'monitoring' : 'safe',
            primaryRole: 'Đại diện cơ quan / Doanh nghiệp',
          });
        } else {
          const pNode = nodesMap.get(personId)!;
          pNode.mentionCount += 1;
          if (!pNode.articleIds.includes(art.id)) pNode.articleIds.push(art.id);
        }
        matchedNodeIdsInArticle.push(personId);
      });
    }

    // 4. Tạo liên kết (Edges) giữa các thực thể cùng xuất hiện trong bài viết
    for (let i = 0; i < matchedNodeIdsInArticle.length; i++) {
      for (let j = i + 1; j < matchedNodeIdsInArticle.length; j++) {
        const srcId = matchedNodeIdsInArticle[i];
        const tgtId = matchedNodeIdsInArticle[j];
        if (srcId === tgtId) continue;

        const linkKey = [srcId, tgtId].sort().join('___');
        const srcNode = nodesMap.get(srcId)!;
        const tgtNode = nodesMap.get(tgtId)!;

        // Xác định loại quan hệ ngữ nghĩa
        let relation: RelationType = 'CO_OCCURS';
        let relationLabelVi = 'Đồng đề cập tin tức';

        if ((srcNode.type === 'agency' && tgtNode.type === 'enterprise') || (tgtNode.type === 'agency' && srcNode.type === 'enterprise')) {
          relation = art.sentiment === 'bearish' ? 'INSPECTS' : 'REGULATES';
          relationLabelVi = art.sentiment === 'bearish' ? 'Thanh tra & Kiểm tra' : 'Quản lý & Thẩm định';
        } else if ((srcNode.type === 'agency' && tgtNode.type === 'policy') || (tgtNode.type === 'agency' && srcNode.type === 'policy')) {
          relation = 'ISSUES_POLICY';
          relationLabelVi = 'Ban hành & Hướng dẫn thi hành';
        } else if ((srcNode.type === 'policy' && tgtNode.type === 'enterprise') || (tgtNode.type === 'policy' && srcNode.type === 'enterprise')) {
          relation = 'IMPACTS';
          relationLabelVi = art.sentiment === 'bullish' ? 'Tháo gỡ cơ chế & Hưởng lợi' : 'Tuân thủ & Áp lực điều chỉnh';
        } else if (srcNode.type === 'person' || tgtNode.type === 'person') {
          relation = 'LEADS';
          relationLabelVi = 'Chỉ đạo & Phát ngôn';
        } else if ((srcNode.type === 'enterprise' && tgtNode.type === 'sector') || (tgtNode.type === 'enterprise' && srcNode.type === 'sector')) {
          relation = 'OPERATES_IN';
          relationLabelVi = 'Chiếm thị phần chủ lực';
        } else if (srcNode.type === 'agency' && tgtNode.type === 'agency') {
          relation = 'COLLABORATES';
          relationLabelVi = 'Phối hợp liên ngành điều hành';
        }

        if (linksMap.has(linkKey)) {
          const existingLink = linksMap.get(linkKey)!;
          existingLink.weight = Math.min(10, existingLink.weight + 1);
          if (!existingLink.evidenceArticleIds.includes(art.id)) {
            existingLink.evidenceArticleIds.push(art.id);
          }
          if (art.sentiment === 'bearish') existingLink.sentiment = 'bearish';
          else if (art.sentiment === 'bullish' && existingLink.sentiment !== 'bearish') existingLink.sentiment = 'bullish';
        } else {
          linksMap.set(linkKey, {
            id: linkKey,
            source: srcId,
            target: tgtId,
            relation,
            relationLabelVi,
            weight: 2,
            sentiment: art.sentiment,
            description: `${srcNode.label} ↔ ${tgtNode.label}: ${art.title.slice(0, 75)}...`,
            evidenceArticleIds: [art.id],
            isDirected: relation === 'ISSUES_POLICY' || relation === 'REGULATES' || relation === 'INSPECTS',
          });
        }
      }
    }
  });

  // 5. Đảm bảo các liên kết cơ bản mang tính bản chất nghiệp vụ Bộ Tài chính luôn tồn tại
  const CORE_STRUCTURAL_LINKS: Array<{ src: string; tgt: string; rel: RelationType; label: string; desc: string }> = [
    { src: 'agency-mof', tgt: 'agency-tax', rel: 'REGULATES', label: 'Chỉ đạo trực tiếp', desc: 'Bộ Tài chính quản lý toàn diện Cục Thuế và Thuế địa phương' },
    { src: 'agency-mof', tgt: 'agency-customs', rel: 'REGULATES', label: 'Chỉ đạo trực tiếp', desc: 'Bộ Tài chính quản lý Tổng cục Hải quan' },
    { src: 'agency-mof', tgt: 'agency-ssc', rel: 'REGULATES', label: 'Chỉ đạo trực tiếp', desc: 'Bộ Tài chính quản lý UBCKNN' },
    { src: 'agency-mof', tgt: 'agency-treasury', rel: 'REGULATES', label: 'Chỉ đạo trực tiếp', desc: 'Bộ Tài chính quản lý Kho bạc Nhà nước' },
    { src: 'agency-ssc', tgt: 'pol-tt68', rel: 'ISSUES_POLICY', label: 'Triển khai thi hành', desc: 'UBCKNN chủ trì thực thi Thông tư 68 tháo gỡ ký quỹ Non-prefunding' },
    { src: 'pol-tt68', tgt: 'sec-stocks', rel: 'IMPACTS', label: 'Mở đường nâng hạng', desc: 'Tháo gỡ tiêu chí nâng hạng thị trường chứng khoán FTSE' },
    { src: 'pol-tt68', tgt: 'ent-ssi', rel: 'IMPACTS', label: 'Cấp hạn mức CTCK', desc: 'Các công ty chứng khoán Top đầu bảo lãnh thanh toán cho NĐT nước ngoài' },
    { src: 'agency-tax', tgt: 'pol-einvoice', rel: 'ISSUES_POLICY', label: 'Giám sát 24/7', desc: 'Ngành thuế bắt buộc xuất HĐĐT xăng dầu, vàng bạc & bán lẻ' },
    { src: 'agency-tax', tgt: 'pol-gmt', rel: 'ISSUES_POLICY', label: 'Quản lý thu Pillar 2', desc: 'Cục Thuế và Thuế địa phương rà soát doanh nghiệp FDI nộp thuế tối thiểu toàn cầu' },
    { src: 'pol-nd08', tgt: 'sec-bonds', rel: 'IMPACTS', label: 'Giãn nợ trái phiếu', desc: 'Nghị định 08 cho phép cơ cấu thời hạn trả nợ trái phiếu doanh nghiệp' },
    { src: 'sec-bonds', tgt: 'ent-nvl', rel: 'IMPACTS', label: 'Áp lực đáo hạn nợ', desc: 'Doanh nghiệp đàm phán gia hạn trái phiếu và hoán đổi tài sản' },
    { src: 'agency-sbv', tgt: 'agency-mof', rel: 'COLLABORATES', label: 'Phối hợp Tài khóa - Tiền tệ', desc: 'Điều hành nhịp nhàng lãi suất, tỷ giá và cung ứng tiền tệ' },
    { src: 'agency-sbv', tgt: 'sec-gold', rel: 'REGULATES', label: 'Đấu thầu bình ổn', desc: 'Ngân hàng Nhà nước can thiệp kiểm soát chênh lệch giá vàng SJC' },
    { src: 'agency-treasury', tgt: 'sec-public-inv', rel: 'IMPACTS', label: 'Kiểm soát chi NSNN', desc: 'KBNN đôn đốc thanh toán khối lượng hoàn thành các dự án cao tốc' },
  ];

  CORE_STRUCTURAL_LINKS.forEach((c) => {
    const key = [c.src, c.tgt].sort().join('___');
    if (!linksMap.has(key)) {
      linksMap.set(key, {
        id: key,
        source: c.src,
        target: c.tgt,
        relation: c.rel,
        relationLabelVi: c.label,
        weight: 5,
        sentiment: 'neutral',
        description: c.desc,
        evidenceArticleIds: [],
        isDirected: true,
      });
    }
  });

  const nodes = Array.from(nodesMap.values());
  const links = Array.from(linksMap.values());

  // Tính toán Centrality (Mức độ trung tâm kết nối)
  nodes.forEach((node) => {
    const connectedEdges = links.filter(
      (l) => (typeof l.source === 'string' ? l.source === node.id : l.source.id === node.id) ||
             (typeof l.target === 'string' ? l.target === node.id : l.target.id === node.id)
    );
    node.centralityScore = connectedEdges.length;
    // Tự động boost buzzScore dựa trên số lượng liên kết
    node.buzzScore = Math.min(100, Math.max(node.buzzScore, connectedEdges.length * 6 + 40));
  });

  // 5.5 Tính toán Delta-Alert (Biến động 15 phút cào tin trực tiếp)
  let deltaAlertsCount = 0;
  let redAlertsCount = 0;
  let greenAlertsCount = 0;
  let neutralSpikesCount = 0;

  const articleMap = new Map<string, ScrapedNewsItem>();
  articles.forEach(a => articleMap.set(a.id, a));

  nodes.forEach((node) => {
    const nodeArticles = (node.articleIds || [])
      .map(id => articleMap.get(id))
      .filter((a): a is ScrapedNewsItem => !!a);

    // Phân tách bài viết thành: 15p gần nhất vs Thời kỳ nền trước đó
    const recent15mArticles = nodeArticles.filter(a => {
      const t = articleTimeMap.get(a.id) || 0;
      return t >= cutoff15mMs;
    });

    const baselineArticles = nodeArticles.filter(a => {
      const t = articleTimeMap.get(a.id) || 0;
      return t < cutoff15mMs;
    });

    const recentMentions15m = recent15mArticles.length;
    const previousMentions = baselineArticles.length;

    // Tính điểm sắc thái trung bình trong 15p gần nhất
    let recentSentimentScore = 0;
    if (recent15mArticles.length > 0) {
      const totalRecentScore = recent15mArticles.reduce((acc, art) => {
        let score = art.sentiment === 'bullish' ? 45 : art.sentiment === 'bearish' ? -45 : 0;
        if (art.isEmergency) score += art.sentiment === 'bearish' ? -25 : 25;
        if (art.impactLevel === 'high') score += art.sentiment === 'bearish' ? -15 : 15;
        return acc + score;
      }, 0);
      recentSentimentScore = Math.max(-100, Math.min(100, Math.round(totalRecentScore / recent15mArticles.length)));
    }

    // Tính điểm sắc thái nền
    let baselineSentimentScore = 0;
    if (baselineArticles.length > 0) {
      const totalBaselineScore = baselineArticles.reduce((acc, art) => {
        const score = art.sentiment === 'bullish' ? 35 : art.sentiment === 'bearish' ? -35 : 0;
        return acc + score;
      }, 0);
      baselineSentimentScore = Math.max(-100, Math.min(100, Math.round(totalBaselineScore / baselineArticles.length)));
    } else {
      baselineSentimentScore = 0;
    }

    // Tính chênh lệch delta
    const sentimentDelta = recentMentions15m > 0
      ? (previousMentions > 0 ? recentSentimentScore - baselineSentimentScore : recentSentimentScore)
      : 0;

    const mentionGrowthPercent = previousMentions > 0
      ? Math.round((recentMentions15m / previousMentions) * 100)
      : (recentMentions15m > 0 ? 150 : 0);

    const velocityScore = Math.min(100, recentMentions15m * 28 + (recent15mArticles.some(a => a.isEmergency) ? 35 : 0));

    // Xác định loại Delta Alert
    let deltaType: DeltaAlertType = 'stable';
    let isDeltaAlert = false;
    const triggerReasons: string[] = [];

    const hasEmergency = recent15mArticles.some(a => a.isEmergency);
    const hasHighImpactBearish = recent15mArticles.some(a => a.sentiment === 'bearish' && (a.impactLevel === 'high' || a.isEmergency));
    const hasHighImpactBullish = recent15mArticles.some(a => a.sentiment === 'bullish' && a.impactLevel === 'high');

    if (recentMentions15m > 0) {
      // 1. Cảnh báo Đỏ (Negative Shock / Sốc tiêu cực 15p) - Yêu cầu rủi ro thực sự hoặc sụt giảm mạnh
      if (hasEmergency || (sentimentDelta <= -35 && recentMentions15m >= 2) || (recentSentimentScore <= -40 && recentMentions15m >= 2)) {
        deltaType = 'negative_shock';
        isDeltaAlert = true;
        redAlertsCount += 1;
        deltaAlertsCount += 1;
        if (sentimentDelta <= -35) triggerReasons.push(`Sắc thái sụt giảm mạnh ${Math.abs(sentimentDelta)} điểm trong 15p`);
        if (hasEmergency) triggerReasons.push('Xuất hiện tin khẩn cấp cảnh báo rủi ro cao');
        if (recentMentions15m >= 2) triggerReasons.push(`Tần suất tin xấu bùng nổ (+${recentMentions15m} tin mới)`);
      }
      // 2. Cảnh báo Xanh (Positive Surge / Đột phá tích cực 15p)
      else if ((sentimentDelta >= 35 && recentMentions15m >= 2) || (recentSentimentScore >= 40 && recentMentions15m >= 2) || (hasHighImpactBullish && recentMentions15m >= 2)) {
        deltaType = 'positive_surge';
        isDeltaAlert = true;
        greenAlertsCount += 1;
        deltaAlertsCount += 1;
        if (sentimentDelta >= 35) triggerReasons.push(`Sắc thái tăng vọt +${sentimentDelta} điểm trong 15p`);
        if (hasHighImpactBullish) triggerReasons.push('Thông tin chính sách tháo gỡ / dòng vốn ngoại tích cực');
        if (recentMentions15m >= 2) triggerReasons.push(`Lượng đề cập tích cực tăng đột biến (+${recentMentions15m} tin)`);
      }
      // 3. Cảnh báo Vàng / Xanh lam (Neutral Spike / Đột biến tần suất)
      else if (recentMentions15m >= 3) {
        deltaType = 'neutral_spike';
        isDeltaAlert = true;
        neutralSpikesCount += 1;
        deltaAlertsCount += 1;
        triggerReasons.push(`Gia tăng tần suất xuất hiện (+${recentMentions15m} tin trong 15 phút)`);
      }
    }

    let deltaSummaryVi = 'Chỉ số ổn định trong 15 phút qua';
    if (deltaType === 'negative_shock') {
      deltaSummaryVi = `🚨 Biến động Đỏ: ${recentMentions15m} tin tiêu cực mới trong 15p (Sắc thái: ${sentimentDelta > 0 ? `+${sentimentDelta}` : sentimentDelta}đ)`;
    } else if (deltaType === 'positive_surge') {
      deltaSummaryVi = `⚡ Biến động Xanh: ${recentMentions15m} tin tích cực trong 15p (Sắc thái: +${sentimentDelta}đ)`;
    } else if (deltaType === 'neutral_spike') {
      deltaSummaryVi = `📊 Đột biến tần suất: +${recentMentions15m} tin trong 15p (Sắc thái cân bằng)`;
    }

    node.deltaMetrics = {
      isDeltaAlert,
      deltaType,
      sentimentDelta,
      recentSentimentScore,
      baselineSentimentScore,
      recentMentions15m,
      previousMentions,
      mentionGrowthPercent,
      velocityScore,
      deltaSummaryVi,
      triggerReasons: triggerReasons.length > 0 ? triggerReasons : ['Không có biến động đột biến trong 15 phút qua'],
      recentArticleIds: recent15mArticles.map(a => a.id),
      recentArticlesSample: recent15mArticles.slice(0, 4),
      shiftedAt: new Date(maxArticleTimeMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  });

  // Tìm node kết nối nhiều nhất và node rủi ro nhất
  const sortedByConn = [...nodes].sort((a, b) => (b.centralityScore || 0) - (a.centralityScore || 0));
  const sortedByRisk = [...nodes].sort((a, b) => (a.sentimentScore - b.sentimentScore));
  const topDeltaEntities = nodes
    .filter(n => n.deltaMetrics?.isDeltaAlert)
    .sort((a, b) => (b.deltaMetrics?.velocityScore || 0) - (a.deltaMetrics?.velocityScore || 0));
  const mostConnectedEntity = sortedByConn[0]?.label || 'Bộ Tài chính';
  const highestRiskEntity = sortedByRisk[0]?.label || 'Trái phiếu Doanh nghiệp (TPDN)';

  // 6. Định nghĩa Cụm Lĩnh Vực (Clusters)
  const clusters: EntityCluster[] = [
    {
      id: 'cluster-fiscal-stocks',
      name: 'Thị trường Vốn & Nâng hạng Chứng khoán',
      color: '#4f46e5', // Indigo
      entityCount: nodes.filter(n => n.sectorTag === 'stocks' || n.sectorTag === 'bonds' || n.id === 'agency-ssc').length,
      primaryAgency: 'UBCKNN & Bộ Tài chính',
      dominantSentiment: 'bullish',
      description: 'Hệ sinh thái triển khai Thông tư 68, cơ chế Non-prefunding, KRX và giải tỏa áp lực TPDN',
      keyTopics: ['Thông tư 68/2024', 'Non-prefunding', 'Nâng hạng FTSE', 'TPDN riêng lẻ HNX'],
    },
    {
      id: 'cluster-tax-customs',
      name: 'Thu Ngân Sách, Thuế & Hải Quan Số',
      color: '#059669', // Emerald
      entityCount: nodes.filter(n => n.sectorTag === 'tax' || n.sectorTag === 'customs').length,
      primaryAgency: 'Cục Thuế, Thuế địa phương & Tổng cục Hải quan',
      dominantSentiment: 'neutral',
      description: 'Hiện đại hóa thu NSNN, hóa đơn điện tử từng lần xăng dầu, thuế TMĐT sàn xuyên biên giới & Pillar 2',
      keyTopics: ['Hóa đơn điện tử', 'Thuế sàn Shopee/TikTok', 'Thuế tối thiểu toàn cầu', 'Thông quan 24/7'],
    },
    {
      id: 'cluster-realestate-banking',
      name: 'Bất Động Sản, Tín Dụng & Đất Đai',
      color: '#d97706', // Amber
      entityCount: nodes.filter(n => n.sectorTag === 'realestate' || n.sectorTag === 'banking_credit').length,
      primaryAgency: 'NHNN, Bộ Xây dựng & Bộ Tài chính',
      dominantSentiment: 'bearish',
      description: 'Tháo gỡ pháp lý Luật Đất đai, áp lực nợ TPDN bất động sản & kiểm soát dòng vốn tín dụng',
      keyTopics: ['Luật Đất đai 2024', 'Áp lực đáo hạn TPDN', 'Cơ cấu nợ', 'Gói tín dụng nhà ở xã hội'],
    },
    {
      id: 'cluster-treasury-macro',
      name: 'Kho Bạc, Đầu Tư Công & Bình Ổn Giá',
      color: '#0284c7', // Sky
      entityCount: nodes.filter(n => n.sectorTag === 'treasury_budget' || n.sectorTag === 'public_investment' || n.sectorTag === 'price_management').length,
      primaryAgency: 'KBNN & Cục Quản lý Giá',
      dominantSentiment: 'bullish',
      description: 'Tiến độ giải ngân vốn cao tốc trọng điểm quốc gia, phát hành TPCP và kiểm soát CPI mặt hàng thiết yếu',
      keyTopics: ['Giải ngân vốn NSNN', 'Cao tốc Bắc - Nam', 'Phát hành TPCP', 'Bình ổn giá xăng dầu'],
    },
  ];

  // 7. Sinh kịch bản Mô phỏng Lan truyền Tác động (Shock Propagation Scenarios)
  const propagationScenarios: GraphPropagationScenario[] = [
    {
      id: 'scen-tt68-ftse',
      triggerEntityId: 'pol-tt68',
      triggerEntityName: 'Thông tư 68/2024/TT-BTC (Non-prefunding)',
      scenarioName: 'Kích hoạt Dòng vốn Khối ngoại & Nâng hạng FTSE',
      probability: 'Cao (75-90%)',
      impactScale: 'Toàn hệ thống tài chính',
      systemicRiskLevel: 'Cơ hội phát triển',
      affectedChain: [
        {
          step: 1,
          entityId: 'agency-ssc',
          entityName: 'UBCKNN',
          effectType: 'Tích cực & Tháo gỡ',
          description: 'Hoàn tất cơ chế ký quỹ và giám sát an toàn thanh toán của CTCK',
        },
        {
          step: 2,
          entityId: 'ent-ssi',
          entityName: 'Công ty Chứng khoán Top 1 (SSI, VND)',
          effectType: 'Tích cực & Tháo gỡ',
          description: 'Tăng hạn mức bảo lãnh lệnh giao dịch cho các quỹ đầu tư quốc tế',
        },
        {
          step: 3,
          entityId: 'sec-stocks',
          entityName: 'Thị trường Chứng khoán VN-Index',
          effectType: 'Tích cực & Tháo gỡ',
          description: 'Hút dòng vốn FII từ 1.5 - 3 tỷ USD khi FTSE chính thức công bố nâng hạng',
        },
      ],
      leadershipAdvice: 'Đôn đốc Trung tâm Lưu ký VSDC và các CTCK hoàn thiện hạ tầng kỹ thuật, đảm bảo không xảy ra sự cố thanh toán lệnh bù trừ.',
      recommendedAction: 'Chỉ đạo UBCKNN tổ chức roadshow gặp gỡ trực tiếp các tổ chức xếp hạng tín nhiệm quốc tế FTSE & MSCI.',
    },
    {
      id: 'scen-bonds-pressure',
      triggerEntityId: 'sec-bonds',
      triggerEntityName: 'Trái phiếu Doanh nghiệp (TPDN Đáo hạn)',
      scenarioName: 'Gia tăng Áp lực Đáo hạn Nợ TPDN Bất Động Sản',
      probability: 'Trung bình (50-70%)',
      impactScale: 'Nhóm ngành chuyên biệt',
      systemicRiskLevel: 'Nguy cơ cao',
      affectedChain: [
        {
          step: 1,
          entityId: 'ent-nvl',
          entityName: 'Doanh nghiệp BĐS Phát hành lớn',
          effectType: 'Áp lực thanh khoản',
          description: 'Khó khăn trong cân đối dòng tiền trả gốc/lãi trái phiếu đến hạn',
        },
        {
          step: 2,
          entityId: 'agency-mof',
          entityName: 'Bộ Tài chính & HNX',
          effectType: 'Gia tăng giám sát',
          description: 'Tăng cường thanh tra công bố thông tin trên chuyên trang TPDN riêng lẻ HNX',
        },
        {
          step: 3,
          entityId: 'sec-realestate',
          entityName: 'Thị trường Bất Động Sản',
          effectType: 'Rủi ro lan truyền',
          description: 'Ảnh hưởng đến tâm lý người mua nhà và tiến độ bàn giao các dự án đang thế chấp',
        },
      ],
      leadershipAdvice: 'Chủ động yêu cầu các tổ chức phát hành báo cáo phương án dòng tiền trả nợ trước 30 ngày so với kỳ đáo hạn; khuyến khích đàm phán hoán đổi nợ bằng tài sản theo NĐ 08.',
      recommendedAction: 'Ban hành văn bản chỉ đạo HNX giám sát chặt các lô trái phiếu chậm thanh toán lãi.',
    },
    {
      id: 'scen-einvoice-petro',
      triggerEntityId: 'pol-einvoice',
      triggerEntityName: 'Hóa đơn Điện tử từng lần bán (Xăng dầu & Vàng)',
      scenarioName: 'Chuẩn hóa Dữ liệu Thuế & Chống Thất thu Ngân sách',
      probability: 'Cao (75-90%)',
      impactScale: 'Nhóm ngành chuyên biệt',
      systemicRiskLevel: 'Cơ hội phát triển',
      affectedChain: [
        {
          step: 1,
          entityId: 'agency-tax',
          entityName: 'Cục Thuế và Thuế địa phương',
          effectType: 'Tích cực & Tháo gỡ',
          description: 'Hệ thống tiếp nhận tự động dữ liệu hóa đơn kết nối trực tiếp cây xăng và tiệm vàng',
        },
        {
          step: 2,
          entityId: 'sec-ecommerce-tax',
          entityName: 'Doanh nghiệp Thương mại Bán lẻ',
          effectType: 'Tích cực & Tháo gỡ',
          description: 'Minh bạch hóa dòng tiền kinh doanh, ngăn chặn buôn lậu và trốn thuế hóa đơn VAT',
        },
        {
          step: 3,
          entityId: 'agency-treasury',
          entityName: 'Kho bạc & Thu Ngân sách',
          effectType: 'Tích cực & Tháo gỡ',
          description: 'Tăng thu ngân sách bền vững từ thuế GTGT và thuế Bảo vệ Môi trường',
        },
      ],
      leadershipAdvice: 'Tiếp tục duy trì đường dây nóng hỗ trợ người nộp thuế, kiểm tra đột xuất các đơn vị cố tình trì hoãn kết nối dữ liệu máy tính tiền.',
      recommendedAction: 'Biểu dương các cơ quan Thuế địa phương hoàn thành 100% mục tiêu kết nối HĐĐT.',
    },
  ];

  // 8. Định nghĩa Các Hub Rủi ro Hệ thống (Systemic Risk Hubs)
  const systemicRiskHubs: SystemicRiskHub[] = [
    {
      entityId: 'sec-bonds',
      entityName: 'Thị trường Trái phiếu Doanh nghiệp',
      type: 'sector',
      riskScore: 78,
      connectedNodesCount: links.filter(l => (typeof l.source === 'string' ? l.source === 'sec-bonds' : l.source.id === 'sec-bonds') || (typeof l.target === 'string' ? l.target === 'sec-bonds' : l.target.id === 'sec-bonds')).length,
      riskSummary: 'Tập trung khối lượng đáo hạn lớn của nhóm bất động sản trong quý tới',
      keyConcern: 'Nguy cơ chậm trả nợ lãi và khiếu nại của nhà đầu tư cá nhân',
      mitigationStrategy: 'Đốc thúc tái cấu trúc nợ theo Nghị định 08, đẩy mạnh xếp hạng tín nhiệm độc lập',
    },
    {
      entityId: 'sec-gold',
      entityName: 'Thị trường Vàng Miếng & Tỷ Giá',
      type: 'sector',
      riskScore: 65,
      connectedNodesCount: links.filter(l => (typeof l.source === 'string' ? l.source === 'sec-gold' : l.source.id === 'sec-gold') || (typeof l.target === 'string' ? l.target === 'sec-gold' : l.target.id === 'sec-gold')).length,
      riskSummary: 'Biến động chênh lệch giá vàng trong nước so với thế giới và áp lực cầu ngoại tệ',
      keyConcern: 'Hiện tượng đầu cơ tích trữ và buôn lậu vàng qua biên giới',
      mitigationStrategy: 'Phối hợp Cục Thuế và Thuế địa phương bắt buộc xuất HĐĐT từng giao dịch, Tổng cục Hải quan siết cửa khẩu',
    },
    {
      entityId: 'pol-gmt',
      entityName: 'Thuế Tối thiểu Toàn cầu (Pillar 2)',
      type: 'policy',
      riskScore: 55,
      connectedNodesCount: links.filter(l => (typeof l.source === 'string' ? l.source === 'pol-gmt' : l.source.id === 'pol-gmt') || (typeof l.target === 'string' ? l.target === 'pol-gmt' : l.target.id === 'pol-gmt')).length,
      riskSummary: 'Cạnh tranh thu hút FDI khi các ưu đãi thuế quan truyền thống bị triệt tiêu',
      keyConcern: 'Doanh nghiệp FDI lớn kiến nghị các gói hỗ trợ đầu tư ngoài thuế tương thích với quy định OECD',
      mitigationStrategy: 'Khẩn trương trình Chính phủ Quỹ Hỗ trợ Đầu tư để giữ chân các tập đoàn bán dẫn và công nghệ',
    },
  ];

  return {
    nodes,
    links,
    clusters,
    propagationScenarios,
    systemicRiskHubs,
    generatedAt: new Date().toISOString(),
    totalEntities: nodes.length,
    totalRelations: links.length,
    mostConnectedEntity,
    highestRiskEntity,
    deltaAlertsCount,
    redAlertsCount,
    greenAlertsCount,
    neutralSpikesCount,
    lastScrapedWindowMinutes: 15,
    topDeltaEntities,
  };
}
