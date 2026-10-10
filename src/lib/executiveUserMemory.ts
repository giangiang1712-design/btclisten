import {
  saveExecutiveProfileToCloud,
  addPinnedDirectiveToCloud,
  removePinnedDirectiveFromCloud,
  savePinnedDirectivesToCloud,
  isCloudDatabaseActive
} from './firebase';

export interface ExecutiveUserProfile {
  id: string;
  fullName: string;
  roleId: 'minister_deputy' | 'chief_of_staff' | 'budget_planning_head' | 'price_mgmt_head' | 'ssc_chairman' | 'tax_customs_head' | 'general_analyst';
  roleNameVi: string;
  department: string;
  briefingPreference: 'quick_bullets' | 'comprehensive_detailed' | 'crisis_action_oriented';
  prioritySectors: string[];
  lastUpdated: number;
}

export interface PinnedDirectiveNote {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  category: 'chi_dao_lanh_dao' | 'ket_luan_giao_ban' | 'van_ban_phap_ly' | 'luu_y_dac_biet';
  sourceSessionId?: string;
  tags?: string[];
}

export interface ConversationMemoryState {
  profile: ExecutiveUserProfile;
  pinnedDirectives: PinnedDirectiveNote[];
  accumulatedTakeaways: string[];
  lastActiveSessionId?: string;
}

const STORAGE_KEY_USER_PROFILE = 'finpulse_executive_user_profile';
const STORAGE_KEY_PINNED_DIRECTIVES = 'finpulse_pinned_directives';
const STORAGE_KEY_SESSION_TAKEAWAYS = 'finpulse_session_takeaways';

export const DEFAULT_EXECUTIVE_PROFILE: ExecutiveUserProfile = {
  id: 'mof_exec_01',
  fullName: 'Lãnh đạo Bộ & Ban Tham mưu Tổng hợp',
  roleId: 'minister_deputy',
  roleNameVi: 'Lãnh đạo Bộ Tài chính (Bộ trưởng / Thứ trưởng)',
  department: 'Văn phòng Bộ Tài chính - Ban Thư ký & Tổng hợp',
  briefingPreference: 'comprehensive_detailed',
  prioritySectors: ['tax', 'customs', 'stocks', 'bonds', 'treasury', 'prices'],
  lastUpdated: Date.now()
};

export const AVAILABLE_EXECUTIVE_ROLES = [
  {
    id: 'minister_deputy',
    nameVi: 'Lãnh đạo Bộ Tài chính (Bộ trưởng / Thứ trưởng)',
    department: 'Lãnh đạo Bộ Tài chính',
    description: 'Ưu tiên báo cáo vĩ mô, cân đối thu chi ngân sách, kiểm soát an toàn nợ công và chỉ đạo chiến lược',
    defaultBriefing: 'comprehensive_detailed' as const,
    defaultSectors: ['tax', 'customs', 'stocks', 'bonds', 'treasury', 'prices']
  },
  {
    id: 'chief_of_staff',
    nameVi: 'Chánh Văn phòng Bộ / Vụ trưởng Vụ Tổng hợp',
    department: 'Văn phòng Bộ Tài chính',
    description: 'Theo dõi tiến độ xử lý công vụ, phát ngôn báo chí, xử lý tin đồn và các cuộc họp giao ban',
    defaultBriefing: 'crisis_action_oriented' as const,
    defaultSectors: ['crisis', 'tax', 'stocks', 'bonds']
  },
  {
    id: 'budget_planning_head',
    nameVi: 'Vụ trưởng Vụ Kế hoạch - Tài chính & Ngân sách (NSNN)',
    department: 'Vụ Ngân sách Nhà nước & Kho bạc',
    description: 'Chuyên sâu về tiến độ giải ngân vốn đầu tư công, trần bội chi NSNN và dự toán thu chi',
    defaultBriefing: 'quick_bullets' as const,
    defaultSectors: ['treasury', 'budget', 'macro']
  },
  {
    id: 'ssc_chairman',
    nameVi: 'Lãnh đạo Ủy ban Chứng khoán Nhà nước (UBCKNN)',
    department: 'Ủy ban Chứng khoán Nhà nước',
    description: 'Giám sát giao dịch thị trường cổ phiếu, trái phiếu, KRX, Non-prefunding và nâng hạng thị trường',
    defaultBriefing: 'comprehensive_detailed' as const,
    defaultSectors: ['stocks', 'bonds']
  },
  {
    id: 'tax_customs_head',
    nameVi: 'Lãnh đạo Cục Thuế & Tổng cục Hải quan',
    department: 'Cục Thuế / Tổng cục Hải quan',
    description: 'Quản lý thu ngân sách, hóa đơn điện tử, hoàn thuế VAT, thông quan xuất nhập khẩu và chống buôn lậu',
    defaultBriefing: 'crisis_action_oriented' as const,
    defaultSectors: ['tax', 'customs']
  },
  {
    id: 'price_mgmt_head',
    nameVi: 'Cục trưởng Cục Quản lý Giá',
    department: 'Cục Quản lý Giá',
    description: 'Giám sát chỉ số CPI, giá xăng dầu, thị trường vàng SJC, điện thoại, vật tư y tế và hàng hóa thiết yếu',
    defaultBriefing: 'quick_bullets' as const,
    defaultSectors: ['prices', 'macro']
  }
];

