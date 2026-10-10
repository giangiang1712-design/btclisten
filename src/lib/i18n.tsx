import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type Language = 'vi' | 'en';

export interface Translations {
  // Navigation & Tabs
  nav_dashboard: string;
  nav_dashboard_sub: string;
  nav_table: string;
  nav_table_sub: string;
  nav_database: string;
  nav_database_sub: string;
  nav_sources: string;
  nav_sources_sub: string;
  nav_briefing: string;
  nav_briefing_sub: string;
  nav_knowledge: string;
  nav_knowledge_sub: string;
  nav_finetune: string;
  nav_finetune_sub: string;
  nav_graph: string;
  nav_graph_sub: string;
  nav_triggers: string;
  nav_triggers_sub: string;
  nav_keywords: string;
  nav_keywords_sub: string;
  nav_dictionary: string;
  nav_dictionary_sub: string;
  nav_analytics: string;
  nav_analytics_sub: string;
  nav_reports: string;
  nav_reports_sub: string;

  // Header & Status
  header_system_status: string;
  header_status_stable: string;
  header_last_updated: string;
  header_not_scanned: string;
  header_version: string;
  header_scan_session: string;
  header_auto_scan: string;
  header_auto_scan_off: string;
  header_auto_scan_15m: string;
  header_auto_scan_30m: string;
  header_auto_scan_45m: string;
  header_auto_scan_60m: string;
  header_search_placeholder: string;
  header_theme_light: string;
  header_theme_dark: string;
  header_theme_toggle_tip: string;
  header_mof_weights: string;
  header_alert_triggers: string;
  header_advisor_assistant: string;
  header_video_ai: string;
  header_gmail_alert: string;
  header_export_report: string;
  header_scan_now: string;
  header_scanning: string;
  header_last_scanned: string;
  header_total_articles: string;
  header_next_scan: string;
  header_news_source_desc: string;

  // Quick Tabs
  tab_quick_dashboard: string;
  tab_quick_table: string;
  tab_quick_briefing: string;
  tab_quick_analytics: string;
  tab_quick_finetune: string;
  tab_quick_database: string;
  tab_quick_sources: string;
  tab_quick_graph: string;

  // Common Actions
  action_copy: string;
  action_copied: string;
  action_download: string;
  action_close: string;
  action_save: string;
  action_reset: string;
  action_search: string;
  action_filter: string;
  action_clear_filter: string;
  action_export: string;
  action_view_detail: string;
  action_run_test: string;
  action_compare: string;
  action_refresh: string;
  action_expand: string;
  action_collapse: string;

  // Sentiment & Impact
  sentiment_all: string;
  sentiment_positive: string;
  sentiment_negative: string;
  sentiment_neutral: string;
  impact_high: string;
  impact_medium: string;
  impact_low: string;
  danger_crisis: string;
  positive_highlights: string;

  // Sectors
  sector_all: string;
  sector_tax: string;
  sector_customs: string;
  sector_bonds: string;
  sector_stocks: string;
  sector_treasury_budget: string;
  sector_public_investment: string;
  sector_price_management: string;
  sector_insurance: string;
  sector_state_economy: string;
  sector_public_debt: string;
  sector_public_assets: string;
  sector_inspection_audit: string;
  sector_national_reserve: string;
  sector_banking_credit: string;
  sector_realestate: string;
  sector_gold: string;
  sector_forex: string;
  sector_fdi: string;
  sector_crypto: string;
  sector_macro: string;
  sector_enterprise: string;
  sector_collective_economy: string;
  sector_fintech_digital: string;
  sector_policy: string;
  sector_people: string;

  // Dashboard Metrics & Titles
  dash_kpi_total_news: string;
  dash_kpi_crisis_alerts: string;
  dash_kpi_positive_news: string;
  dash_kpi_high_impact: string;
  dash_kpi_average_sentiment: string;
  dash_radar_title: string;
  dash_radar_desc: string;
  dash_live_pulse: string;
  dash_urgent_alerts: string;
  dash_trending_topics: string;
  dash_sentiment_distribution: string;
  dash_leadership_briefing: string;

  // Language Switcher
  lang_vi: string;
  lang_en: string;
  lang_switch_tooltip: string;

  // Modals & Tools
  cmd_search_title: string;
  cmd_search_subtitle: string;
  cmd_switch_lang: string;
  cmd_shortcuts: string;
  modal_export_title: string;
  modal_export_subtitle: string;
  modal_weights_title: string;
  modal_triggers_title: string;
  modal_advisor_title: string;
  modal_video_title: string;
  modal_gmail_title: string;

