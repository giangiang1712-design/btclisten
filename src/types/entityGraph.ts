import { ScrapedNewsItem, SectorType, SentimentType, ImpactLevel } from '../types';

export type EntityType = 
  | 'agency'      // Cơ quan Quản lý Nhà nước (Bộ Tài chính, Cục Thuế, UBCKNN, KBNN...)
  | 'enterprise'  // Doanh nghiệp & Tập đoàn (Vingroup, Hòa Phát, Vietcombank, Novaland...)
  | 'policy'      // Chính sách, Thể chế & Pháp quy (Nghị định 08, Thông tư 68, Luật Đất đai...)
  | 'person'      // Lãnh đạo & Nhân vật kinh tế (Bộ trưởng, Chủ tịch UBCK, Thống đốc, CEO...)
  | 'sector'      // Ngành & Nhóm tài sản (Chứng khoán, TPDN, BĐS, Vàng SJC, Thuế TMĐT...)
  | 'event';      // Sự kiện / Vụ việc nóng (Nâng hạng FTSE, Kiểm tra hóa đơn, Áp lực đáo hạn...)

export type RelationType =
  | 'REGULATES'        // Quản lý / Giám sát
  | 'INSPECTS'         // Thanh tra / Kiểm tra
  | 'ISSUES_POLICY'    // Ban hành chính sách / Văn bản hướng dẫn
  | 'IMPACTS'          // Tác động trực tiếp đến dòng tiền / hoạt động
  | 'LEADS'            // Lãnh đạo / Đại diện pháp luật
  | 'OPERATES_IN'      // Hoạt động trong ngành
  | 'INVESTS_IN'       // Đầu tư / Góp vốn / Dự án trọng điểm
  | 'CO_OCCURS'        // Cùng xuất hiện trong chuỗi tin nóng
  | 'CRITICIZES'       // Phản ánh kiến nghị / Vướng mắc thực thi
  | 'COLLABORATES';    // Phối hợp liên ngành / Đối tác chiến lược

export type DeltaAlertType = 
  | 'negative_shock'  // 🔴 Cảnh báo Đỏ: Sốc tiêu cực / Giảm mạnh sắc thái / Bùng nổ tin xấu trong 15p
  | 'positive_surge'  // 🟢 Cảnh báo Xanh: Đột phá tích cực / Tăng mạnh sắc thái / Bùng nổ tin tốt trong 15p
  | 'neutral_spike'   // 🟡 Cảnh báo Vàng/Xanh lam: Đột biến số lượng tin nhưng sắc thái cân bằng
  | 'stable';         // ⚪ Ổn định: Không có biến động bất thường

export interface EntityDeltaMetrics {
  isDeltaAlert: boolean;
  deltaType: DeltaAlertType;
  sentimentDelta: number; // Điểm chênh lệch sắc thái 15p gần nhất vs mức nền (-100 đến +100)
  recentSentimentScore: number; // Điểm sắc thái trong 15p qua
  baselineSentimentScore: number; // Điểm sắc thái trước 15p qua
  recentMentions15m: number; // Số lượt xuất hiện trong 15 phút qua
  previousMentions: number; // Số lượt xuất hiện trước đó
  mentionGrowthPercent: number; // Tỷ lệ tăng trưởng lượng đề cập (vd: +150%)
  velocityScore: number; // Tốc độ lan truyền tin tức (0 - 100)
  deltaSummaryVi: string; // Tóm tắt ngắn gọn biến động (hiển thị trên Badge/Tooltip)
  triggerReasons: string[]; // Các lý do kích hoạt cảnh báo cụ thể
  recentArticleIds: string[]; // Danh sách ID các bài báo cào được trong 15p qua
  recentArticlesSample?: ScrapedNewsItem[];
  shiftedAt?: string; // Thời điểm ghi nhận biến động
}

export interface EntityGraphNode {
  id: string;
  label: string;
  type: EntityType;
  categoryNameVi: string;
  description?: string;
  sentiment: SentimentType;
  sentimentScore: number; // -100 to +100
  impactLevel: ImpactLevel;
  buzzScore: number; // 1 - 100
  mentionCount: number;
  articleIds: string[];
  tickers?: string[];
  primaryRole?: string;
  riskStatus: 'safe' | 'monitoring' | 'high_risk' | 'opportunity';
  centralityScore?: number; // Normalized degree centrality
  sectorTag?: SectorType;
  // Delta-Alert metrics (15-minute live scraping delta)
  deltaMetrics?: EntityDeltaMetrics;
  // D3 force simulation coordinates
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface EntityGraphLink {
  id: string;
  source: string | EntityGraphNode;
  target: string | EntityGraphNode;
  relation: RelationType;
  relationLabelVi: string;
  weight: number; // 1 - 10
  sentiment: SentimentType;
  description?: string;
  evidenceArticleIds: string[];
  isDirected?: boolean;
}

export interface EntityCluster {
  id: string;
  name: string;
  color: string;
  entityCount: number;
  primaryAgency: string;
  dominantSentiment: SentimentType;
  description: string;
  keyTopics: string[];
}

export interface GraphPropagationScenario {
  id: string;
  triggerEntityId: string;
  triggerEntityName: string;
  scenarioName: string;
  probability: 'Cao (75-90%)' | 'Trung bình (50-70%)' | 'Thấp (25-45%)';
  impactScale: 'Toàn hệ thống tài chính' | 'Nhóm ngành chuyên biệt' | 'Cục bộ doanh nghiệp';
  systemicRiskLevel: 'Nguy cơ cao' | 'Cần giám sát' | 'Cơ hội phát triển';
  affectedChain: Array<{
    step: number;
    entityId: string;
    entityName: string;
    effectType: 'Tích cực & Tháo gỡ' | 'Áp lực thanh khoản' | 'Rủi ro lan truyền' | 'Gia tăng giám sát';
    description: string;
  }>;
  leadershipAdvice: string;
  recommendedAction: string;
}

export interface SystemicRiskHub {
  entityId: string;
  entityName: string;
  type: EntityType;
  riskScore: number; // 0 - 100
  connectedNodesCount: number;
  riskSummary: string;
  keyConcern: string;
  mitigationStrategy: string;
}

export interface EntityKnowledgeGraphData {
  nodes: EntityGraphNode[];
  links: EntityGraphLink[];
  clusters: EntityCluster[];
  propagationScenarios: GraphPropagationScenario[];
  systemicRiskHubs: SystemicRiskHub[];
  generatedAt: string;
  totalEntities: number;
  totalRelations: number;
  mostConnectedEntity: string;
  highestRiskEntity: string;
  // Delta-Alert summary overview
  deltaAlertsCount?: number;
  redAlertsCount?: number;
  greenAlertsCount?: number;
  neutralSpikesCount?: number;
  lastScrapedWindowMinutes?: number;
  topDeltaEntities?: EntityGraphNode[];
}