export function loadExecutiveProfile(): ExecutiveUserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.roleId) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load user profile from storage:', e);
  }
  return DEFAULT_EXECUTIVE_PROFILE;
}

export function saveExecutiveProfile(profileOrId: ExecutiveUserProfile | string): ExecutiveUserProfile {
  let profileToSave: ExecutiveUserProfile;
  if (typeof profileOrId === 'string') {
    const matchedRole = AVAILABLE_EXECUTIVE_ROLES.find(r => r.id === profileOrId);
    if (matchedRole) {
      profileToSave = {
        id: `exec_${matchedRole.id}`,
        fullName: matchedRole.nameVi,
        roleId: matchedRole.id as any,
        roleNameVi: matchedRole.nameVi,
        department: matchedRole.department,
        briefingPreference: matchedRole.defaultBriefing,
        prioritySectors: matchedRole.defaultSectors,
        lastUpdated: Date.now()
      };
    } else {
      profileToSave = { ...DEFAULT_EXECUTIVE_PROFILE, lastUpdated: Date.now() };
    }
  } else {
    profileToSave = { ...profileOrId, lastUpdated: Date.now() };
  }

  try {
    localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profileToSave));
    if (isCloudDatabaseActive()) {
      saveExecutiveProfileToCloud(profileToSave).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save user profile:', e);
  }
  return profileToSave;
}

export function loadPinnedDirectives(): PinnedDirectiveNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PINNED_DIRECTIVES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load pinned directives:', e);
  }
  // Default Initial Pinned Directives
  return [
    {
      id: 'pinned_dir_01',
      timestamp: Date.now() - 86400000 * 2,
      title: 'Chỉ đạo đẩy nhanh hoàn thuế VAT & Tháo gỡ khó khăn cho DN',
      content: 'Bộ trưởng chỉ đạo Cục Thuế đẩy mạnh ứng dụng AI & cơ sở dữ liệu lớn để đẩy nhanh tốc độ hoàn thuế VAT đúng luật, xử lý nghiêm cán bộ gây phiền hà, nhũng nhiễu.',
      category: 'chi_dao_lanh_dao',
      tags: ['Thuế', 'Hoàn thuế VAT', 'Doanh nghiệp']
    },
    {
      id: 'pinned_dir_02',
      timestamp: Date.now() - 86400000,
      title: 'Triển khai Thông tư 68/2024/TT-BTC về Non-prefunding Nâng hạng TTCK',
      content: 'UBCKNN cùng các CTCK khẩn trương hoàn thiện quy trình quản trị rủi ro thanh toán Non-prefunding, phối hợp cùng FTSE Russell phục vụ kỳ đánh giá nâng hạng.',
      category: 'ket_luan_giao_ban',
      tags: ['UBCKNN', 'Thông tư 68', 'Nâng hạng FTSE']
    }
  ];
}

