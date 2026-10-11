import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Upload,
  Layers,
  Sparkles,
  Sliders,
  FileText,
  Tag,
  Shield,
  Building,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Copy,
  Zap,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  BookmarkPlus,
  Landmark,
  Receipt,
  Ship,
  Building2,
  FileCheck,
  Scale,
  Briefcase,
  ShieldCheck,
  Globe,
  Home,
  Package,
  Leaf,
  Cpu,
  GripVertical,
  BarChart3,
  PieChart,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Hash,
  ArrowUpDown,
  Database,
  Table,
  LayoutGrid
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useI18n } from '../lib/i18n';
import { SemanticKeywordGroup, MoFSectorInfo, MOF_2026_SECTORS } from '../types/semanticDictionary';
import { INITIAL_SEMANTIC_GROUPS } from '../data/defaultSemanticDictionary';
import {
  fetchSemanticGroups,
  saveSemanticGroup,
  deleteSemanticGroup,
  toggleSemanticGroupActive,
  resetSemanticDictionaryToDefault,
  syncSemanticDictionary2026,
  testSemanticQuerySandbox,
  importSemanticDictionary,
  fetchAiSemanticSuggestions,
  syncAllSemanticGroupsToCloudDatabase
} from '../services/semanticDictionaryApi';
import { isCloudDatabaseActive, subscribeToCloudSemanticGroups } from '../lib/firebase';