  // Fine-Tuning Studio
  ft_title: string;
  ft_subtitle: string;
  ft_tab_dataset: string;
  ft_tab_training: string;
  ft_tab_arena: string;
  ft_tab_deployment: string;
  ft_samples_live: string;
  ft_download_jsonl: string;
  ft_download_csv: string;
  ft_start_training: string;
  ft_training_running: string;
  ft_base_vs_tuned: string;
  ft_rag_booster: string;

  // View Density Modes
  view_executive: string;
  view_standard: string;
  view_deep: string;
}

const translations: Record<Language, Translations> = {
  vi: {
    // Navigation & Tabs
    nav_dashboard: 'Tổng Quan CMS',
    nav_dashboard_sub: 'KPIs & Cảnh báo thời gian thực',
    nav_table: 'Quản Lý Bài Viết',
    nav_table_sub: 'Bảng quản trị tin tức & tác động',
    nav_database: 'Cơ Sở Dữ Liệu Quét',
    nav_database_sub: 'Lưu trữ & Truy vấn đa chiều',
    nav_sources: 'Kho Báo Chí (30+)',
    nav_sources_sub: '30+ Báo chí & Cổng TT Realtime',
    nav_briefing: 'Tham Mưu Lãnh Đạo',
    nav_briefing_sub: 'Tóm tắt 6W & Dự thảo phát ngôn',
    nav_knowledge: 'Kho Tri Thức RAG',
    nav_knowledge_sub: 'Nạp văn bản pháp quy & PDF cho AI',
    nav_finetune: 'Fine-Tuning Studio',
    nav_finetune_sub: '1.000 Mẫu & Huấn luyện trực tiếp',
    nav_graph: 'Bản Đồ Tri Thức (Graph)',
    nav_graph_sub: 'Mạng lưới thực thể & Tác động lan truyền',
    nav_triggers: 'Ngưỡng & Giả Lập',
    nav_triggers_sub: 'Gửi cảnh báo đột biến tức thì',
    nav_keywords: 'Cấu Hình Trọng Số MoF',
    nav_keywords_sub: 'Thuật toán điểm ưu tiên',
    nav_dictionary: 'Từ Điển & Ngữ Cảnh 2026',
    nav_dictionary_sub: 'Đồng nghĩa & 16 lĩnh vực BTC',
    nav_analytics: 'Thống Kê & Phân Tích',
    nav_analytics_sub: 'Tần suất xu hướng & tham mưu cảm xúc',
    nav_reports: 'Xuất Báo Cáo',
    nav_reports_sub: 'Tải PDF, Snapshot, CSV',

    // Header & Status
    header_system_status: 'Trạng thái hệ thống:',
    header_status_stable: 'Ổn định',
    header_last_updated: 'Cập nhật lúc:',
    header_not_scanned: 'Chưa quét',
    header_version: 'Phiên bản:',
    header_scan_session: 'Phiên quét:',
    header_auto_scan: 'Tự quét:',
    header_auto_scan_off: 'Tắt (Chỉ quét khi bấm)',
    header_auto_scan_15m: 'Sau 15 phút',
    header_auto_scan_30m: 'Sau 30 phút',
    header_auto_scan_45m: 'Sau 45 phút',
    header_auto_scan_60m: 'Sau 60 phút',
    header_search_placeholder: 'Tìm kiếm... (Ctrl+K)',
    header_theme_light: 'Sáng',
    header_theme_dark: 'Tối',
    header_theme_toggle_tip: 'Chuyển đổi giao diện Sáng / Tối (Alt+T)',
    header_mof_weights: 'Trọng số MoF',
    header_alert_triggers: 'Ngưỡng Cảnh Báo',
    header_advisor_assistant: 'Trợ Lý Tham Mưu',
    header_video_ai: 'Tạo Video AI',
    header_gmail_alert: '🚨 Gửi Gmail Cảnh Báo',
    header_export_report: 'Xuất báo cáo',
    header_scan_now: 'Quét ngay',
    header_scanning: 'Đang quét dữ liệu...',
    header_last_scanned: 'Cập nhật lần cuối:',
    header_total_articles: 'Tổng tin:',
    header_next_scan: 'Tự quét tiếp theo:',
    header_news_source_desc: 'Nguồn: Google Search Realtime & RSS Báo chí Tài chính Việt Nam',

    // Quick Tabs
    tab_quick_dashboard: 'Tổng Quan',
    tab_quick_table: 'Quản Trị Bảng',
    tab_quick_briefing: 'Tham Mưu Lãnh Đạo',
    tab_quick_analytics: 'Analytics',
    tab_quick_finetune: 'Fine-Tuning',
    tab_quick_database: 'Cơ Sở Dữ Liệu',
    tab_quick_sources: 'Kho Báo Chí',
    tab_quick_graph: 'Bản Đồ Tri Thức',

    // Common Actions
    action_copy: 'Sao chép',
    action_copied: 'Đã sao chép!',
    action_download: 'Tải về',
    action_close: 'Đóng',
    action_save: 'Lưu thay đổi',
    action_reset: 'Khôi phục mặc định',
    action_search: 'Tìm kiếm',
    action_filter: 'Lọc',
    action_clear_filter: 'Xóa Lọc',
    action_export: 'Xuất dữ liệu',
    action_view_detail: 'Xem chi tiết',
    action_run_test: 'Kiểm thử',
    action_compare: 'So sánh',
    action_refresh: 'Làm mới',
    action_expand: 'Mở rộng',
    action_collapse: 'Thu gọn',

    // Sentiment & Impact
    sentiment_all: 'Tất cả sắc thái',
    sentiment_positive: 'Tích cực (Khuếch đại)',
    sentiment_negative: 'Tiêu cực (Nguy cơ / Cảnh báo)',
    sentiment_neutral: 'Trung tính / Đa chiều',
    impact_high: 'Tác động Cao (High Impact)',
    impact_medium: 'Tác động Trung bình',
    impact_low: 'Tác động Thấp',
    danger_crisis: 'Nguy cơ',
    positive_highlights: 'Điểm sáng',

    // Sectors
    sector_all: 'Toàn cảnh',
    sector_tax: 'Thuế & Thu NSNN',
    sector_customs: 'Hải quan & XNK',
    sector_bonds: 'Trái phiếu (TPDN & TPCP)',
    sector_stocks: 'Chứng khoán (UBCK)',
    sector_treasury_budget: 'Kho bạc & Ngân sách',
    sector_public_investment: 'Đầu tư công & Giải ngân',
    sector_price_management: 'Quản lý Giá & Bình ổn',
    sector_insurance: 'Bảo hiểm & Giám sát BH',
    sector_state_economy: 'DNNN & SCIC',
    sector_public_debt: 'Nợ công & TC Đối ngoại',
    sector_public_assets: 'Tài sản công',
    sector_inspection_audit: 'Thanh tra & Giám sát',
    sector_national_reserve: 'Dự trữ Quốc gia',
    sector_banking_credit: 'Ngân hàng & Tín dụng',
    sector_realestate: 'Bất động sản & Đất đai',
    sector_gold: 'Vàng & Kim loại quý',
    sector_forex: 'Tỷ giá & Ngoại tệ',
    sector_fdi: 'Đầu tư Nước ngoài (FDI)',
    sector_crypto: 'Crypto & Tài sản số',
    sector_macro: 'Tăng trưởng GDP & Vĩ mô',
    sector_enterprise: 'Doanh nghiệp & M&A',
    sector_collective_economy: 'Kinh tế Tập thể & HTX',
    sector_fintech_digital: 'Tài chính số & Thuế TMĐT',
    sector_policy: 'Chính sách & Pháp lý',
    sector_people: 'Lãnh đạo & Nhân vật',

    // Dashboard Metrics & Titles
    dash_kpi_total_news: 'Tổng Tin Quét',
    dash_kpi_crisis_alerts: 'Cảnh Báo Nguy Cơ',
    dash_kpi_positive_news: 'Tin Tích Cực',
    dash_kpi_high_impact: 'Tác Động Nghiêm Trọng',
    dash_kpi_average_sentiment: 'Chỉ Số Tâm Lý Thị Trường',
    dash_radar_title: 'Radar Tác Động Điều Hành & Dư Luận',
    dash_radar_desc: 'Giám sát ma trận lan truyền thông tin, rủi ro pháp lý và phản ứng thị trường tài chính.',
    dash_live_pulse: 'Nhịp Đập Thị Trường & Tin Nóng',
    dash_urgent_alerts: 'Cảnh Báo Đột Biến Khẩn Cấp',
    dash_trending_topics: 'Chủ Đề & Từ Khóa Nóng',
    dash_sentiment_distribution: 'Phân Bổ Sắc Thái Báo Chí',
    dash_leadership_briefing: 'Bản Tin Tham Mưu Tác Chiến Lãnh Đạo',

    // Language Switcher
    lang_vi: 'Tiếng Việt',
    lang_en: 'English',
    lang_switch_tooltip: 'Chuyển đổi ngôn ngữ giao diện (Tiếng Việt / English - Alt+L)',

    // Modals & Tools
    cmd_search_title: 'Tìm kiếm nhanh & Danh mục Lệnh',
    cmd_search_subtitle: 'Nhập từ khóa bài viết, điều hướng tab, hoặc lệnh quản trị',
    cmd_switch_lang: 'Chuyển đổi Ngôn ngữ (Language: Tiếng Việt / English)',
    cmd_shortcuts: 'Bảng phím tắt điều hướng nhanh',
    modal_export_title: 'Xuất Báo Cáo Social Listening Bộ Tài Chính',
    modal_export_subtitle: 'Tải trọn bộ dữ liệu phân tích, biểu đồ và tham mưu lãnh đạo dưới định dạng PDF, Excel hoặc JSON',
    modal_weights_title: 'Cấu Hình Hệ Số Trọng Số MoF',
    modal_triggers_title: 'Thiết Lập Ngưỡng Cảnh Báo Đột Biến',
    modal_advisor_title: 'Trợ Lý Tham Mưu Chiến Lược (AI Advisor)',
    modal_video_title: 'Tạo Video Tóm Tắt Tin Tức VEO 3',
    modal_gmail_title: 'Trung Tâm Cảnh Báo Khẩn Cấp Qua Gmail',

    // Fine-Tuning Studio
    ft_title: 'Fine-Tuning Studio & Huấn Luyện Trực Tiếp',
    ft_subtitle: 'Huấn luyện mô hình LLM chuyên sâu đạt chuẩn Cố vấn Điều hành Chiến lược Bộ Tài chính & Phân tích Tác động Đa tầng 4 bước.',
    ft_tab_dataset: '1. Kho Dữ Liệu 1.000 Mẫu',
    ft_tab_training: '2. Trình Huấn Luyện Trực Tiếp (Live Engine)',
    ft_tab_arena: '3. Đấu Trường So Sánh (Base vs. Tuned)',
    ft_tab_deployment: '4. Triển Khai & RAG Booster',
    ft_samples_live: '1.000 Samples Live',
    ft_download_jsonl: 'Tải Dataset (.JSONL)',
    ft_download_csv: 'Xuất Bảng Excel (.CSV)',
    ft_start_training: 'Bắt Đầu Huấn Luyện Trực Tiếp (LoRA)',
    ft_training_running: 'Đang Huấn Luyện',
    ft_base_vs_tuned: 'So Sánh Đối Đầu (Side-by-Side)',
    ft_rag_booster: 'Cấu Hình Dynamic Few-Shot RAG Booster',

    // View Density Modes
    view_executive: 'Lãnh đạo',
    view_standard: 'Chuẩn',
    view_deep: 'Chuyên sâu',
  },

  en: {
    // Navigation & Tabs
    nav_dashboard: 'Executive Dashboard',
    nav_dashboard_sub: 'Real-time KPIs & Critical Alerts',
    nav_table: 'Article Management',
    nav_table_sub: 'News stream & multi-tier impact table',
    nav_database: 'Database Explorer',
    nav_database_sub: 'Storage & multi-dimensional queries',
    nav_sources: 'Media Sources (30+)',
    nav_sources_sub: '30+ Realtime Financial Portals & RSS',
    nav_briefing: 'Leadership Advisory',
    nav_briefing_sub: '6W Analysis & Strategic Statements',
    nav_knowledge: 'RAG Knowledge Base',
    nav_knowledge_sub: 'Regulatory documents & PDF ingestion',
    nav_finetune: 'Fine-Tuning Studio',
    nav_finetune_sub: '1,000 Expert Samples & Live Training',
    nav_graph: 'Knowledge Graph',
    nav_graph_sub: 'Entity network & contagion ripple map',
    nav_triggers: 'Thresholds & Triggers',
    nav_triggers_sub: 'Spike detector & simulator',
    nav_keywords: 'MoF Keyword Weights',
    nav_keywords_sub: 'Priority scoring algorithms',
    nav_dictionary: 'Semantic Dict & MoF 2026',
    nav_dictionary_sub: 'Synonyms & 16 sectors mapping',
    nav_analytics: 'Analytics & Trends',
    nav_analytics_sub: 'Sentiment velocities & trend forecasts',
    nav_reports: 'Export Reports',
    nav_reports_sub: 'Download PDF, Snapshot, CSV',

    // Header & Status
    header_system_status: 'System Status:',
    header_status_stable: 'Operational',
    header_last_updated: 'Last Updated:',
    header_not_scanned: 'Not Scanned',
    header_version: 'Version:',
    header_scan_session: 'Scan Session:',
    header_auto_scan: 'Auto-Scan:',
    header_auto_scan_off: 'Off (Manual only)',
    header_auto_scan_15m: 'Every 15m',
    header_auto_scan_30m: 'Every 30m',
    header_auto_scan_45m: 'Every 45m',
    header_auto_scan_60m: 'Every 60m',
    header_search_placeholder: 'Search articles & entities... (Ctrl+K)',
    header_theme_light: 'Light',
    header_theme_dark: 'Dark',
    header_theme_toggle_tip: 'Toggle Light / Dark Theme (Alt+T)',
    header_mof_weights: 'MoF Weights',
    header_alert_triggers: 'Alert Triggers',
    header_advisor_assistant: 'AI Advisor',
    header_video_ai: 'Create AI Video',
    header_gmail_alert: '🚨 Send Gmail Alert',
    header_export_report: 'Export Report',
    header_scan_now: 'Scan Now',
    header_scanning: 'Scraping live feeds...',
    header_last_scanned: 'Last Scanned:',
    header_total_articles: 'Total Articles:',
    header_next_scan: 'Next Auto-Scan:',
    header_news_source_desc: 'Sources: Google Realtime Search & VN Financial Press RSS',

    // Quick Tabs
    tab_quick_dashboard: 'Dashboard',
    tab_quick_table: 'Table View',
    tab_quick_briefing: 'Leadership Briefing',
    tab_quick_analytics: 'Analytics',
    tab_quick_finetune: 'Fine-Tuning',
    tab_quick_database: 'Database',
    tab_quick_sources: 'Media Sources',
    tab_quick_graph: 'Knowledge Graph',

    // Common Actions
    action_copy: 'Copy',
    action_copied: 'Copied!',
    action_download: 'Download',
    action_close: 'Close',
    action_save: 'Save Changes',
    action_reset: 'Reset Defaults',
    action_search: 'Search',
    action_filter: 'Filter',
    action_clear_filter: 'Clear Filter',
    action_export: 'Export Data',
    action_view_detail: 'View Details',
    action_run_test: 'Run Test',
    action_compare: 'Compare',
    action_refresh: 'Refresh',
    action_expand: 'Expand',
    action_collapse: 'Collapse',

    // Sentiment & Impact
    sentiment_all: 'All Sentiments',
    sentiment_positive: 'Bullish (Positive Amplification)',
    sentiment_negative: 'Bearish (Risk / Warning)',
    sentiment_neutral: 'Neutral / Multi-faceted',
    impact_high: 'High Impact',
    impact_medium: 'Medium Impact',
    impact_low: 'Low Impact',
    danger_crisis: 'Crisis / Risks',
    positive_highlights: 'Highlights',

    // Sectors
    sector_all: 'All Sectors',
    sector_tax: 'Tax & Budget Revenue',
    sector_customs: 'Customs & Trade',
    sector_bonds: 'Bonds (Corporate & Gov)',
    sector_stocks: 'Stock Market (SSC)',
    sector_treasury_budget: 'Treasury & State Budget',
    sector_public_investment: 'Public Investment & Capital',
    sector_price_management: 'Price Control & Stabilization',
    sector_insurance: 'Insurance & Supervision',
    sector_state_economy: 'State Enterprises & SCIC',
    sector_public_debt: 'Public Debt & Foreign Finance',
    sector_public_assets: 'Public Assets & Auctions',
    sector_inspection_audit: 'Financial Inspection & Audit',
    sector_national_reserve: 'National Reserves',
    sector_banking_credit: 'Banking & Credit Rates',
    sector_realestate: 'Real Estate & Land Policy',
    sector_gold: 'Gold & Precious Metals',
    sector_forex: 'Forex & Exchange Rate',
    sector_fdi: 'Foreign Direct Investment (FDI)',
    sector_crypto: 'Crypto & Digital Assets',
    sector_macro: 'GDP Growth & Macroeconomics',
    sector_enterprise: 'Listed Enterprises & M&A',
    sector_collective_economy: 'Cooperatives & Collective',
    sector_fintech_digital: 'Digital Finance & E-Commerce Tax',
    sector_policy: 'Policy & Regulatory Framework',
    sector_people: 'Regulators & Key Figures',

    // Dashboard Metrics & Titles
    dash_kpi_total_news: 'Total Scanned Articles',
    dash_kpi_crisis_alerts: 'Crisis & Risk Alerts',
    dash_kpi_positive_news: 'Positive Signals',
    dash_kpi_high_impact: 'Severe Impact Articles',
    dash_kpi_average_sentiment: 'Market Sentiment Index',
    dash_radar_title: 'Executive Impact & Public Opinion Radar',
    dash_radar_desc: 'Monitoring information contagion, legal risk matrices, and financial market reactions.',
    dash_live_pulse: 'Market Pulse & Breaking News',
    dash_urgent_alerts: 'Urgent Anomaly Alerts',
    dash_trending_topics: 'Trending Topics & Keywords',
    dash_sentiment_distribution: 'Media Sentiment Distribution',
    dash_leadership_briefing: 'Strategic Leadership Action Briefing',

    // Language Switcher
    lang_vi: 'Vietnamese',
    lang_en: 'English',
    lang_switch_tooltip: 'Switch Interface Language (Vietnamese / English - Alt+L)',

    // Modals & Tools
    cmd_search_title: 'Command Palette & Quick Search',
    cmd_search_subtitle: 'Type article keywords, jump to tabs, or trigger executive workflows',
    cmd_switch_lang: 'Switch Language (Tiếng Việt / English)',
    cmd_shortcuts: 'Keyboard Navigation Shortcuts',
    modal_export_title: 'Export Ministry Social Listening Report',
    modal_export_subtitle: 'Download complete analytic datasets, charts, and executive directives in PDF, Excel, or JSON format',
    modal_weights_title: 'MoF Keyword Weight Configurations',
    modal_triggers_title: 'Anomaly Alert Thresholds & Simulator',
    modal_advisor_title: 'Strategic Leadership AI Advisor',
    modal_video_title: 'Generate VEO 3 AI Video News Summary',
    modal_gmail_title: 'Emergency Gmail Dispatch Center',

    // Fine-Tuning Studio
    ft_title: 'Fine-Tuning Studio & Live Model Training',
    ft_subtitle: 'Train domain-adapted LLMs conforming to MoF Executive Strategic Advisor standards & 4-step Multi-tier Impact Analysis.',
    ft_tab_dataset: '1. Dataset Explorer (1,000 Samples)',
    ft_tab_training: '2. Live Training Engine (LoRA Pipeline)',
    ft_tab_arena: '3. Model Evaluation Arena (Base vs. Tuned)',
    ft_tab_deployment: '4. Deployment & RAG Booster',
    ft_samples_live: '1,000 Samples Live',
    ft_download_jsonl: 'Download Dataset (.JSONL)',
    ft_download_csv: 'Export Spreadsheet (.CSV)',
    ft_start_training: 'Start Live Training (LoRA)',
    ft_training_running: 'Training in Progress',
    ft_base_vs_tuned: 'Side-by-Side Model Arena',
    ft_rag_booster: 'Dynamic Few-Shot RAG Booster Setup',

    // View Density Modes
    view_executive: 'Executive',
    view_standard: 'Standard',
    view_deep: 'Deep-Dive',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
  isVietnamese: boolean;
  isEnglish: boolean;
  dict: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: keyof Translations) => key as string,
  isVietnamese: true,
  isEnglish: false,
  dict: translations.vi,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('finpulse_language') as Language;
      if (saved === 'vi' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'vi';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('finpulse_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi';
      try {
        localStorage.setItem('finpulse_language', next);
        document.documentElement.lang = next;
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dict = useMemo(() => translations[language], [language]);

  const t = useCallback((key: keyof Translations, params?: Record<string, string | number>): string => {
    let text = dict[key] || translations.vi[key] || (key as string);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return text;
  }, [dict]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isVietnamese: language === 'vi',
        isEnglish: language === 'en',
        dict,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);