export function savePinnedDirectives(notes: PinnedDirectiveNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PINNED_DIRECTIVES, JSON.stringify(notes));
    if (isCloudDatabaseActive()) {
      savePinnedDirectivesToCloud(notes).catch(() => {});
    }
  } catch (e) {
    console.warn('Failed to save pinned directives:', e);
  }
}

export function addPinnedDirective(
  noteOrTitle: Omit<PinnedDirectiveNote, 'id' | 'timestamp'> | string,
  category: string = 'chi_dao_lanh_dao',
  _priority?: string
): PinnedDirectiveNote {
  const current = loadPinnedDirectives();
  let newNote: PinnedDirectiveNote;
  if (typeof noteOrTitle === 'string') {
    newNote = {
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      title: noteOrTitle.slice(0, 45),
      content: noteOrTitle,
      category: (category as any) || 'chi_dao_lanh_dao'
    };
  } else {
    newNote = {
      ...noteOrTitle,
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
  }
  const updated = [newNote, ...current];
  savePinnedDirectives(updated);
  if (isCloudDatabaseActive()) {
    addPinnedDirectiveToCloud(newNote).catch(() => {});
  }
  return newNote;
}

export function removePinnedDirective(id: string): PinnedDirectiveNote[] {
  const current = loadPinnedDirectives();
  const updated = current.filter(n => n.id !== id);
  savePinnedDirectives(updated);
  if (isCloudDatabaseActive()) {
    removePinnedDirectiveFromCloud(id).catch(() => {});
  }
  return updated;
}

export function buildExecutiveMemoryPromptContext(
  profile: ExecutiveUserProfile,
  directives: PinnedDirectiveNote[]
): string {
  let text = `\n[BỘ NHỚ NGỮ CẢNH DÀI HẠN & HỒ SƠ LÃNH ĐẠO (EXECUTIVE MEMORY CONTEXT)]:\n`;
  text += `- Người đang tương tác: ${profile.fullName} (${profile.roleNameVi} - ${profile.department})\n`;
  text += `- Phong cách phản hồi ưu tiên: ${
    profile.briefingPreference === 'quick_bullets'
      ? 'Tóm tắt điều hành nhanh 3-5 gạch đầu dòng, trực diện vào số liệu then chốt.'
      : profile.briefingPreference === 'crisis_action_oriented'
      ? 'Tập trung kịch bản phản ứng tác chiến, phương án phát ngôn đính chính và các mốc thời gian xử lý.'
      : 'Báo cáo tham mưu đầy đủ 4 bước, trích dẫn căn cứ pháp lý rõ ràng.'
  }\n`;
  text += `- Lĩnh vực trọng điểm theo dõi: ${profile.prioritySectors.join(', ')}\n\n`;

  if (directives.length > 0) {
    text += `[DANH SÁCH CHỈ ĐẠO & TRỰC NHỚ LÃNH ĐẠO ĐÃ GHIM (${directives.length} kết luận)]:\n`;
    directives.slice(0, 5).forEach((d, i) => {
      text += `${i + 1}. **${d.title}** (${new Date(d.timestamp).toLocaleDateString('vi-VN')}): ${d.content}\n`;
    });
    text += `*(Hãy chủ động liên hệ và bám sát các chỉ đạo đã ghim này khi đưa ra đề xuất giải pháp cho người dùng).*\n`;
  }

  return text;
}

// Backwards compatibility aliases
export type ExecutiveProfile = ExecutiveUserProfile;
export type PinnedDirective = PinnedDirectiveNote;
export const EXECUTIVE_PROFILES = AVAILABLE_EXECUTIVE_ROLES;
export const getActiveExecutiveProfile = loadExecutiveProfile;
export const setActiveExecutiveProfile = saveExecutiveProfile;
export const getPinnedDirectives = loadPinnedDirectives;
export const getExecutiveMemoryContextPrompt = buildExecutiveMemoryPromptContext;