export const SemanticDictionaryAdmin: React.FC = () => {
  const { isDark } = useTheme();
  const { isVietnamese } = useI18n();

  // State
  const [groups, setGroups] = useState<SemanticKeywordGroup[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem('cached_semantic_groups');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return INITIAL_SEMANTIC_GROUPS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing2026, setIsSyncing2026] = useState<boolean>(false);
  const [isSyncingCloudDb, setIsSyncingCloudDb] = useState<boolean>(false);
  const isCloudActive = isCloudDatabaseActive();
  const [viewMode, setViewMode] = useState<'cards' | 'matrix' | 'table'>('table');
  const [showCoverageDashboard, setShowCoverageDashboard] = useState<boolean>(false);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'custom'>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Drag and Drop & Inline Synonym Edit State
  const [draggedSynonym, setDraggedSynonym] = useState<{ groupId: string; index: number; text: string } | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = useState<string | null>(null);
  const [editingSynonym, setEditingSynonym] = useState<{ groupId: string; index: number; value: string } | null>(null);
  const [quickAddInputs, setQuickAddInputs] = useState<{ [groupId: string]: string }>({});

  // Modal State
  const [editingGroup, setEditingGroup] = useState<SemanticKeywordGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI Assistant Drawer & Card Suggestions State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiQuery, setAiQuery] = useState<string>('Lãnh đạo Bộ Tài chính chỉ đạo điều hành');
  const [aiSector, setAiSector] = useState<string>('leadership');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    suggestedName?: string;
    synonyms: string[];
    mustIncludeAny: string[];
    excludeWords: string[];
    targetAgencies: string[];
    targetRegulations: string[];
    boostWeight: number;
    description?: string;
  } | null>(null);

  // Card & Modal AI Loading States
  const [aiCardLoadingId, setAiCardLoadingId] = useState<string | null>(null);
  const [isAiLoadingInModal, setIsAiLoadingInModal] = useState<boolean>(false);
  const [aiSuggestionBadge, setAiSuggestionBadge] = useState<string | null>(null);

  // Form Fields inside Edit Modal
  const [formName, setFormName] = useState('');
  const [formSector, setFormSector] = useState('tax');
  const [formPrimaryKeyword, setFormPrimaryKeyword] = useState('');
  const [formSynonyms, setFormSynonyms] = useState<string[]>([]);
  const [synonymInput, setSynonymInput] = useState('');
  const [formMustInclude, setFormMustInclude] = useState<string[]>([]);
  const [mustIncludeInput, setMustIncludeInput] = useState('');
  const [formExcludeWords, setFormExcludeWords] = useState<string[]>([]);
  const [excludeWordInput, setExcludeWordInput] = useState('');
  const [formBoostWeight, setFormBoostWeight] = useState<number>(2.0);
  const [formTargetAgencies, setFormTargetAgencies] = useState<string[]>([]);
  const [agencyInput, setAgencyInput] = useState('');
  const [formTargetRegulations, setFormTargetRegulations] = useState<string[]>([]);
  const [regulationInput, setRegulationInput] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formModalTab, setFormModalTab] = useState<'core' | 'synonyms' | 'context'>('core');

  // Sandbox State
  const [sandboxQuery, setSandboxQuery] = useState<string>('Thúc đẩy giải ngân vốn đầu tư công cao tốc Bắc Nam');
  const [sandboxLoading, setSandboxLoading] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  // Import JSON state
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load Groups
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetchSemanticGroups();
      if (res.success && Array.isArray(res.groups) && res.groups.length > 0) {
        setGroups(res.groups);
      }
    } catch (err) {
      console.warn('[SemanticDictionaryAdmin] Load data fallback active:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to live changes from Cloud Firestore if active
    const unsubscribe = subscribeToCloudSemanticGroups((cloudGroups) => {
      if (cloudGroups && cloudGroups.length > 0) {
        const map = new Map<string, SemanticKeywordGroup>();
        INITIAL_SEMANTIC_GROUPS.forEach(g => map.set(g.id, { ...g }));
        cloudGroups.forEach(g => map.set(g.id, g));
        setGroups(Array.from(map.values()));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      // Sector filter
      if (selectedSector !== 'all' && g.sector !== selectedSector) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !g.isActive) return false;
      if (statusFilter === 'inactive' && g.isActive) return false;
      if (statusFilter === 'custom' && g.isBuiltIn) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = g.name.toLowerCase().includes(q);
        const inPrimary = g.primaryKeyword.toLowerCase().includes(q);
        const inSynonyms = g.synonyms.some(s => s.toLowerCase().includes(q));
        const inAgencies = (g.contextRules.targetAgencies || []).some(a => a.toLowerCase().includes(q));
        const inRegulations = (g.contextRules.targetRegulations || []).some(r => r.toLowerCase().includes(q));
        const inDesc = (g.contextRules.description || '').toLowerCase().includes(q);
        return inName || inPrimary || inSynonyms || inAgencies || inRegulations || inDesc;
      }
      return true;
    });
  }, [groups, selectedSector, statusFilter, searchQuery]);

  // Statistics & Sector Coverage Analytics
  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter(g => g.isActive).length;
    const totalSynonyms = groups.reduce((acc, g) => acc + (g.synonyms?.length || 0), 0);
    const customCount = groups.filter(g => !g.isBuiltIn).length;
    const activeSectors = new Set(groups.filter(g => g.isActive).map(g => g.sector)).size;
    const totalKeywordsUsed = total + totalSynonyms;
    return { total, active, totalSynonyms, customCount, activeSectors, totalKeywordsUsed };
  }, [groups]);

  // Sector Coverage Breakdown for all 16 MoF sectors
  const sectorCoverageStats = useMemo(() => {
    return MOF_2026_SECTORS.map((sec) => {
      const secGroups = groups.filter((g) => g.sector === sec.id);
      const activeGroups = secGroups.filter((g) => g.isActive);
      const primaryKeywordsCount = secGroups.length;
      const activePrimaryCount = activeGroups.length;
      const synonymsCount = secGroups.reduce((acc, g) => acc + (g.synonyms?.length || 0), 0);
      const activeSynonymsCount = activeGroups.reduce((acc, g) => acc + (g.synonyms?.length || 0), 0);
      const totalKeywords = primaryKeywordsCount + synonymsCount;
      const activeTotalKeywords = activePrimaryCount + activeSynonymsCount;
      const agenciesCount = new Set(secGroups.flatMap(g => g.contextRules?.targetAgencies || [])).size;
      const regulationsCount = new Set(secGroups.flatMap(g => g.contextRules?.targetRegulations || [])).size;
      
      // Calculate coverage benchmark percentage (target ~12 keywords per sector)
      const coveragePercentage = Math.min(100, Math.round((totalKeywords / 12) * 100));
      const status: 'comprehensive' | 'moderate' | 'sparse' =
        totalKeywords >= 8 ? 'comprehensive' : totalKeywords >= 4 ? 'moderate' : 'sparse';

      return {
        sector: sec,
        primaryKeywordsCount,
        activePrimaryCount,
        synonymsCount,
        activeSynonymsCount,
        totalKeywords,
        activeTotalKeywords,
        agenciesCount,
        regulationsCount,
        coveragePercentage,
        status
      };
    });
  }, [groups]);

  // Quick Inline Add Synonym directly on Card
  const handleQuickAddSynonym = async (groupId: string) => {
    const raw = quickAddInputs[groupId]?.trim();
    if (!raw) return;

    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    const newItems = raw.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (newItems.length === 0) return;

    const updatedSynonyms = Array.from(new Set([...targetGroup.synonyms, ...newItems]));
    const updatedGroup: SemanticKeywordGroup = { ...targetGroup, synonyms: updatedSynonyms };

    // Optimistic UI update
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updatedGroup : g)));
    setQuickAddInputs((prev) => ({ ...prev, [groupId]: '' }));

    const res = await saveSemanticGroup(updatedGroup);
    if (res.success) {
      showToast(`Đã thêm ${newItems.length} từ đồng nghĩa vào "${targetGroup.name}"`, 'success');
    } else {
      showToast(res.error || 'Lỗi lưu từ đồng nghĩa', 'error');
      loadData();
    }
  };

  // Quick Remove Synonym directly on Card
  const handleQuickRemoveSynonym = async (groupId: string, index: number) => {
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    const removedText = targetGroup.synonyms[index];
    const updatedSynonyms = targetGroup.synonyms.filter((_, i) => i !== index);
    const updatedGroup: SemanticKeywordGroup = { ...targetGroup, synonyms: updatedSynonyms };

    // Optimistic update
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updatedGroup : g)));

    const res = await saveSemanticGroup(updatedGroup);
    if (res.success) {
      showToast(`Đã xóa cụm từ "${removedText}"`, 'info');
    } else {
      showToast(res.error || 'Lỗi xóa từ đồng nghĩa', 'error');
      loadData();
    }
  };

  // Inline Edit Synonym
  const handleStartInlineEditSynonym = (groupId: string, index: number, value: string) => {
    setEditingSynonym({ groupId, index, value });
  };

  const handleSaveInlineEditSynonym = async () => {
    if (!editingSynonym) return;
    const { groupId, index, value } = editingSynonym;
    const trimmed = value.trim();
    const targetGroup = groups.find((g) => g.id === groupId);

    if (!targetGroup) {
      setEditingSynonym(null);
      return;
    }

    if (!trimmed) {
      handleQuickRemoveSynonym(groupId, index);
      setEditingSynonym(null);
      return;
    }

    if (targetGroup.synonyms[index] === trimmed) {
      setEditingSynonym(null);
      return;
    }

    const updatedSynonyms = [...targetGroup.synonyms];
    updatedSynonyms[index] = trimmed;
    const updatedGroup: SemanticKeywordGroup = { ...targetGroup, synonyms: updatedSynonyms };

    // Optimistic update
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updatedGroup : g)));
    setEditingSynonym(null);

    const res = await saveSemanticGroup(updatedGroup);
    if (res.success) {
      showToast(`Đã cập nhật cụm từ thành "${trimmed}"`, 'success');
    } else {
      showToast(res.error || 'Lỗi cập nhật', 'error');
      loadData();
    }
  };

  // Drag and Drop Handlers for Synonyms
  const handleSynonymDragStart = (
    e: React.DragEvent,
    groupId: string,
    index: number,
    text: string
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId, index, text }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSynonym({ groupId, index, text });
  };

  const handleCardDragOver = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetGroupId !== targetGroupId) {
      setDropTargetGroupId(targetGroupId);
    }
  };

  const handleCardDragLeave = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();
    if (dropTargetGroupId === targetGroupId) {
      setDropTargetGroupId(null);
    }
  };

  const handleCardDrop = async (
    e: React.DragEvent,
    targetGroupId: string,
    targetIndex?: number
  ) => {
    e.preventDefault();
    setDropTargetGroupId(null);

    let dragData = draggedSynonym;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) dragData = JSON.parse(raw);
      } catch (err) {
        // ignore
      }
    }

    if (!dragData) return;

    const { groupId: sourceGroupId, index: sourceIndex, text: draggedText } = dragData;
    setDraggedSynonym(null);

    if (sourceGroupId === targetGroupId) {
      // Reordering within the same group
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      if (!targetGroup) return;
      if (targetIndex === undefined || targetIndex === sourceIndex) return;

      const updatedSynonyms = [...targetGroup.synonyms];
      const [movedItem] = updatedSynonyms.splice(sourceIndex, 1);
      updatedSynonyms.splice(targetIndex, 0, movedItem);
      const updatedGroup: SemanticKeywordGroup = { ...targetGroup, synonyms: updatedSynonyms };

      setGroups((prev) => prev.map((g) => (g.id === targetGroupId ? updatedGroup : g)));
      const res = await saveSemanticGroup(updatedGroup);
      if (res.success) {
        showToast('Đã sắp xếp lại vị trí từ đồng nghĩa', 'success');
      }
    } else {
      // Moving from source group to target group
      const sourceGroup = groups.find((g) => g.id === sourceGroupId);
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      if (!sourceGroup || !targetGroup) return;

      const updatedSourceSynonyms = sourceGroup.synonyms.filter((_, i) => i !== sourceIndex);
      const updatedTargetSynonyms = Array.from(new Set([...targetGroup.synonyms, draggedText]));

      const updatedSourceGroup: SemanticKeywordGroup = { ...sourceGroup, synonyms: updatedSourceSynonyms };
      const updatedTargetGroup: SemanticKeywordGroup = { ...targetGroup, synonyms: updatedTargetSynonyms };

      // Optimistic update
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === sourceGroupId) return updatedSourceGroup;
          if (g.id === targetGroupId) return updatedTargetGroup;
          return g;
        })
      );

      showToast(`Đã chuyển "${draggedText}" sang nhóm "${targetGroup.name}"`, 'success');

      await Promise.all([
        saveSemanticGroup(updatedSourceGroup),
        saveSemanticGroup(updatedTargetGroup)
      ]);
    }
  };

  // Handle Open Create / Edit Modal
  const handleOpenEditModal = (group?: SemanticKeywordGroup) => {
    if (group) {
      setEditingGroup(group);
      setFormName(group.name);
      setFormSector(group.sector);
      setFormPrimaryKeyword(group.primaryKeyword);
      setFormSynonyms([...group.synonyms]);
      setFormMustInclude([...(group.contextRules?.mustIncludeAny || [])]);
      setFormExcludeWords([...(group.contextRules?.excludeWords || [])]);
      setFormBoostWeight(group.contextRules?.boostWeight || 2.0);
      setFormTargetAgencies([...(group.contextRules?.targetAgencies || [])]);
      setFormTargetRegulations([...(group.contextRules?.targetRegulations || [])]);
      setFormDescription(group.contextRules?.description || '');
      setFormIsActive(group.isActive);
    } else {
      // Default new group
      setEditingGroup(null);
      setFormName('');
      setFormSector(selectedSector !== 'all' ? selectedSector : 'tax');
      setFormPrimaryKeyword('');
      setFormSynonyms([]);
      setFormMustInclude([]);
      setFormExcludeWords([]);
      setFormBoostWeight(2.0);
      const currentSectorObj = MOF_2026_SECTORS.find(s => s.id === (selectedSector !== 'all' ? selectedSector : 'tax'));
      setFormTargetAgencies(currentSectorObj ? [currentSectorObj.department2026] : ['Bộ Tài chính']);
      setFormTargetRegulations([]);
      setFormDescription('');
      setFormIsActive(true);
    }
    setSynonymInput('');
    setMustIncludeInput('');
    setExcludeWordInput('');
    setAgencyInput('');
    setRegulationInput('');
    setFormModalTab('core');
    setIsModalOpen(true);
  };

  // Helper to add tag in forms
  const handleAddTag = (
    inputVal: string,
    setInputVal: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
    const updated = Array.from(new Set([...list, ...parts]));
    setList(updated);
    setInputVal('');
  };

  const handleRemoveTag = (
    index: number,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  // Handle Save Group
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên nhóm từ khóa', 'error');
      setFormModalTab('core');
      return;
    }
    if (!formPrimaryKeyword.trim()) {
      showToast('Vui lòng nhập từ khóa chính', 'error');
      setFormModalTab('core');
      return;
    }

    const sectorObj = MOF_2026_SECTORS.find(s => s.id === formSector);
    const sectorNameVi = sectorObj ? sectorObj.nameVi : 'Thể chế & Chính sách';

    // Flush any typed inputs not yet added as chips
    let finalSynonyms = [...formSynonyms];
    if (synonymInput.trim()) {
      const parts = synonymInput.trim().split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      finalSynonyms = Array.from(new Set([...finalSynonyms, ...parts]));
    }

    let finalMust = [...formMustInclude];
    if (mustIncludeInput.trim()) {
      const parts = mustIncludeInput.trim().split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      finalMust = Array.from(new Set([...finalMust, ...parts]));
    }

    let finalExclude = [...formExcludeWords];
    if (excludeWordInput.trim()) {
      const parts = excludeWordInput.trim().split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      finalExclude = Array.from(new Set([...finalExclude, ...parts]));
    }

    let finalAgencies = [...formTargetAgencies];
    if (agencyInput.trim()) {
      const parts = agencyInput.trim().split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      finalAgencies = Array.from(new Set([...finalAgencies, ...parts]));
    }

    let finalRegulations = [...formTargetRegulations];
    if (regulationInput.trim()) {
      const parts = regulationInput.trim().split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);
      finalRegulations = Array.from(new Set([...finalRegulations, ...parts]));
    }

    const payload: Partial<SemanticKeywordGroup> = {
      id: editingGroup?.id,
      name: formName.trim(),
      sector: formSector,
      sectorNameVi,
      primaryKeyword: formPrimaryKeyword.trim().toLowerCase(),
      synonyms: finalSynonyms,
      contextRules: {
        mustIncludeAny: finalMust,
        excludeWords: finalExclude,
        boostWeight: Number(formBoostWeight) || 2.0,
        targetAgencies: finalAgencies,
        targetRegulations: finalRegulations,
        description: formDescription.trim()
      },
      isActive: formIsActive,
      isBuiltIn: editingGroup ? editingGroup.isBuiltIn : false
    };

    const res = await saveSemanticGroup(payload);
    if (res.success && res.group) {
      showToast(editingGroup ? 'Đã cập nhật nhóm từ khóa' : 'Đã thêm nhóm từ khóa mới', 'success');
      setIsModalOpen(false);
      loadData();
    } else {
      showToast(res.error || 'Lỗi lưu dữ liệu', 'error');
    }
  };

  // Handle Toggle Active
  const handleToggleActive = async (id: string, currentVal: boolean) => {
    // Optimistic UI update
    setGroups(prev => prev.map(g => g.id === id ? { ...g, isActive: !currentVal } : g));
    const res = await toggleSemanticGroupActive(id);
    if (res.success) {
      showToast(`Đã ${!currentVal ? 'bật' : 'tắt'} nhóm từ khóa`, 'info');
    } else {
      showToast('Lỗi thay đổi trạng thái', 'error');
      loadData();
    }
  };

  // Handle Delete Group
  const handleDeleteGroup = async (id: string) => {
    const res = await deleteSemanticGroup(id);
    if (res.success) {
      showToast('Đã xóa nhóm từ khóa', 'success');
      setDeleteConfirmId(null);
      loadData();
    } else {
      showToast(res.error || 'Lỗi xóa nhóm', 'error');
    }
  };

  // Handle Sync 2026 Full Matrix
  const handleSync2026 = async () => {
    setIsSyncing2026(true);
    try {
      const res = await syncSemanticDictionary2026();
      if (res.success) {
        setGroups(res.groups);
        showToast('Đã đồng bộ hóa thành công toàn bộ 40+ nhóm từ khóa & ma trận ánh xạ 2026!', 'success');
      } else {
        showToast(res.error || 'Lỗi đồng bộ hóa', 'error');
      }
    } catch (err: any) {
      showToast('Lỗi máy chủ khi đồng bộ', 'error');
    } finally {
      setIsSyncing2026(false);
    }
  };

  // Handle Manual Bulk Sync to Cloud Firestore Database
  const handleBulkSyncCloudDb = async () => {
    setIsSyncingCloudDb(true);
    try {
      const res = await syncAllSemanticGroupsToCloudDatabase();
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast('Lỗi đồng bộ CSDL đám mây: ' + (err?.message || err), 'error');
    } finally {
      setIsSyncingCloudDb(false);
    }
  };

  // Intelligent 2026 Context & Synonym AI Suggestion Engine for Modal
  const handleAiSuggest2026 = async () => {
    const kw = (formPrimaryKeyword || formName || '').trim();
    const sec = formSector;

    setIsAiLoadingInModal(true);
    setAiSuggestionBadge(null);

    try {
      const res = await fetchAiSemanticSuggestions(kw, sec, formName);
      if (res.success && res.suggestions) {
        const sug = res.suggestions;
        if (sug.suggestedName && !formName.trim()) {
          setFormName(sug.suggestedName);
        }
        setFormSynonyms(prev => Array.from(new Set([...prev, ...(sug.synonyms || [])])));
        setFormMustInclude(prev => Array.from(new Set([...prev, ...(sug.mustIncludeAny || [])])));
        setFormExcludeWords(prev => Array.from(new Set([...prev, ...(sug.excludeWords || [])])));
        setFormTargetAgencies(prev => Array.from(new Set([...prev, ...(sug.targetAgencies || [])])));
        setFormTargetRegulations(prev => Array.from(new Set([...prev, ...(sug.targetRegulations || [])])));
        if (sug.boostWeight) setFormBoostWeight(sug.boostWeight);
        if (sug.description && !formDescription.trim()) setFormDescription(sug.description);

        const badgeMsg = `✨ AI 2026 đã tự động tạo ${sug.synonyms?.length || 0} từ đồng nghĩa, ${sug.targetAgencies?.length || 0} cơ quan tham mưu, ${sug.targetRegulations?.length || 0} văn bản pháp lý!`;
        setAiSuggestionBadge(badgeMsg);
        showToast(badgeMsg, 'success');
      } else {
        showToast(res.error || 'Không lấy được gợi ý AI', 'error');
      }
    } catch (err) {
      showToast('Lỗi khi gọi AI gợi ý', 'error');
    } finally {
      setIsAiLoadingInModal(false);
    }
  };

  // Card level Quick AI Suggest
  const handleCardQuickAiSuggest = async (group: SemanticKeywordGroup) => {
    setAiCardLoadingId(group.id);
    try {
      const res = await fetchAiSemanticSuggestions(group.primaryKeyword, group.sector, group.name);
      if (res.success && res.suggestions?.synonyms) {
        const newSynonyms = res.suggestions.synonyms;
        const updatedSynonyms = Array.from(new Set([...group.synonyms, ...newSynonyms]));
        const updatedAgencies = Array.from(new Set([...(group.contextRules?.targetAgencies || []), ...(res.suggestions.targetAgencies || [])]));
        const updatedRegs = Array.from(new Set([...(group.contextRules?.targetRegulations || []), ...(res.suggestions.targetRegulations || [])]));

        const updatedGroup: SemanticKeywordGroup = {
          ...group,
          synonyms: updatedSynonyms,
          contextRules: {
            ...group.contextRules,
            targetAgencies: updatedAgencies,
            targetRegulations: updatedRegs
          }
        };

        setGroups(prev => prev.map(g => g.id === group.id ? updatedGroup : g));
        const saveRes = await saveSemanticGroup(updatedGroup);
        if (saveRes.success) {
          showToast(`✨ AI 2026 đã bổ sung ${newSynonyms.length} từ đồng nghĩa vào nhóm "${group.name}"`, 'success');
        }
      }
    } catch (err) {
      showToast('Lỗi gợi ý AI cho thẻ này', 'error');
    } finally {
      setAiCardLoadingId(null);
    }
  };

  // Run AI Drawer Generator
  const handleRunAiDrawer = async () => {
    if (!aiQuery.trim()) {
      showToast('Vui lòng nhập từ khóa hoặc chủ đề cần phân tích', 'error');
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetchAiSemanticSuggestions(aiQuery, aiSector);
      if (res.success && res.suggestions) {
        setAiResult(res.suggestions);
        showToast('✨ Trợ lý AI đã phân tích và sinh bộ từ khóa ngữ cảnh thành công!', 'success');
      } else {
        showToast(res.error || 'Lỗi phân tích AI', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ AI', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply AI Drawer Result to create a new group
  const handleApplyAiResultToNewGroup = async () => {
    if (!aiResult) return;
    const secObj = MOF_2026_SECTORS.find(s => s.id === aiSector);
    const newGroup: Partial<SemanticKeywordGroup> = {
      name: aiResult.suggestedName || `Gợi ý AI: ${aiQuery}`,
      sector: aiSector,
      sectorNameVi: secObj?.nameVi || 'Chính sách',
      primaryKeyword: aiQuery.trim().toLowerCase(),
      synonyms: aiResult.synonyms || [],
      contextRules: {
        mustIncludeAny: aiResult.mustIncludeAny || ['Bộ Tài chính'],
        excludeWords: aiResult.excludeWords || [],
        boostWeight: aiResult.boostWeight || 2.5,
        targetAgencies: aiResult.targetAgencies || [],
        targetRegulations: aiResult.targetRegulations || [],
        description: aiResult.description || `Được tạo tự động bởi Trợ lý AI 2026 cho chủ đề "${aiQuery}"`
      },
      isActive: true
    };

    const res = await saveSemanticGroup(newGroup);
    if (res.success && res.group) {
      setGroups(prev => [res.group!, ...prev]);
      showToast(`✨ Đã lưu nhóm từ khóa mới "${res.group.name}" vào Từ điển Ngữ cảnh!`, 'success');
      setIsAiDrawerOpen(false);
      setAiResult(null);
    } else {
      showToast(res.error || 'Lỗi lưu nhóm mới', 'error');
    }
  };

  // Handle Reset to Default
  const handleResetToDefault = async () => {
    setIsLoading(true);
    try {
      const res = await resetSemanticDictionaryToDefault();
      if (res.success) {
        setGroups(res.groups);
        showToast('Đã khôi phục toàn bộ từ điển chuẩn hóa năm 2026 của Bộ Tài chính', 'success');
      } else {
        showToast(res.error || 'Lỗi khôi phục mặc định', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ', 'error');
    } finally {
      setIsLoading(false);
      setIsResetConfirmOpen(false);
    }
  };

  // Handle Run Sandbox Test
  const handleRunSandbox = async (testText?: string) => {
    const q = testText !== undefined ? testText : sandboxQuery;
    if (!q.trim()) return;
    setSandboxLoading(true);
    try {
      const res = await testSemanticQuerySandbox(q);
      if (res.success) {
        setSandboxResult(res.result);
      } else {
        showToast(res.error || 'Lỗi phân tích', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ', 'error');
    } finally {
      setSandboxLoading(false);
    }
  };

  // Handle Import JSON
  const handleProcessImport = async () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setImportError('Dữ liệu JSON phải là một mảng (Array) các nhóm từ khóa.');
        return;
      }
      const res = await importSemanticDictionary(parsed);
      if (res.success) {
        showToast(res.message || `Đã nhập thành công ${res.count} nhóm từ khóa`, 'success');
        setIsImportModalOpen(false);
        setImportJsonText('');
        loadData();
      } else {
        setImportError(res.error || 'Lỗi nhập dữ liệu');
      }
    } catch (err: any) {
      setImportError(`Cú pháp JSON không hợp lệ: ${err.message}`);
    }
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      setImportError(null);
    };
    reader.readAsText(file);
  };

  // Helper to copy search query
  const handleCopyQuery = (queryOrGroup: string | SemanticKeywordGroup) => {
    const text =
      typeof queryOrGroup === 'string'
        ? queryOrGroup
        : `(${[queryOrGroup.primaryKeyword, ...queryOrGroup.synonyms].join(' OR ')})`;
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép chuỗi truy vấn vào clipboard', 'info');
  };

  const getSectorMeta = (sectorId: string) => {
    return MOF_2026_SECTORS.find(s => s.id === sectorId) || {
      id: sectorId,
      nameVi: sectorId,
      nameEn: sectorId,
      department2026: 'Bộ Tài chính',
      iconName: 'Building',
      description: '',
      color: 'slate'
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-semibold border backdrop-blur-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-400'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-white" />}
          {toastMessage.type === 'info' && <Sparkles className="w-5 h-5 text-cyan-300" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Banner: Ministry of Finance 2026 Structure & Semantic Engine */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border relative overflow-hidden transition-all ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border-slate-800 shadow-xl'
            : 'bg-gradient-to-br from-white via-indigo-50/40 to-emerald-50/30 border-slate-200 shadow-md'
        }`}
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                Cơ Cấu Bộ Tài Chính Năm 2026 (Sau Sáp Nhập & Tái Cấu Trúc)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Động Lực Tự Động Hóa Không Cần Sửa Code
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                isCloudActive
                  ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}>
                <Database className="w-3 h-3 text-sky-500" />
                {isCloudActive ? '☁️ CSDL Cloud Firestore: Đã Lưu Trữ Bền Vững' : '💾 Lưu Trữ Cục Bộ + Đám Mây'}
              </span>
            </div>

            <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Quản Trị Từ Điển Đồng Nghĩa & Ánh Xạ Ngữ Cảnh Chuyên Ngành
            </h1>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Mô-đun quản lý động cho phép bạn linh hoạt <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Thêm, Sửa, Xóa và Bật/Tắt</strong> các nhóm từ khóa, mở rộng đồng nghĩa và quy tắc ánh xạ ngữ cảnh (Context Mapping) cho 16 lĩnh vực thuộc thẩm quyền quản lý của Bộ Tài chính năm 2026. Thay đổi được cập nhật tức thì (Hot-Reload) cho bộ máy quét tin và tham mưu.
            </p>
          </div>

          {/* Action Buttons Toolbar - Intelligent Hierarchy */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0">
            {/* Primary & AI Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEditModal()}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Nhóm Từ Khóa</span>
              </button>

              <button
                onClick={() => {
                  setIsAiDrawerOpen(true);
                  if (!aiResult) handleRunAiDrawer();
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95 whitespace-nowrap"
                title="Trợ lý AI Gợi Ý Ngữ Cảnh 2026 - Tự động tạo bộ từ khóa cho bất kỳ chủ đề tài chính nào"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>AI Gợi Ý Ngữ Cảnh</span>
              </button>
            </div>

            {/* Operational & Sync Actions */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={handleSync2026}
                disabled={isSyncing2026}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap border ${
                  isDark
                    ? 'bg-slate-800 text-amber-400 hover:bg-slate-750 border-amber-500/30'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-300'
                }`}
                title="Đồng bộ 40+ nhóm từ khóa & ma trận ánh xạ ngữ cảnh mới nhất năm 2026"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${isSyncing2026 ? 'animate-spin' : ''}`} />
                <span>{isSyncing2026 ? 'Đang đồng bộ...' : 'Đồng Bộ 2026'}</span>
              </button>

              <button
                onClick={handleBulkSyncCloudDb}
                disabled={isSyncingCloudDb}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap border ${
                  isDark
                    ? 'bg-slate-800 text-sky-400 hover:bg-slate-750 border-sky-500/30'
                    : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-300'
                }`}
                title="Lưu trữ & đồng bộ bền vững toàn bộ từ điển lên Cloud Firestore"
              >
                <Database className={`w-3.5 h-3.5 text-sky-500 ${isSyncingCloudDb ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloudDb ? 'Đang lưu...' : 'Lưu Cloud CSDL'}</span>
              </button>

              <button
                onClick={() => {
                  setIsSandboxOpen(true);
                  handleRunSandbox();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap border ${
                  isDark
                    ? 'bg-slate-800 text-indigo-300 hover:bg-slate-750 border-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-200'
                }`}
                title="Thử nghiệm mô phỏng cách hệ thống mở rộng ngữ nghĩa và ánh xạ cơ quan trực thuộc"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Sandbox Test</span>
              </button>

              {/* Utility Icon Group */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <a
                  href="/api/semantic-dictionary/export"
                  download="mof_2026_semantic_dictionary.json"
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  title="Xuất file cấu hình JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    setImportJsonText('');
                    setImportError(null);
                    setIsImportModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  title="Nhập file cấu hình JSON"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Khôi phục về bộ chuẩn hóa 2026 của Bộ Tài chính"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  title="Tải lại dữ liệu"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics & Overview Cards - Pristine Tabular Alignment */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Groups */}
        <div
          className={`p-3.5 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between h-full ${
            isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Nhóm Kích Hoạt
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats.active}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                / {stats.total} nhóm
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((stats.active / Math.max(stats.total, 1)) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">
              {stats.customCount > 0 ? `${stats.customCount} nhóm tự tạo` : 'Bộ chuẩn 2026'}
            </span>
            <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
              {Math.round((stats.active / Math.max(stats.total, 1)) * 100)}%
            </span>
          </div>
        </div>

        {/* Metric 2: Synonyms & Expansions */}
        <div
          className={`p-3.5 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between h-full ${
            isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Từ Đồng Nghĩa Mở Rộng
              </span>
              <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tabular-nums tracking-tight ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {stats.totalSynonyms}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                biến thể
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((stats.totalSynonyms / Math.max(stats.active * 5, 1)) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">Ánh xạ 2 chiều</span>
            <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">
              ~{(stats.totalSynonyms / Math.max(stats.active, 1)).toFixed(1)} từ/nhóm
            </span>
          </div>
        </div>

        {/* Metric 3: Sector Coverage */}
        <div
          className={`p-3.5 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between h-full ${
            isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                16 Lĩnh Vực BTC 2026
              </span>
              <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-xl sm:text-2xl lg:text-3xl font-black font-mono tabular-nums tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {stats.activeSectors}
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono tabular-nums">
                / 16 lĩnh vực
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((stats.activeSectors / 16) * 100))}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="truncate">Độ phủ chuyên ngành</span>
            <span className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-1">
              {Math.round((stats.activeSectors / 16) * 100)}%
            </span>
          </div>
        </div>

        {/* Metric 4: Realtime Engine Status */}
        <div
          className={`p-3.5 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between h-full ${
            isDark ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Đồng Bộ Thời Gian Thực
              </span>
              <div className="p-1.5 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono tabular-nums tracking-tight text-sky-600 dark:text-sky-400">
                100%
              </span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                Hot-Reload
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div className="bg-sky-500 h-full rounded-full w-full" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              Sẵn sàng quét
            </span>
            <span className="font-mono tabular-nums font-bold text-sky-600 dark:text-sky-400 shrink-0 ml-1">
              0ms Delay
            </span>
          </div>
        </div>
      </div>

      {/* 3. Smart Search & 16-Sector Filter Bar */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border space-y-3.5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Top Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhóm từ khóa, từ đồng nghĩa, cơ quan (Tổng cục Thuế, UBCKNN, Kho bạc...), văn bản..."
              className={`w-full pl-10 pr-9 py-2 rounded-xl text-xs sm:text-sm border focus:outline-hidden transition ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs & View Mode */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0 flex-wrap sm:flex-nowrap">
            {/* View Mode Toggle: 3 Modes (Cards, Table, Matrix) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem dạng thẻ chi tiết từng nhóm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thẻ</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem dạng bảng thu gọn thông minh, chống xô lệch"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Bảng gọn</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Xem ma trận bao phủ 16 lĩnh vực của Bộ Tài chính 2026"
              >
                <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Ma trận 16</span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block shrink-0" />

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-black'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Tất cả</span>
                <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tabular-nums ${
                  statusFilter === 'all'
                    ? 'bg-white/20 dark:bg-slate-900/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {groups.length}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>Bật</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tabular-nums ${
                  statusFilter === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {stats.active}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  statusFilter === 'inactive'
                    ? 'bg-slate-700 text-white font-extrabold shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                <span>Tắt</span>
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tabular-nums ${
                  statusFilter === 'inactive'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {stats.total - stats.active}
                </span>
              </button>

              {stats.customCount > 0 && (
                <button
                  onClick={() => setStatusFilter('custom')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                    statusFilter === 'custom'
                      ? 'bg-indigo-600 text-white font-extrabold shadow-xs'
                      : isDark
                      ? 'text-indigo-400 hover:bg-slate-800'
                      : 'text-indigo-700 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>Custom</span>
                  <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold tabular-nums ${
                    statusFilter === 'custom'
                      ? 'bg-indigo-700 text-white'
                      : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400'
                  }`}>
                    {stats.customCount}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 16 MoF 2026 Sectors Pills & Coverage Controls */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-indigo-500" />
                16 Lĩnh Vực Bộ Tài Chính (2026):
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
                {stats.totalKeywordsUsed} từ đang dùng
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCoverageDashboard((prev) => !prev)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                  showCoverageDashboard
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-indigo-300 hover:bg-slate-750 border-slate-700'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                }`}
                title="Mở bảng đo lường chi tiết độ bao phủ từ khóa theo từng lĩnh vực"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Độ bao phủ</span>
                {showCoverageDashboard ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <span className="text-[11px] font-mono tabular-nums text-slate-400 hidden sm:inline">
                Hiển thị: {filteredGroups.length} nhóm
              </span>
            </div>
          </div>

          {/* Collapsible Sector Coverage Dashboard */}
          {showCoverageDashboard && (
            <div
              className={`p-4 rounded-2xl border transition-all animate-fadeIn space-y-3 ${
                isDark ? 'bg-slate-950/70 border-indigo-950/70' : 'bg-slate-50/90 border-indigo-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-500" />
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Thống Kê Chi Tiết Số Lượng Từ Khóa & Độ Bao Phủ (16 Lĩnh Vực BTC)
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> &ge; 8 từ: Toàn diện
                  </span>
                  <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-sky-500" /> 4-7 từ: Đạt chuẩn
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> &lt; 4 từ: Cần bổ sung
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {sectorCoverageStats.map((item) => {
                  const isCurrent = selectedSector === item.sector.id;
                  return (
                    <div
                      key={item.sector.id}
                      onClick={() => setSelectedSector(isCurrent ? 'all' : item.sector.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                          : isDark
                          ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold truncate max-w-[150px] text-slate-800 dark:text-slate-100">
                            {item.sector.nameVi}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono tabular-nums ${
                              item.status === 'comprehensive'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : item.status === 'moderate'
                                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {item.totalKeywords} từ
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 truncate">
                          {item.sector.department2026}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums pt-1">
                          <span>{item.primaryKeywordsCount} nhóm gốc</span>
                          <span>+{item.synonymsCount} đồng nghĩa</span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === 'comprehensive'
                                ? 'bg-emerald-500'
                                : item.status === 'moderate'
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${item.coveragePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Sector Dropdown for Mobile + Clean Tabular Pills for Tablet/Desktop */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mobile Dropdown Selector */}
            <div className="sm:hidden w-full">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="all">Tất cả 16 lĩnh vực ({groups.length} nhóm)</option>
                {MOF_2026_SECTORS.map((sec) => {
                  const secItem = sectorCoverageStats.find((s) => s.sector.id === sec.id);
                  const count = secItem ? secItem.primaryKeywordsCount : 0;
                  return (
                    <option key={sec.id} value={sec.id}>
                      {sec.nameVi} ({count} nhóm)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Desktop & Tablet Sector Pills - Chống gãy dòng & số hiển thị đều đặn */}
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full flex-wrap">
              <button
                onClick={() => setSelectedSector('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                  selectedSector === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-black'
                    : isDark
                    ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>Tất cả</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold tabular-nums ${
                  selectedSector === 'all'
                    ? 'bg-white/20 dark:bg-slate-900/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {groups.length}
                </span>
              </button>

              {MOF_2026_SECTORS.map((sec) => {
                const secItem = sectorCoverageStats.find((s) => s.sector.id === sec.id);
                const count = secItem ? secItem.primaryKeywordsCount : 0;
                const totalKeywords = secItem ? secItem.totalKeywords : 0;
                const isSelected = selectedSector === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSector(sec.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : isDark
                        ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                    title={`${sec.nameVi} (${sec.department2026}) • ${count} nhóm từ khóa • ${totalKeywords} từ đang được sử dụng`}
                  >
                    <span className="truncate max-w-[140px]">{sec.nameVi}</span>
                    <span
                      className={`text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : isDark
                          ? 'bg-slate-900 text-slate-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Groups Management Cards Grid */}
      {isLoading ? (
        <div
          className={`p-16 rounded-3xl border text-center space-y-3 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Đang tải bộ từ điển ngữ cảnh chuyên ngành...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div
          className={`p-16 rounded-3xl border text-center space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Không tìm thấy nhóm từ khóa phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Không có kết quả khớp với bộ lọc hiện tại. Bạn có thể xóa từ khóa tìm kiếm hoặc bấm nút "Thêm Nhóm Từ Khóa" để tạo mới.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSector('all');
                setStatusFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={() => handleOpenEditModal()}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Thêm nhóm từ khóa mới
            </button>
          </div>
        </div>
      ) : viewMode === 'matrix' ? (
        /* 16-Sector Matrix View for Ministry of Finance 2026 */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Ma Trận Ánh Xạ Toàn Diện 16 Lĩnh Vực Quản Lý Bộ Tài Chính (Cập nhật 2026)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
              <span>16 lĩnh vực</span>
              <span>•</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{groups.length} nhóm</span>
              <span>•</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.totalSynonyms} từ đồng nghĩa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MOF_2026_SECTORS.map((sec) => {
              const secGroups = groups.filter((g) => g.sector === sec.id);
              const activeCount = secGroups.filter((g) => g.isActive).length;
              const allSynonyms = Array.from(new Set(secGroups.flatMap((g) => g.synonyms)));
              const allAgencies = Array.from(
                new Set(secGroups.flatMap((g) => g.contextRules?.targetAgencies || []))
              );
              const allRegulations = Array.from(
                new Set(secGroups.flatMap((g) => g.contextRules?.targetRegulations || []))
              );

              return (
                <div
                  key={sec.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50 hover:shadow-lg'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            {sec.id.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono font-bold tabular-nums text-slate-500 dark:text-slate-400">
                            {activeCount}/{secGroups.length} nhóm bật
                          </span>
                        </div>
                        <h3 className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                          {sec.nameVi}
                        </h3>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Landmark className="w-3 h-3" />
                          {sec.department2026}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSector(sec.id);
                          setViewMode('cards');
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer shrink-0"
                        title="Lọc xem chi tiết các nhóm thuộc lĩnh vực này"
                      >
                        Chi tiết &rarr;
                      </button>
                    </div>

                    {/* Primary Keywords in Sector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Nhóm từ khóa cốt lõi:</span>
                        <span className="font-mono tabular-nums px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-500 dark:text-slate-400">
                          {secGroups.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {secGroups.length > 0 ? (
                          secGroups.map((g) => (
                            <span
                              key={g.id}
                              onClick={() => handleOpenEditModal(g)}
                              className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold cursor-pointer transition ${
                                g.isActive
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 line-through'
                              }`}
                              title={`Bấm để chỉnh sửa nhóm "${g.name}"`}
                            >
                              {g.primaryKeyword}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có nhóm từ khóa</span>
                        )}
                      </div>
                    </div>

                    {/* Key Regulations */}
                    {allRegulations.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Căn cứ pháp lý trọng tâm 2026:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {allRegulations.slice(0, 3).map((reg, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 truncate max-w-[220px]"
                              title={reg}
                            >
                              {reg}
                            </span>
                          ))}
                          {allRegulations.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-mono tabular-nums self-center">
                              +{allRegulations.length - 3} nữa
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Target Agencies */}
                    {allAgencies.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Đơn vị phối hợp & trực thuộc:
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {allAgencies.join(' • ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sector Card Footer: Sandbox Trigger */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        const sampleQuery = secGroups[0]?.primaryKeyword || sec.nameVi;
                        setSandboxQuery(sampleQuery);
                        setIsSandboxOpen(true);
                        handleRunSandbox(sampleQuery);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Thử nghiệm Sandbox</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingGroup(null);
                        setFormName(`Theo dõi ${sec.nameVi} 2026`);
                        setFormSector(sec.id);
                        setFormPrimaryKeyword('');
                        setFormSynonyms([]);
                        setFormMustInclude(['Bộ Tài chính', sec.department2026]);
                        setFormExcludeWords([]);
                        setFormBoostWeight(2.2);
                        setFormTargetAgencies([sec.department2026]);
                        setFormTargetRegulations([]);
                        setFormDescription(`Mô đun giám sát dữ liệu chuyên ngành ${sec.nameVi}`);
                        setFormIsActive(true);
                        setFormModalTab('core');
                        setIsModalOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm nhóm</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Intelligent Compact Table View - Chống xô lệch chữ số, hiển thị gọn gàng, tiện quản lý */
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`text-[10px] font-bold uppercase tracking-wider border-b ${
                isDark ? 'bg-slate-950/80 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">STT</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Tên Nhóm & Lĩnh Vực</th>
                  <th className="py-3 px-3.5 min-w-[150px]">Từ Khóa Gốc</th>
                  <th className="py-3 px-3.5 min-w-[240px]">Từ Đồng Nghĩa Mở Rộng</th>
                  <th className="py-3 px-3.5 min-w-[160px] hidden md:table-cell">Cơ Quan Phụ Trách</th>
                  <th className="py-3 px-3 w-20 text-center">Trọng Số</th>
                  <th className="py-3 px-3 w-24 text-center">Trạng Thái</th>
                  <th className="py-3 px-3.5 w-36 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-normal ${
                isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-800'
              }`}>
                {filteredGroups.map((group, idx) => {
                  const secMeta = getSectorMeta(group.sector);
                  return (
                    <tr
                      key={group.id}
                      className={`transition-colors duration-150 ${
                        !group.isActive
                          ? isDark ? 'opacity-50 bg-slate-950/40' : 'opacity-50 bg-slate-50'
                          : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-[11px] text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {group.name}
                            </span>
                            {!group.isBuiltIn && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                Custom
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{secMeta.nameVi}</span>
                            <span>•</span>
                            <span className="font-mono">{secMeta.department2026}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                          {group.primaryKeyword}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1 flex-wrap max-w-sm">
                          {group.synonyms.slice(0, 4).map((syn, sIdx) => (
                            <span
                              key={sIdx}
                              className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {syn}
                            </span>
                          ))}
                          {group.synonyms.length > 4 && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              +{group.synonyms.length - 4}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono ml-1">
                            ({group.synonyms.length} từ)
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 hidden md:table-cell">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">
                          {group.contextRules?.targetAgencies?.join(', ') || secMeta.department2026}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-mono font-bold tabular-nums text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          x{(group.contextRules?.boostWeight || 2.0).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(group.id, group.isActive)}
                          className={`relative inline-flex h-4.5 w-8.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            group.isActive ? 'bg-emerald-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                          }`}
                          title={group.isActive ? 'Bấm để tắt nhóm này' : 'Bấm để kích hoạt nhóm này'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              group.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              const sampleQuery = `${group.primaryKeyword} ${group.synonyms[0] || ''}`;
                              setSandboxQuery(sampleQuery.trim());
                              setIsSandboxOpen(true);
                              handleRunSandbox(sampleQuery.trim());
                            }}
                            className="p-1.5 rounded-lg text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 transition cursor-pointer"
                            title="Chạy mô phỏng Sandbox tra cứu"
                          >
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                          </button>
                          <button
                            onClick={() => handleCopyQuery(group)}
                            className={`p-1.5 rounded-lg text-xs transition cursor-pointer border ${
                              isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                            }`}
                            title="Sao chép truy vấn"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(group)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 border ${
                              isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                            }`}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(group.id)}
                            className={`p-1.5 rounded-lg text-xs transition cursor-pointer border ${
                              isDark ? 'text-rose-400 hover:bg-rose-500/20 border-rose-500/30' : 'text-rose-600 hover:bg-rose-100 border-rose-200'
                            }`}
                            title="Xóa nhóm từ khóa này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={`p-3 border-t flex items-center justify-between text-xs text-slate-500 font-mono ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/60'
          }`}>
            <span>Tổng cộng: {filteredGroups.length} nhóm từ khóa</span>
            <span>Hiển thị theo chuẩn danh mục Bộ Tài chính 2026</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map((group) => {
            const secMeta = getSectorMeta(group.sector);
            const isDropTarget = dropTargetGroupId === group.id;

            return (
              <div
                key={group.id}
                onDragOver={(e) => handleCardDragOver(e, group.id)}
                onDragLeave={(e) => handleCardDragLeave(e, group.id)}
                onDrop={(e) => handleCardDrop(e, group.id)}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative group/card ${
                  isDropTarget
                    ? 'ring-2 ring-indigo-500 border-indigo-500/80 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-lg scale-[1.01]'
                    : !group.isActive
                    ? isDark
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-100/60 border-slate-200 opacity-60'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-lg'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md'
                }`}
              >
                {/* Card Top: Sector Badge, Name & Toggle Switch */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            group.sector === 'leadership'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : group.sector === 'tax'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : group.sector === 'customs'
                              ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
                              : group.sector === 'public_investment'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : group.sector === 'stocks'
                              ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30'
                              : group.sector === 'bonds'
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                              : group.sector === 'price_management'
                              ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'
                              : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
                          }`}
                        >
                          {secMeta.nameVi}
                        </span>

                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {secMeta.department2026}
                        </span>

                        {!group.isBuiltIn && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            Custom
                          </span>
                        )}
                      </div>

                      <h3 className={`text-sm sm:text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {group.name}
                      </h3>
                    </div>

                    {/* Active Toggle Switch & Boost Weight */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-bold tabular-nums text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        x{group.contextRules?.boostWeight || 2.0}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(group.id, group.isActive)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          group.isActive ? 'bg-emerald-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                        }`}
                        title={group.isActive ? 'Bấm để tắt nhóm này' : 'Bấm để kích hoạt nhóm này'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            group.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Primary Keyword Banner */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Từ khóa gốc:</span>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono truncate">
                        "{group.primaryKeyword}"
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyQuery(group)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                      title="Sao chép từ khóa"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Synonyms Chips Container with Drag-and-Drop & Quick Inline Edit */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Mở rộng đồng nghĩa</span>
                        <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold tabular-nums bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                          {group.synonyms.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCardQuickAiSuggest(group)}
                          disabled={aiCardLoadingId === group.id}
                          className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0"
                          title="Bấm để AI sinh thêm từ đồng nghĩa 2026 cho nhóm này"
                        >
                          <Sparkles className={`w-3 h-3 text-amber-500 ${aiCardLoadingId === group.id ? 'animate-spin' : ''}`} />
                          <span>{aiCardLoadingId === group.id ? 'Đang tạo...' : 'AI Gợi Ý'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 min-h-[44px] p-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                      {group.synonyms.map((syn, idx) => {
                        const isEditingThis = editingSynonym?.groupId === group.id && editingSynonym?.index === idx;

                        if (isEditingThis) {
                          return (
                            <div key={idx} className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-indigo-500 shadow-xs">
                              <input
                                type="text"
                                autoFocus
                                value={editingSynonym.value}
                                onChange={(e) => setEditingSynonym({ ...editingSynonym, value: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineEditSynonym();
                                  if (e.key === 'Escape') setEditingSynonym(null);
                                }}
                                onBlur={handleSaveInlineEditSynonym}
                                className="px-2 py-0.5 text-xs font-mono font-medium outline-none bg-transparent w-28 text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSaveInlineEditSynonym(); }}
                                className="p-1 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <span
                            key={idx}
                            draggable
                            onDragStart={(e) => handleSynonymDragStart(e, group.id, idx, syn)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleCardDrop(e, group.id, idx);
                            }}
                            onDoubleClick={() => handleStartInlineEditSynonym(group.id, idx, syn)}
                            className={`group/syn text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition cursor-grab active:cursor-grabbing select-none hover:shadow-xs ${
                              isDark
                                ? 'bg-slate-800/90 hover:bg-slate-750 border-slate-700/80 text-slate-200 hover:border-indigo-500/50'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-300'
                            }`}
                            title="Kéo thả sang vị trí khác, hoặc nhấp đúp để sửa trực tiếp"
                          >
                            <GripVertical className="w-3 h-3 text-slate-400 group-hover/syn:text-indigo-500 transition shrink-0" />
                            <span>{syn}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRemoveSynonym(group.id, idx);
                              }}
                              className="w-4 h-4 rounded-full flex items-center justify-center opacity-40 group-hover/syn:opacity-100 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                              title="Xóa từ đồng nghĩa này"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        );
                      })}

                      {/* Quick Add Input Field */}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="+ Thêm từ đồng nghĩa..."
                          value={quickAddInputs[group.id] || ''}
                          onChange={(e) => setQuickAddInputs({ ...quickAddInputs, [group.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickAddSynonym(group.id);
                            }
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 bg-transparent focus:bg-white dark:focus:bg-slate-900 outline-none text-slate-700 dark:text-slate-300 w-36 placeholder:text-slate-400 placeholder:text-[11px] transition"
                        />
                        {quickAddInputs[group.id]?.trim() && (
                          <button
                            type="button"
                            onClick={() => handleQuickAddSynonym(group.id)}
                            className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Context Rules & Targeting Info */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    {/* Target Agencies */}
                    {group.contextRules?.targetAgencies && group.contextRules.targetAgencies.length > 0 && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-400 shrink-0">Cơ quan phụ trách:</span>
                        <span className="font-medium truncate">
                          {group.contextRules.targetAgencies.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Target Regulations */}
                    {group.contextRules?.targetRegulations && group.contextRules.targetRegulations.length > 0 && (
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="font-semibold text-slate-400 shrink-0">Căn cứ pháp lý:</span>
                        <span className="font-medium truncate">
                          {group.contextRules.targetRegulations.join(' • ')}
                        </span>
                      </div>
                    )}

                    {/* Exclude / Must conditions */}
                    {((group.contextRules?.mustIncludeAny && group.contextRules.mustIncludeAny.length > 0) ||
                      (group.contextRules?.excludeWords && group.contextRules.excludeWords.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {group.contextRules.mustIncludeAny && group.contextRules.mustIncludeAny.length > 0 && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            Bắt buộc: {group.contextRules.mustIncludeAny.join(', ')}
                          </span>
                        )}
                        {group.contextRules.excludeWords && group.contextRules.excludeWords.length > 0 && (
                          <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            Loại trừ: {group.contextRules.excludeWords.join(', ')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const sampleQuery = `${group.primaryKeyword} ${group.synonyms[0] || ''}`;
                        setSandboxQuery(sampleQuery.trim());
                        setIsSandboxOpen(true);
                        handleRunSandbox(sampleQuery.trim());
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition"
                      title="Mở mô phỏng sandbox kiểm tra truy vấn cho nhóm này"
                    >
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Sandbox</span>
                    </button>

                    <button
                      onClick={() => handleCopyQuery(group)}
                      className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                        isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Sao chép toàn bộ biểu thức truy vấn OR cho Google/Crawler"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(group.id)}
                      className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                        isDark ? 'text-rose-400 hover:bg-rose-500/20' : 'text-rose-600 hover:bg-rose-100'
                      }`}
                      title="Xóa nhóm từ khóa này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: Thêm / Sửa Nhóm Từ Khóa (Add/Edit Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingGroup ? 'Chỉnh Sửa Nhóm Từ Khóa Chuyên Ngành' : 'Thêm Nhóm Từ Khóa & Ngữ Cảnh Mới'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cấu trúc thẩm quyền Bộ Tài chính năm 2026
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiSuggest2026}
                  disabled={isAiLoadingInModal}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition transform active:scale-95 shrink-0"
                  title="Bấm để AI tự động phân tích và sinh danh sách từ đồng nghĩa, cơ quan tham mưu & căn cứ pháp lý năm 2026"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAiLoadingInModal ? 'animate-spin' : ''}`} />
                  <span>{isAiLoadingInModal ? 'Đang tạo bằng AI...' : '✨ AI Gợi Ý Ngữ Cảnh 2026'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setFormModalTab('core')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  formModalTab === 'core'
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                1. Thông tin cốt lõi
              </button>
              <button
                type="button"
                onClick={() => setFormModalTab('synonyms')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  formModalTab === 'synonyms'
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <span>2. Từ đồng nghĩa mở rộng</span>
                <span className="text-[10px] font-mono font-bold tabular-nums px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  {formSynonyms.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFormModalTab('context')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  formModalTab === 'context'
                    ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                3. Quy tắc ngữ cảnh & Đơn vị BTC
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {aiSuggestionBadge && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-indigo-500/15 border border-violet-500/30 text-xs font-semibold text-violet-800 dark:text-violet-200 flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{aiSuggestionBadge}</span>
                  </div>
                  <button type="button" onClick={() => setAiSuggestionBadge(null)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer">✕</button>
                </div>
              )}
              {/* TAB 1: CORE INFO */}
              {formModalTab === 'core' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Group Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Tên Nhóm Từ Khóa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ví dụ: Nâng hạng TTCK (FTSE Russell / MSCI) & Non-prefunding"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                      }`}
                    />
                  </div>

                  {/* 16 MoF Sectors Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Lĩnh Vực Trực Thuộc / Quản Lý Năm 2026 <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] font-normal text-slate-400">16 Lĩnh vực chuẩn hóa</span>
                    </label>
                    <select
                      value={formSector}
                      onChange={(e) => {
                        const newSec = e.target.value;
                        setFormSector(newSec);
                        const secObj = MOF_2026_SECTORS.find(s => s.id === newSec);
                        if (secObj && formTargetAgencies.length === 0) {
                          setFormTargetAgencies([secObj.department2026]);
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden cursor-pointer ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                      }`}
                    >
                      {MOF_2026_SECTORS.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.nameVi} ({sec.department2026})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Keyword */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Từ Khóa Gốc / Chính (Primary Keyword) <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAiSuggest2026}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                        title="Tự động sinh từ đồng nghĩa, cơ quan trực thuộc và văn bản quy phạm pháp luật năm 2026"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>✨ AI Gợi Ý Ngữ Cảnh 2026</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formPrimaryKeyword}
                      onChange={(e) => setFormPrimaryKeyword(e.target.value)}
                      placeholder="Ví dụ: nâng hạng thị trường"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border focus:outline-hidden ${
                        isDark ? 'bg-slate-950 border-slate-700 text-emerald-400 focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-emerald-700 focus:border-emerald-600 focus:bg-white'
                      }`}
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Từ khóa cốt lõi dùng để kích hoạt các nhánh từ đồng nghĩa và phân luồng dữ liệu.
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Ghi Chú Nghiệp Vụ & Hướng Dẫn Tham Mưu
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả mục tiêu giám sát, đầu mối phụ trách hoặc lưu ý quan trọng khi theo dõi tin tức cụm này..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                      }`}
                    />
                  </div>

                  {/* Active Switch in Form */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Kích hoạt nhóm này ngay</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Nếu tắt, cụm từ này sẽ tạm thời không tham gia mở rộng tìm kiếm.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        formIsActive ? 'bg-emerald-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          formIsActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SYNONYMS */}
              {formModalTab === 'synonyms' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Thêm Từ Đồng Nghĩa / Mở Rộng Truy Vấn</span>
                      <span className="text-[10px] font-normal text-slate-400">Nhấn Enter hoặc dấu phẩy để thêm</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={synonymInput}
                        onChange={(e) => setSynonymInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag(synonymInput, setSynonymInput, formSynonyms, setFormSynonyms);
                          }
                        }}
                        placeholder="Nhập từ đồng nghĩa (vd: non-prefunding, ftse russell, msci...)"
                        className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600 focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(synonymInput, setSynonymInput, formSynonyms, setFormSynonyms)}
                        className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition shrink-0"
                      >
                        Thêm Tag
                      </button>
                    </div>
                  </div>

                  {/* Chips Grid */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Danh sách từ đồng nghĩa ({formSynonyms.length}):
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl border min-h-[140px] max-h-60 overflow-y-auto flex flex-wrap gap-2 content-start custom-scrollbar ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {formSynonyms.map((syn, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                        >
                          <span>{syn}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx, formSynonyms, setFormSynonyms)}
                            className="hover:text-rose-500 cursor-pointer transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}

                      {formSynonyms.length === 0 && (
                        <div className="text-xs text-slate-400 p-4 text-center w-full">
                          Chưa có từ đồng nghĩa nào. Hãy gõ từ khóa vào ô bên trên và nhấn Enter.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Preset Helper */}
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Mẹo mở rộng ngữ nghĩa:
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      Bạn có thể dán một đoạn văn bản có nhiều từ khóa cách nhau bởi dấu phẩy (,), hệ thống sẽ tự động bóc tách thành các từ đồng nghĩa độc lập.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTEXT RULES & TARGETING */}
              {formModalTab === 'context' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Boost Weight Slider */}
                  <div className="space-y-2 p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Hệ Số Trọng Số Ưu Tiên (Boost Weight):</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono text-sm font-black">
                        x{formBoostWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={formBoostWeight}
                      onChange={(e) => setFormBoostWeight(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>1.0x (Bình thường)</span>
                      <span>2.0x (Trọng tâm)</span>
                      <span>3.0x (Tối thượng / Khẩn)</span>
                    </div>
                  </div>

                  {/* Target Agencies */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cơ Quan / Đơn Vị Trực Thuộc Phụ Trách (Target Agencies)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={agencyInput}
                        onChange={(e) => setAgencyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag(agencyInput, setAgencyInput, formTargetAgencies, setFormTargetAgencies);
                          }
                        }}
                        placeholder="Vd: Tổng cục Thuế, UBCKNN, Kho bạc Nhà nước..."
                        className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(agencyInput, setAgencyInput, formTargetAgencies, setFormTargetAgencies)}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer shrink-0"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formTargetAgencies.map((ag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30"
                        >
                          <span>{ag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx, formTargetAgencies, setFormTargetAgencies)}
                            className="hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Target Regulations */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Căn Cứ Pháp Lý & Văn Bản Quy Phạm Pháp Luật (Regulations)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={regulationInput}
                        onChange={(e) => setRegulationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag(regulationInput, setRegulationInput, formTargetRegulations, setFormTargetRegulations);
                          }
                        }}
                        placeholder="Vd: Thông tư 68/2024/TT-BTC, Nghị định 65/2022/NĐ-CP, Luật Giá 2023..."
                        className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(regulationInput, setRegulationInput, formTargetRegulations, setFormTargetRegulations)}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer shrink-0"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formTargetRegulations.map((reg, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                        >
                          <span>{reg}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx, formTargetRegulations, setFormTargetRegulations)}
                            className="hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Negative Exclude Words (Anti-False-Positive) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Từ Khóa Loại Trừ (Exclude Words / Chống Bắt Nhầm)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={excludeWordInput}
                        onChange={(e) => setExcludeWordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddTag(excludeWordInput, setExcludeWordInput, formExcludeWords, setFormExcludeWords);
                          }
                        }}
                        placeholder="Vd: đầu tư tiền ảo, bán lẻ tiêu dùng..."
                        className={`flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-hidden ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTag(excludeWordInput, setExcludeWordInput, formExcludeWords, setFormExcludeWords)}
                        className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer shrink-0"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formExcludeWords.map((ex, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30"
                        >
                          <span>{ex}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(idx, formExcludeWords, setFormExcludeWords)}
                            className="hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <div className="flex items-center gap-2">
                  {formModalTab !== 'context' ? (
                    <button
                      type="button"
                      onClick={() => setFormModalTab(formModalTab === 'core' ? 'synonyms' : 'context')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Tiếp tục &rarr;
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer"
                  >
                    {editingGroup ? 'Lưu Thay Đổi' : 'Tạo Nhóm Mới'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Live Semantic Sandbox & Query Tester */}
      {isSandboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Sandbox Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <span>Mô Phỏng & Thử Nghiệm Ngữ Nghĩa (Sandbox)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kiểm tra cách hệ thống mở rộng từ khóa, nhận diện cơ quan và tạo câu truy vấn cào báo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSandboxOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sandbox Body */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {/* Input Query */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nhập câu tiêu đề, từ khóa hoặc chủ đề cần kiểm tra:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sandboxQuery}
                    onChange={(e) => setSandboxQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRunSandbox();
                      }
                    }}
                    placeholder="Vd: Thúc đẩy giải ngân đầu tư công đường sắt tốc độ cao..."
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600 focus:bg-white'
                    }`}
                  />
                  <button
                    onClick={() => handleRunSandbox()}
                    disabled={sandboxLoading}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                  >
                    {sandboxLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300" />}
                    <span>Phân Tích Ngay</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Mẫu thử nhanh:</span>
                  {[
                    'nâng hạng chứng khoán ftse',
                    'hóa đơn điện tử máy tính tiền',
                    'thông quan số hải quan',
                    'giải ngân đầu tư công cao tốc',
                    'đáo hạn trái phiếu doanh nghiệp',
                    'luật giá và điều hành xăng dầu'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSandboxQuery(preset);
                        handleRunSandbox(preset);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sandbox Results Display */}
              {sandboxResult && (
                <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                  {/* Matched Groups Banner */}
                  <div
                    className={`p-4 rounded-2xl border ${
                      sandboxResult.matchedGroups?.length > 0
                        ? isDark
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-emerald-50 border-emerald-200'
                        : isDark
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Nhóm từ khóa khớp ngữ cảnh ({sandboxResult.matchedGroups?.length || 0}):
                      </span>
                    </div>

                    {sandboxResult.matchedGroups?.length > 0 ? (
                      <div className="space-y-2">
                        {sandboxResult.matchedGroups.map((g: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            <div>
                              <span className="font-bold">{g.name}</span>
                              <span className="text-slate-400 text-[11px] ml-2">({g.sectorNameVi})</span>
                            </div>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                              Weight x{g.contextRules?.boostWeight || 2.0}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Chưa khớp nhóm từ khóa cụ thể nào. Hệ thống sẽ sử dụng thuật toán phân tích tách từ vựng tự nhiên.
                      </p>
                    )}
                  </div>

                  {/* Expanded Search Queries */}
                  <div
                    className={`p-4 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-500" />
                        Tập biến thể từ khóa mở rộng ({sandboxResult.expandedVariants?.length || 0}):
                      </span>
                      <button
                        onClick={() => handleCopyQuery(sandboxResult.suggestedSearchQuery)}
                        className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Sao chép chuỗi tìm kiếm
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sandboxResult.expandedVariants?.map((v: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                        >
                          {v}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">
                        Chuỗi truy vấn đề xuất cho Web Scraper:
                      </span>
                      <div className="mt-1 p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                        {sandboxResult.suggestedSearchQuery}
                      </div>
                    </div>
                  </div>

                  {/* Target Agencies & Regulations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" /> Cơ quan trực thuộc định tuyến:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sandboxResult.targetAgencies?.map((ag: string, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                            {ag}
                          </span>
                        ))}
                        {(!sandboxResult.targetAgencies || sandboxResult.targetAgencies.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Bộ Tài chính</span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl border space-y-1.5 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Văn bản viện dẫn liên quan:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {sandboxResult.targetRegulations?.map((reg: string, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            {reg}
                          </span>
                        ))}
                        {(!sandboxResult.targetRegulations || sandboxResult.targetRegulations.length === 0) && (
                          <span className="text-xs text-slate-400 italic">Quy định hiện hành</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sandbox Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsSandboxOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition"
              >
                Đóng Sandbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: Import JSON Configuration */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold">Nhập Cấu Hình Từ Điển (JSON)</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bạn có thể dán nội dung JSON hoặc chọn file JSON từ máy tính để đồng bộ danh sách nhóm từ khóa.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Dán nội dung JSON:</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Chọn file từ máy tính
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
              </div>

              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportError(null);
                }}
                placeholder='[\n  {\n    "name": "Nhóm từ khóa mẫu",\n    "sector": "tax",\n    "primaryKeyword": "thuế vat",\n    "synonyms": ["thuế gtgt", "thuế giá trị gia tăng"]\n  }\n]'
                className={`w-full p-3 rounded-xl text-xs font-mono border focus:outline-hidden ${
                  isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleProcessImport}
                disabled={!importJsonText.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-600/25"
              >
                Tiến Hành Nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Reset to Default Confirmation */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold">Khôi Phục Từ Điển Chuẩn Hóa 2026?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hành động này sẽ thiết lập lại toàn bộ danh mục từ điển về bộ dữ liệu chuẩn hóa 16 lĩnh vực của Bộ Tài chính năm 2026. Các nhóm từ khóa tùy chỉnh chưa sao lưu có thể bị ghi đè.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-rose-600/25"
              >
                Đồng Ý Khôi Phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: Delete Single Group Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold">Xác Nhận Xóa Nhóm Từ Khóa?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bạn có chắc chắn muốn xóa nhóm từ khóa này khỏi hệ thống? Thao tác này sẽ ngay lập tức dừng việc mở rộng đồng nghĩa đối với nhóm này.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => handleDeleteGroup(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-rose-600/25"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL / DRAWER: Trợ Lý AI Gợi Ý Ngữ Cảnh 2026 */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-violet-900/20 via-purple-900/15 to-indigo-900/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black flex items-center gap-2">
                    <span>Trợ Lý AI Gợi Ý Ngữ Cảnh 2026</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      Tham khảo AI
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tự động phân tích, mở rộng đồng nghĩa và đề xuất ma trận đơn vị tham mưu & căn cứ pháp lý năm 2026
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAiDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              {/* Presets Bar */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mẫu gợi ý AI nhanh cho Bộ Tài chính 2026:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { q: 'Lãnh đạo Bộ: Bộ trưởng & Thứ trưởng Bộ Tài chính', s: 'leadership' },
                    { q: 'Thuế tối thiểu toàn cầu Pillar 2 & GMT 2026', s: 'tax' },
                    { q: 'Nâng hạng thị trường chứng khoán KRX & Non-prefunding', s: 'securities' },
                    { q: 'Thúc đẩy giải ngân vốn đầu tư công cao tốc Bắc Nam', s: 'public_investment' },
                    { q: 'Chống thất thu thuế thương mại điện tử & Livestream', s: 'tax' },
                    { q: 'Thông quan thông minh Smart Customs 2026', s: 'customs' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiQuery(preset.q);
                        setAiSector(preset.s);
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 transition cursor-pointer text-left"
                    >
                      💡 {preset.q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Từ khóa hoặc Chủ đề chỉ đạo / quản lý:
                  </label>
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRunAiDrawer();
                      }
                    }}
                    placeholder="Nhập từ khóa bất kỳ, ví dụ: Lãnh đạo Bộ Tài chính..."
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-violet-500' : 'bg-white border-slate-300 text-slate-900 focus:border-violet-600'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Lĩnh vực quản lý:
                  </label>
                  <select
                    value={aiSector}
                    onChange={(e) => setAiSector(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm border focus:outline-hidden cursor-pointer ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {MOF_2026_SECTORS.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.nameVi} ({sec.department2026})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 pt-1">
                  <button
                    onClick={handleRunAiDrawer}
                    disabled={isAiLoading || !aiQuery.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-98"
                  >
                    <Sparkles className={`w-4 h-4 text-amber-300 ${isAiLoading ? 'animate-spin' : ''}`} />
                    <span>{isAiLoading ? 'AI Đang Phân Tích & Sinh Từ Khóa Ngữ Cảnh...' : '✨ Phân Tích & Sinh Từ Khóa AI 2026'}</span>
                  </button>
                </div>
              </div>

              {/* AI Analysis Result Display */}
              {isAiLoading ? (
                <div className="p-12 rounded-2xl border text-center space-y-3 bg-violet-500/5 border-violet-500/20">
                  <Sparkles className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-300">
                    Tham khảo AI đang quét cơ sở pháp lý và từ điển chuyên ngành Bộ Tài chính 2026...
                  </p>
                </div>
              ) : aiResult ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Ma Trận Ngữ Cảnh AI Đã Sinh Thành Công
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Trọng số ưu tiên: x{aiResult.boostWeight || 2.5}
                    </span>
                  </div>

                  {/* Proposed Group Name */}
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Tên nhóm gợi ý:</span>
                    <p className="text-sm font-black text-violet-700 dark:text-violet-300 mt-0.5">
                      {aiResult.suggestedName || aiQuery}
                    </p>
                    {aiResult.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                        {aiResult.description}
                      </p>
                    )}
                  </div>

                  {/* Synonyms Chips */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-indigo-500" />
                      <span>Từ đồng nghĩa & cụm từ mở rộng ({aiResult.synonyms?.length || 0}):</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {aiResult.synonyms?.map((syn, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Target Agencies & Regulations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Cơ quan tham mưu trực thuộc:</span>
                      </label>
                      <div className="space-y-1">
                        {aiResult.targetAgencies?.map((agency, idx) => (
                          <div key={idx} className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                            • {agency}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>Căn cứ pháp lý trọng tâm 2026:</span>
                      </label>
                      <div className="space-y-1">
                        {aiResult.targetRegulations?.map((reg, idx) => (
                          <div key={idx} className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                            • {reg}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40">
              <button
                onClick={() => setIsAiDrawerOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>

              {aiResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFormName(aiResult.suggestedName || aiQuery);
                      setFormSector(aiSector);
                      setFormPrimaryKeyword(aiQuery.trim().toLowerCase());
                      setFormSynonyms(aiResult.synonyms || []);
                      setFormMustInclude(aiResult.mustIncludeAny || []);
                      setFormExcludeWords(aiResult.excludeWords || []);
                      setFormTargetAgencies(aiResult.targetAgencies || []);
                      setFormTargetRegulations(aiResult.targetRegulations || []);
                      setFormBoostWeight(aiResult.boostWeight || 2.5);
                      setFormDescription(aiResult.description || '');
                      setIsAiDrawerOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition"
                  >
                    ✏️ Mở Trong Form Chỉnh Sửa
                  </button>

                  <button
                    onClick={handleApplyAiResultToNewGroup}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 cursor-pointer transition"
                  >
                    ➕ Thêm Nhóm Này Vào Từ Điển
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
