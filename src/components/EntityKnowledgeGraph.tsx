import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Network,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Landmark,
  FileText,
  UserCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Share2,
  Sliders,
  Cpu,
  Target,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Flame,
  GitFork,
  Radio,
  Eye,
  Zap,
  Clock,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
} from 'lucide-react';
import { ScrapedNewsItem, SectorType, SentimentType } from '../types';
import {
  EntityGraphNode,
  EntityGraphLink,
  EntityKnowledgeGraphData,
  EntityType,
  GraphPropagationScenario,
  SystemicRiskHub,
  DeltaAlertType,
} from '../types/entityGraph';
import { buildEntityKnowledgeGraph } from '../lib/entityGraphBuilder';
import { useTheme } from '../lib/theme';

interface EntityKnowledgeGraphProps {
  articles: ScrapedNewsItem[];
  onSelectArticleDeepDive?: (article: ScrapedNewsItem) => void;
  onOpenAdvisorWithPrompt?: (prompt: string) => void;
}

type ViewMode = 'force' | 'ego' | 'hierarchy' | 'clusters';
type DeltaFilterType = 'all' | 'delta_only' | 'red_only' | 'green_only';

export const EntityKnowledgeGraph: React.FC<EntityKnowledgeGraphProps> = ({
  articles,
  onSelectArticleDeepDive,
  onOpenAdvisorWithPrompt,
}) => {
  const { isDark } = useTheme();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // State
  const [graphData, setGraphData] = useState<EntityKnowledgeGraphData>(() =>
    buildEntityKnowledgeGraph(articles)
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('agency-mof');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<EntityType | 'all'>('all');
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<SentimentType | 'all'>('all');
  const [deltaFilter, setDeltaFilter] = useState<DeltaFilterType>('all');
  const [minCentrality, setMinCentrality] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('force');
  const [activeTab, setActiveTab] = useState<'graph' | 'scenarios' | 'risks'>('graph');
  const [selectedScenario, setSelectedScenario] = useState<GraphPropagationScenario | null>(null);
  const [isPhysicsRunning, setIsPhysicsRunning] = useState<boolean>(true);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);

  // D3 simulation ref
  const simulationRef = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Cập nhật dữ liệu khi articles thay đổi
  useEffect(() => {
    const data = buildEntityKnowledgeGraph(articles);
    setGraphData(data);
    if (!selectedNodeId && data.nodes.length > 0) {
      setSelectedNodeId(data.nodes[0].id);
    }
  }, [articles]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graphData.nodes, selectedNodeId]);

  // Filtered Nodes & Links
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let nodes = graphData.nodes.filter((node) => {
      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = node.label.toLowerCase().includes(q);
        const matchesRole = (node.description || '').toLowerCase().includes(q);
        const matchesTicker = (node.tickers || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesRole && !matchesTicker) return false;
      }

      // Filter by Type
      if (selectedTypeFilter !== 'all' && node.type !== selectedTypeFilter) {
        return false;
      }

      // Filter by Sentiment
      if (selectedSentimentFilter !== 'all' && node.sentiment !== selectedSentimentFilter) {
        return false;
      }

      // Filter by Delta-Alert
      if (deltaFilter === 'delta_only' && !node.deltaMetrics?.isDeltaAlert) {
        return false;
      }
      if (deltaFilter === 'red_only' && node.deltaMetrics?.deltaType !== 'negative_shock') {
        return false;
      }
      if (deltaFilter === 'green_only' && node.deltaMetrics?.deltaType !== 'positive_surge') {
        return false;
      }

      // Filter by Min Centrality
      if ((node.centralityScore || 0) < minCentrality) {
        return false;
      }

      return true;
    });

    // If in Ego Mode, only keep the selected node and its direct 1-hop neighbors
    if (viewMode === 'ego' && selectedNodeId) {
      const neighborIds = new Set<string>();
      neighborIds.add(selectedNodeId);

      graphData.links.forEach((l) => {
        const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        if (srcId === selectedNodeId) neighborIds.add(tgtId);
        if (tgtId === selectedNodeId) neighborIds.add(srcId);
      });

      nodes = nodes.filter((n) => neighborIds.has(n.id));
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links = graphData.links.filter((l) => {
      const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return nodeIds.has(srcId) && nodeIds.has(tgtId);
    });

    return { filteredNodes: nodes, filteredLinks: links };
  }, [
    graphData,
    searchQuery,
    selectedTypeFilter,
    selectedSentimentFilter,
    deltaFilter,
    minCentrality,
    viewMode,
    selectedNodeId,
  ]);

  // Node Color Helper
  const getNodeColor = (type: EntityType, sentiment: SentimentType) => {
    switch (type) {
      case 'agency':
        return '#f59e0b'; // Amber / Gold (Nhà nước)
      case 'enterprise':
        return '#10b981'; // Emerald (Doanh nghiệp)
      case 'policy':
        return '#6366f1'; // Indigo (Chính sách)
      case 'person':
        return '#8b5cf6'; // Violet (Lãnh đạo)
      case 'sector':
        return '#0284c7'; // Sky / Blue (Lĩnh vực)
      case 'event':
        return '#f43f5e'; // Rose (Sự kiện nóng)
      default:
        return '#64748b';
    }
  };

  // Node Icon Helper
  const renderNodeIcon = (type: EntityType) => {
    switch (type) {
      case 'agency':
        return Landmark;
      case 'enterprise':
        return Building2;
      case 'policy':
        return FileText;
      case 'person':
        return UserCheck;
      case 'sector':
        return Layers;
      case 'event':
        return Flame;
    }
  };

  // Render D3 Simulation on Canvas/SVG
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || activeTab !== 'graph') return;

    const width = containerRef.current.clientWidth || 900;
    const height = Math.max(560, containerRef.current.clientHeight || 600);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);

    // Defs for arrows and gradients
    const defs = svg.append('defs');

    // Arrow markers for directed edges
    const markerColors = [
      { id: 'arrow-neutral', color: isDark ? '#64748b' : '#94a3b8' },
      { id: 'arrow-bullish', color: '#10b981' },
      { id: 'arrow-bearish', color: '#f43f5e' },
      { id: 'arrow-agency', color: '#f59e0b' },
      { id: 'arrow-policy', color: '#6366f1' },
    ];

    markerColors.forEach(({ id, color }) => {
      defs
        .append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 26) // Distance from target node center
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
    });

    // Drop shadow filter for selected node glow
    const filter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Delta Alert Red Shock Glow
    const filterRed = defs.append('filter').attr('id', 'glow-red').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    filterRed.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'coloredBlur');
    const feMergeRed = filterRed.append('feMerge');
    feMergeRed.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeRed.append('feMergeNode').attr('in', 'SourceGraphic');

    // Delta Alert Green Surge Glow
    const filterGreen = defs.append('filter').attr('id', 'glow-green').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    filterGreen.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'coloredBlur');
    const feMergeGreen = filterGreen.append('feMerge');
    feMergeGreen.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeGreen.append('feMergeNode').attr('in', 'SourceGraphic');

    // Delta Alert Neutral Glow
    const filterCyan = defs.append('filter').attr('id', 'glow-cyan').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    filterCyan.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'coloredBlur');
    const feMergeCyan = filterCyan.append('feMerge');
    feMergeCyan.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeCyan.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('class', 'graph-container');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Deep clone data for simulation so D3 mutation doesn't break React state
    const simNodes: EntityGraphNode[] = filteredNodes.map((d) => ({ ...d }));
    const simLinks: any[] = filteredLinks.map((d) => ({
      ...d,
      source: typeof d.source === 'object' ? (d.source as any).id : d.source,
      target: typeof d.target === 'object' ? (d.target as any).id : d.target,
    }));

    // Setup Force Simulation
    const simulation = d3
      .forceSimulation(simNodes as any)
      .force(
        'link',
        d3
          .forceLink(simLinks)
          .id((d: any) => d.id)
          .distance((d: any) => (viewMode === 'ego' ? 120 : 160 - Math.min(60, d.weight * 6)))
      )
      .force('charge', d3.forceManyBody().strength(viewMode === 'ego' ? -400 : -320))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => Math.max(28, (d.centralityScore || 1) * 3 + 24)));

    simulationRef.current = simulation;

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => {
        if (d.sentiment === 'bullish') return '#10b981';
        if (d.sentiment === 'bearish') return '#f43f5e';
        if (d.relation === 'ISSUES_POLICY') return '#818cf8';
        if (d.relation === 'REGULATES') return '#fbbf24';
        return isDark ? '#334155' : '#cbd5e1';
      })
      .attr('stroke-opacity', (d: any) => {
        if (selectedNodeId) {
          const srcId = typeof d.source === 'object' ? d.source.id : d.source;
          const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
          if (srcId === selectedNodeId || tgtId === selectedNodeId) return 0.95;
          return isDark ? 0.15 : 0.25;
        }
        return 0.6;
      })
      .attr('stroke-width', (d: any) => {
        if (selectedNodeId) {
          const srcId = typeof d.source === 'object' ? d.source.id : d.source;
          const tgtId = typeof d.target === 'object' ? d.target.id : d.target;
          if (srcId === selectedNodeId || tgtId === selectedNodeId) return Math.max(2.5, d.weight * 0.8);
        }
        return Math.max(1.2, d.weight * 0.5);
      })
      .attr('stroke-dasharray', (d: any) => (d.relation === 'CO_OCCURS' ? '3,3' : 'none'))
      .attr('marker-end', (d: any) => {
        if (!d.isDirected) return null;
        if (d.sentiment === 'bullish') return 'url(#arrow-bullish)';
        if (d.sentiment === 'bearish') return 'url(#arrow-bearish)';
        if (d.relation === 'ISSUES_POLICY') return 'url(#arrow-policy)';
        if (d.relation === 'REGULATES') return 'url(#arrow-agency)';
        return 'url(#arrow-neutral)';
      })
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d: any) => {
        setHoveredLinkId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredLinkId(null);
      });

    // Draw Link Labels for key directed relations
    const linkLabelGroup = g.append('g').attr('class', 'link-labels');
    const linkText = linkLabelGroup
      .selectAll('text')
      .data(simLinks.filter((l: any) => l.weight >= 4 || l.isDirected))
      .enter()
      .append('text')
      .attr('font-size', '9px')
      .attr('font-family', 'sans-serif')
      .attr('fill', isDark ? '#94a3b8' : '#64748b')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text((d: any) => d.relationLabelVi)
      .style('opacity', isDark ? 0.75 : 0.85)
      .style('pointer-events', 'none');

    // Draw Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // 1. Delta Alert Pulsing Outer Aura Ring (Red / Green / Cyan)
    node
      .filter((d: any) => d.deltaMetrics && d.deltaMetrics.isDeltaAlert)
      .append('circle')
      .attr('class', 'delta-pulse-ring')
      .attr('r', (d: any) => {
        const baseRadius = d.type === 'agency' ? 24 : d.type === 'enterprise' ? 20 : 18;
        return baseRadius + Math.min(10, (d.centralityScore || 0) * 1.5) + 12;
      })
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        if (d.deltaMetrics.deltaType === 'negative_shock') return '#f43f5e';
        if (d.deltaMetrics.deltaType === 'positive_surge') return '#10b981';
        return '#06b6d4';
      })
      .attr('stroke-width', (d: any) => (d.deltaMetrics.deltaType === 'negative_shock' ? 3 : 2.5))
      .attr('stroke-dasharray', (d: any) => (d.deltaMetrics.deltaType === 'neutral_spike' ? '4,4' : 'none'))
      .attr('opacity', 0.85)
      .attr('filter', (d: any) => {
        if (d.deltaMetrics.deltaType === 'negative_shock') return 'url(#glow-red)';
        if (d.deltaMetrics.deltaType === 'positive_surge') return 'url(#glow-green)';
        return 'url(#glow-cyan)';
      });

    // 2. Node Selection Ring
    node
      .append('circle')
      .attr('r', (d: any) => {
        const baseRadius = d.type === 'agency' ? 24 : d.type === 'enterprise' ? 20 : 18;
        return baseRadius + Math.min(10, (d.centralityScore || 0) * 1.5) + 6;
      })
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        if (d.id === selectedNodeId) return '#38bdf8';
        if (d.deltaMetrics?.deltaType === 'negative_shock') return '#f43f5e';
        if (d.deltaMetrics?.deltaType === 'positive_surge') return '#10b981';
        if (d.riskStatus === 'high_risk') return '#f43f5e';
        if (d.riskStatus === 'opportunity') return '#10b981';
        return 'transparent';
      })
      .attr('stroke-width', (d: any) => (d.id === selectedNodeId ? 3.5 : 2))
      .attr('stroke-dasharray', (d: any) => (d.riskStatus === 'high_risk' && !d.deltaMetrics?.isDeltaAlert ? '4,4' : 'none'))
      .attr('opacity', (d: any) => (d.id === selectedNodeId || d.deltaMetrics?.isDeltaAlert || d.riskStatus === 'high_risk' ? 0.95 : 0))
      .attr('filter', (d: any) => (d.id === selectedNodeId ? 'url(#glow)' : null));

    // 3. Node Primary Circle
    node
      .append('circle')
      .attr('r', (d: any) => {
        const baseRadius = d.type === 'agency' ? 22 : d.type === 'enterprise' ? 18 : 16;
        return baseRadius + Math.min(8, (d.centralityScore || 0) * 1.2);
      })
      .attr('fill', (d: any) => getNodeColor(d.type, d.sentiment))
      .attr('stroke', (d: any) => {
        if (d.deltaMetrics?.deltaType === 'negative_shock') return '#f43f5e';
        if (d.deltaMetrics?.deltaType === 'positive_surge') return '#10b981';
        return isDark ? '#0f172a' : '#ffffff';
      })
      .attr('stroke-width', (d: any) => (d.deltaMetrics?.isDeltaAlert ? 3.5 : 2.5))
      .attr('opacity', (d: any) => {
        if (selectedNodeId) {
          if (d.id === selectedNodeId) return 1;
          const isNeighbor = simLinks.some(
            (l: any) =>
              (l.source.id === selectedNodeId && l.target.id === d.id) ||
              (l.target.id === selectedNodeId && l.source.id === d.id)
          );
          if (isNeighbor) return 0.95;
          return isDark ? 0.25 : 0.35;
        }
        return 0.95;
      });

    // 4. Node Inner Sentiment Ring
    node
      .append('circle')
      .attr('r', (d: any) => {
        const baseRadius = d.type === 'agency' ? 22 : d.type === 'enterprise' ? 18 : 16;
        return baseRadius + Math.min(8, (d.centralityScore || 0) * 1.2) - 4;
      })
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        if (d.sentiment === 'bullish') return '#ffffff';
        if (d.sentiment === 'bearish') return '#ffffff';
        return 'rgba(255,255,255,0.4)';
      })
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6);

    // 5. Delta-Alert Top Floating Badge / Beacon (Rendered above node)
    const alertNodes = node.filter((d: any) => d.deltaMetrics && d.deltaMetrics.isDeltaAlert);

    // Delta Badge Background Pill
    alertNodes
      .append('rect')
      .attr('x', (d: any) => {
        const textLen = d.deltaMetrics.deltaType === 'negative_shock' ? 12 : d.deltaMetrics.deltaType === 'positive_surge' ? 11 : 9;
        return -(textLen * 3.5 + 8);
      })
      .attr('y', (d: any) => {
        const baseRadius = d.type === 'agency' ? 22 : d.type === 'enterprise' ? 18 : 16;
        const totalRadius = baseRadius + Math.min(8, (d.centralityScore || 0) * 1.2);
        return -(totalRadius + 22);
      })
      .attr('width', (d: any) => {
        const textLen = d.deltaMetrics.deltaType === 'negative_shock' ? 12 : d.deltaMetrics.deltaType === 'positive_surge' ? 11 : 9;
        return textLen * 7 + 16;
      })
      .attr('height', 16)
      .attr('rx', 8)
      .attr('fill', (d: any) => {
        if (d.deltaMetrics.deltaType === 'negative_shock') return '#e11d48';
        if (d.deltaMetrics.deltaType === 'positive_surge') return '#059669';
        return '#0891b2';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.2)
      .attr('filter', (d: any) => {
        if (d.deltaMetrics.deltaType === 'negative_shock') return 'url(#glow-red)';
        if (d.deltaMetrics.deltaType === 'positive_surge') return 'url(#glow-green)';
        return 'url(#glow-cyan)';
      });

    // Delta Badge Text
    alertNodes
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => {
        const baseRadius = d.type === 'agency' ? 22 : d.type === 'enterprise' ? 18 : 16;
        const totalRadius = baseRadius + Math.min(8, (d.centralityScore || 0) * 1.2);
        return -(totalRadius + 10);
      })
      .attr('font-size', '9px')
      .attr('font-weight', '800')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('fill', '#ffffff')
      .text((d: any) => {
        if (d.deltaMetrics.deltaType === 'negative_shock') {
          return `🚨 15p: ${d.deltaMetrics.sentimentDelta > 0 ? `+${d.deltaMetrics.sentimentDelta}` : d.deltaMetrics.sentimentDelta}đ`;
        }
        if (d.deltaMetrics.deltaType === 'positive_surge') {
          return `⚡ 15p: +${d.deltaMetrics.sentimentDelta}đ`;
        }
        return `📊 +${d.deltaMetrics.recentMentions15m} TIN`;
      });

    // 6. Node Label Badge Background
    node
      .append('rect')
      .attr('x', (d: any) => -(d.label.length * 3.6 + 8))
      .attr('y', (d: any) => {
        const baseRadius = d.type === 'agency' ? 22 : d.type === 'enterprise' ? 18 : 16;
        return baseRadius + Math.min(8, (d.centralityScore || 0) * 1.2) + 4;
      })
      .attr('width', (d: any) => d.label.length * 7.2 + 16)
      .attr('height', 18)
      .attr('rx', 9)
      .attr('fill', isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', (d: any) => {
        if (d.deltaMetrics?.deltaType === 'negative_shock') return 'rgba(244, 63, 94, 0.4)';
        if (d.deltaMetrics?.deltaType === 'positive_surge') return 'rgba(16, 185, 129, 0.4)';
        return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      })
      .attr('stroke-width', 1);

    // 7. Node Text Label
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => {
        const baseRadius = d.type === 'agency' ? 22 : d.type === 'enterprise' ? 18 : 16;
        return baseRadius + Math.min(8, (d.centralityScore || 0) * 1.2) + 16;
      })
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('font-family', 'system-ui, sans-serif')
      .attr('fill', isDark ? '#f1f5f9' : '#0f172a')
      .text((d: any) => d.label);

    // Node Click and Hover Handlers
    node
      .on('click', (event, d: any) => {
        setSelectedNodeId(d.id);
      })
      .on('mouseenter', (event, d: any) => {
        setHoveredNodeId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
      });

    // Tick Handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks, isDark, selectedNodeId, viewMode, activeTab]);

  // Zoom Controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = Math.max(560, containerRef.current.clientHeight || 600);
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1).translate(-width / 2, -height / 2)
      );
  };

  const togglePhysics = () => {
    if (!simulationRef.current) return;
    if (isPhysicsRunning) {
      simulationRef.current.stop();
      setIsPhysicsRunning(false);
    } else {
      simulationRef.current.alpha(0.3).restart();
      setIsPhysicsRunning(true);
    }
  };

  // Connected Neighbors for Selected Node
  const connectedNeighbors = useMemo(() => {
    if (!selectedNodeId) return [];
    const neighbors: Array<{ node: EntityGraphNode; link: EntityGraphLink; direction: 'outgoing' | 'incoming' }> = [];

    graphData.links.forEach((l) => {
      const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;

      if (srcId === selectedNodeId) {
        const neighborNode = graphData.nodes.find((n) => n.id === tgtId);
        if (neighborNode) {
          neighbors.push({ node: neighborNode, link: l, direction: 'outgoing' });
        }
      } else if (tgtId === selectedNodeId) {
        const neighborNode = graphData.nodes.find((n) => n.id === srcId);
        if (neighborNode) {
          neighbors.push({ node: neighborNode, link: l, direction: 'incoming' });
        }
      }
    });

    return neighbors.sort((a, b) => b.link.weight - a.link.weight);
  }, [graphData, selectedNodeId]);

  // Evidence Articles for Selected Node
  const evidenceArticles = useMemo(() => {
    if (!selectedNode) return [];
    return articles.filter((art) => selectedNode.articleIds.includes(art.id)).slice(0, 8);
  }, [articles, selectedNode]);

  // Run AI Impact Reasoning for Selected Node
  const handleRunAiReasoning = async () => {
    if (!selectedNode) return;
    setIsAnalyzingAi(true);
    setAiAnalysisResult(null);

    try {
      const prompt = `Phân tích vai trò thực thể và tác động lan truyền của "${selectedNode.label}" (${selectedNode.categoryNameVi}) trong mạng lưới giám sát tài chính BTC. Các thực thể liên kết chính gồm: ${connectedNeighbors.map(n => `${n.node.label} (${n.link.relationLabelVi})`).slice(0, 6).join(', ')}. Hãy đưa ra 3 khuyến nghị tham mưu điều hành trực tiếp cho Lãnh đạo.`;
      
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          context: {
            entity: selectedNode,
            neighbors: connectedNeighbors.slice(0, 6).map(n => ({ name: n.node.label, relation: n.link.relationLabelVi })),
            articles: evidenceArticles.slice(0, 3).map(a => a.title),
          }
        })
      });

      if (res.ok) {
        const json = await res.json();
        setAiAnalysisResult(json.answer || json.text || 'Đã phân tích xong dữ liệu thực thể.');
      } else {
        // Fallback analysis
        setAiAnalysisResult(
          `**Đánh giá Vai trò Chiến lược:** ${selectedNode.label} đóng vai trò then chốt (${selectedNode.categoryNameVi}) với ${selectedNode.centralityScore} mắt xích liên kết trực tiếp trong chuỗi giá trị tài chính. \n\n` +
          `**Tác động Lan truyền (Domino Effect):** Bất kỳ biến động chính sách hoặc thanh khoản nào tại ${selectedNode.label} sẽ tác động trực tiếp tới ${connectedNeighbors.slice(0, 3).map(n => n.node.label).join(', ')}. \n\n` +
          `**Khuyến nghị Tham mưu Lãnh đạo:** Tăng cường theo dõi báo cáo định kỳ 24/7, duy trì kênh phối hợp liên ngành và chuẩn bị phương án dự phòng thanh khoản / ổn định tâm lý nhà đầu tư.`
        );
      }
    } catch (e) {
      setAiAnalysisResult(
        `**Đánh giá Vai trò Chiến lược:** ${selectedNode.label} đóng vai trò then chốt (${selectedNode.categoryNameVi}) với ${selectedNode.centralityScore} mắt xích liên kết. \n\n` +
        `**Khuyến nghị Tham mưu Lãnh đạo:** Tăng cường giám sát công bố thông tin, kịp thời tháo gỡ vướng mắc thể chế theo đúng quy định pháp luật.`
      );
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div
        className={`p-6 rounded-3xl border transition-all duration-300 ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 shadow-xl shadow-black/20'
            : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/50'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Network className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Bản Đồ Tri Thức & Mối Quan Hệ Thực Thể
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Entity Knowledge Graph v2.0
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trực quan hóa mạng lưới liên kết đa chiều giữa Cơ quan Quản lý ↔ Doanh nghiệp ↔ Chính sách & Pháp quy ↔ Sự kiện báo chí
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`px-4 py-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tổng Thực Thể</div>
              <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {graphData.totalEntities}
              </div>
            </div>

            <div
              className={`px-4 py-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Mối Quan Hệ</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {graphData.totalRelations}
              </div>
            </div>

            <div
              className={`px-4 py-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Tâm Điểm Kết Nối</div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate max-w-[130px]">
                {graphData.mostConnectedEntity}
              </div>
            </div>

            <div
              className={`px-4 py-2.5 rounded-2xl border text-center ${
                isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hub Rủi Ro Cao</div>
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate max-w-[130px]">
                {graphData.highestRiskEntity}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('graph')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'graph'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Mạng Lưới Tương Tác (Interactive Graph)</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'scenarios'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <GitFork className="w-4 h-4 text-amber-400" />
            <span>Mô Phỏng Lan Truyền Tác Động (Shock Propagation)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300">
              {graphData.propagationScenarios.length} Kịch bản
            </span>
          </button>

          <button
            onClick={() => setActiveTab('risks')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'risks'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Hub Rủi Ro Hệ Thống (Systemic Risk Hubs)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300">
              {graphData.systemicRiskHubs.length} Điểm nóng
            </span>
          </button>
        </div>
      </div>

      {/* MAIN TAB 1: GRAPH VISUALIZER */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          {/* DELTA-ALERT 15-MINUTE LIVE SCRAPING COMMAND BANNER */}
          <div
            className={`p-4 rounded-3xl border transition-all ${
              graphData.redAlertsCount > 0
                ? isDark
                  ? 'bg-rose-950/30 border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'bg-rose-50/80 border-rose-200 shadow-sm'
                : isDark
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Live Status & Counters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black shadow-inner">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="tracking-wider">DELTA-ALERT (15 PHÚT)</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setDeltaFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      deltaFilter === 'all'
                        ? 'bg-slate-800 text-white dark:bg-slate-700'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {graphData.totalEntities}
                    </span>
                  </button>

                  <button
                    onClick={() => setDeltaFilter('red_only')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      deltaFilter === 'red_only'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Sốc Tiêu Cực</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-300 font-mono">
                      {graphData.redAlertsCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setDeltaFilter('green_only')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      deltaFilter === 'green_only'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đột Phá Tích Cực</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-mono">
                      {graphData.greenAlertsCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setDeltaFilter('delta_only')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      deltaFilter === 'delta_only'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Tất cả Delta-Alert</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-mono">
                      {graphData.deltaAlertsCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right: Quick Alert Entity Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                  <Bell className="w-3 h-3 text-amber-500" /> Điểm nóng 15p:
                </span>
                {graphData.topDeltaEntities && graphData.topDeltaEntities.length > 0 ? (
                  graphData.topDeltaEntities.map((ent) => {
                    const isRed = ent.deltaMetrics?.deltaType === 'negative_shock';
                    const isGreen = ent.deltaMetrics?.deltaType === 'positive_surge';
                    const isSelected = selectedNodeId === ent.id;

                    return (
                      <button
                        key={ent.id}
                        onClick={() => setSelectedNodeId(ent.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-indigo-400 scale-105'
                            : 'hover:scale-102'
                        } ${
                          isRed
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                            : isGreen
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        <span>{isRed ? '🚨' : isGreen ? '⚡' : '📊'}</span>
                        <span className="truncate max-w-[120px]">{ent.label}</span>
                        <span className="font-mono text-[10px] font-extrabold opacity-90">
                          {ent.deltaMetrics?.sentimentDelta && ent.deltaMetrics.sentimentDelta > 0
                            ? `+${ent.deltaMetrics.sentimentDelta}đ`
                            : `${ent.deltaMetrics?.sentimentDelta || 0}đ`}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 italic">Mạng lưới ổn định trong 15 phút qua</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Visualizer Area (8 cols) */}
          <div className="xl:col-span-8 space-y-4">
            {/* Control & Filter Toolbar */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh thực thể (BTC, VIC, TT68, TPDN...)"
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none transition ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* View Mode Switcher */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                  <button
                    onClick={() => setViewMode('force')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      viewMode === 'force'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Toàn Cảnh</span>
                  </button>
                  <button
                    onClick={() => setViewMode('ego')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      viewMode === 'ego'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Tâm Điểm 1-Hop</span>
                  </button>
                </div>

                {/* Canvas Canvas Zoom & Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleZoomIn}
                    title="Phóng to"
                    className={`p-2 rounded-xl border transition ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    title="Thu nhỏ"
                    className={`p-2 rounded-xl border transition ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    title="Khôi phục khung hình"
                    className={`p-2 rounded-xl border transition ${
                      isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={togglePhysics}
                    title={isPhysicsRunning ? 'Tạm dừng lực đẩy' : 'Tiếp tục lực đẩy'}
                    className={`p-2 rounded-xl border transition ${
                      isPhysicsRunning
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Entity Type Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Phân loại:
                </span>
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'agency', label: '🏛️ Cơ quan Nhà nước', color: 'text-amber-500' },
                  { id: 'enterprise', label: '🏢 Doanh nghiệp', color: 'text-emerald-500' },
                  { id: 'policy', label: '📜 Chính sách & Luật', color: 'text-indigo-500' },
                  { id: 'person', label: '👤 Lãnh đạo', color: 'text-purple-500' },
                  { id: 'sector', label: '📊 Ngành & Tài sản', color: 'text-sky-500' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeFilter(type.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedTypeFilter === type.id
                        ? 'bg-indigo-600 text-white'
                        : isDark
                        ? 'bg-slate-800/80 text-slate-400 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* D3 Graph Canvas Card */}
            <div
              ref={containerRef}
              className={`relative rounded-3xl border overflow-hidden transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-800 shadow-inner'
                  : 'bg-slate-900 border-slate-200 shadow-lg'
              }`}
              style={{ height: '620px' }}
            >
              {/* Background Grid Accent */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Interactive SVG Stage */}
              <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* Legend Watermark */}
              <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 space-y-1.5 pointer-events-none shadow-xl">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Chú giải Mạng Lưới
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Cơ quan Quản lý</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Doanh nghiệp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>Chính sách & Pháp quy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>Lãnh đạo / Nhân vật</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>Ngành / Tài sản</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-rose-500" />
                    <span>Tác động Tiêu cực / Rủi ro</span>
                  </div>
                </div>
              </div>

              {/* Hovered Node Quick Tooltip Overlay */}
              {hoveredNodeId && (
                <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs text-white shadow-2xl pointer-events-none max-w-xs animate-fadeIn">
                  {(() => {
                    const node = graphData.nodes.find((n) => n.id === hoveredNodeId);
                    if (!node) return null;
                    return (
                      <div>
                        <div className="font-bold text-amber-400">{node.label}</div>
                        <div className="text-[10px] text-slate-400">{node.categoryNameVi}</div>
                        <div className="text-[11px] text-slate-300 mt-1 line-clamp-2">{node.description}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Side Entity Deep-Dive Inspector Panel (4 cols) */}
          <div className="xl:col-span-4 space-y-4">
            {selectedNode ? (
              <div
                className={`p-5 rounded-3xl border space-y-5 transition-all duration-300 ${
                  isDark
                    ? 'bg-slate-900/95 border-slate-800 shadow-xl'
                    : 'bg-white border-slate-200 shadow-md'
                }`}
              >
                {/* Node Profile Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: getNodeColor(selectedNode.type, selectedNode.sentiment) }}
                    >
                      {React.createElement(renderNodeIcon(selectedNode.type), { className: 'w-6 h-6' })}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                        {selectedNode.label}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {selectedNode.categoryNameVi}
                        </span>
                        {selectedNode.tickers && selectedNode.tickers.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            {selectedNode.tickers.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Risk Status Tag */}
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 ${
                      selectedNode.riskStatus === 'high_risk'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : selectedNode.riskStatus === 'opportunity'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : selectedNode.riskStatus === 'monitoring'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {selectedNode.riskStatus === 'high_risk'
                      ? '🚨 Nguy Cơ Cao'
                      : selectedNode.riskStatus === 'opportunity'
                      ? '🌟 Cơ Hội Lan Tỏa'
                      : selectedNode.riskStatus === 'monitoring'
                      ? '👁️ Cần Giám Sát'
                      : '🛡️ Trạng Thái An Toàn'}
                  </span>
                </div>

                {/* Score Summary Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`p-2.5 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-medium">Độ Ảnh Hưởng</div>
                    <div className="text-sm font-black text-amber-500">
                      {selectedNode.buzzScore}/100
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-medium">Mắt Xích Nối</div>
                    <div className="text-sm font-black text-indigo-500">
                      {selectedNode.centralityScore} liên kết
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-2xl border text-center ${
                      isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-medium">Sắc Thái</div>
                    <div
                      className={`text-sm font-black ${
                        selectedNode.sentiment === 'bullish'
                          ? 'text-emerald-500'
                          : selectedNode.sentiment === 'bearish'
                          ? 'text-rose-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {selectedNode.sentiment === 'bullish' ? '+ Tích cực' : selectedNode.sentiment === 'bearish' ? '- Tiêu cực' : 'Trung tính'}
                    </div>
                  </div>
                </div>

                {/* DELTA-ALERT 15-MINUTE SHIFT CARD */}
                {selectedNode.deltaMetrics && selectedNode.deltaMetrics.isDeltaAlert ? (
                  <div
                    className={`p-4 rounded-2xl border space-y-3 transition-all ${
                      selectedNode.deltaMetrics.deltaType === 'negative_shock'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100'
                        : selectedNode.deltaMetrics.deltaType === 'positive_surge'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-950 dark:text-cyan-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {selectedNode.deltaMetrics.deltaType === 'negative_shock' ? '🚨' : selectedNode.deltaMetrics.deltaType === 'positive_surge' ? '⚡' : '📊'}
                        </span>
                        <div>
                          <div className="text-xs font-black uppercase tracking-wider">
                            {selectedNode.deltaMetrics.deltaType === 'negative_shock'
                              ? 'Delta-Alert: Sốc Tiêu Cực (15 Phút)'
                              : selectedNode.deltaMetrics.deltaType === 'positive_surge'
                              ? 'Delta-Alert: Đột Phá Tích Cực (15 Phút)'
                              : 'Delta-Alert: Đột Biến Tần Suất'}
                          </div>
                          <div className="text-[10px] opacity-75 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Cập nhật lúc {selectedNode.deltaMetrics.shiftedAt}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-black ${
                          selectedNode.deltaMetrics.deltaType === 'negative_shock'
                            ? 'bg-rose-600 text-white'
                            : selectedNode.deltaMetrics.deltaType === 'positive_surge'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-cyan-600 text-white'
                        }`}
                      >
                        Tốc độ {selectedNode.deltaMetrics.velocityScore}/100
                      </span>
                    </div>

                    {/* Delta Metrics 3-Col Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-current/10">
                        <div className="text-[10px] opacity-70 font-medium">Lệch Sắc Thái</div>
                        <div className="text-sm font-black flex items-center justify-center gap-0.5">
                          {selectedNode.deltaMetrics.sentimentDelta > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span>
                            {selectedNode.deltaMetrics.sentimentDelta > 0
                              ? `+${selectedNode.deltaMetrics.sentimentDelta}`
                              : selectedNode.deltaMetrics.sentimentDelta}đ
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-current/10">
                        <div className="text-[10px] opacity-70 font-medium">Tin mới 15p</div>
                        <div className="text-sm font-black">
                          +{selectedNode.deltaMetrics.recentMentions15m} bài
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-current/10">
                        <div className="text-[10px] opacity-70 font-medium">Tăng trưởng</div>
                        <div className="text-sm font-black">
                          +{selectedNode.deltaMetrics.mentionGrowthPercent}%
                        </div>
                      </div>
                    </div>

                    {/* Trigger Reasons */}
                    {selectedNode.deltaMetrics.triggerReasons && selectedNode.deltaMetrics.triggerReasons.length > 0 && (
                      <div className="space-y-1 text-xs pt-1">
                        <div className="font-bold text-[11px] opacity-90">Lý do Kích hoạt Cảnh báo:</div>
                        <div className="space-y-1">
                          {selectedNode.deltaMetrics.triggerReasons.map((reason, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px] leading-tight opacity-90">
                              <span className="text-current font-bold mt-0.5">•</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Sample Articles in Last 15m */}
                    {selectedNode.deltaMetrics.recentArticlesSample && selectedNode.deltaMetrics.recentArticlesSample.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="font-bold text-[11px] opacity-90">Tin tức cào được trong 15p qua:</div>
                        <div className="space-y-1">
                          {selectedNode.deltaMetrics.recentArticlesSample.map((art) => (
                            <div
                              key={art.id}
                              onClick={() => onSelectArticleDeepDive && onSelectArticleDeepDive(art)}
                              className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-current/10 text-xs cursor-pointer hover:opacity-100 transition"
                            >
                              <div className="font-semibold line-clamp-1">{art.title}</div>
                              <div className="flex items-center justify-between text-[10px] opacity-70 mt-0.5">
                                <span>{art.source}</span>
                                <span className="font-bold">{art.timeAgo || 'Vừa xong'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                      isDark ? 'bg-slate-800/30 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Trạng thái 15p: <strong>Ổn định</strong> (Không có đột biến bất thường)</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">15m delta: 0</span>
                  </div>
                )}

                {/* Description & Role */}
                {selectedNode.description && (
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                      isDark ? 'bg-slate-800/40 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" /> Vai trò trong Hệ sinh thái:
                    </div>
                    {selectedNode.description}
                  </div>
                )}

                {/* AI Impact Propagation Reasoning */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Phân Tích Lan Truyền Tác Động
                    </span>
                    <button
                      onClick={handleRunAiReasoning}
                      disabled={isAnalyzingAi}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isAnalyzingAi ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>{isAnalyzingAi ? 'Đang suy luận...' : 'Chạy AI'}</span>
                    </button>
                  </div>

                  {aiAnalysisResult ? (
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed border space-y-2 whitespace-pre-line ${
                        isDark ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                      }`}
                    >
                      {aiAnalysisResult}
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-2xl text-xs border text-center text-slate-400 ${
                        isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      Bấm nút <strong className="text-indigo-500">"Chạy AI"</strong> để phân tích kịch bản tác động lan truyền và nhận khuyến nghị tham mưu Lãnh đạo cho thực thể này.
                    </div>
                  )}
                </div>

                {/* Connected Neighbors List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>Mắt Xích Liên Kết Trực Tiếp ({connectedNeighbors.length})</span>
                    <span className="text-[11px] text-slate-400 font-normal">Click để chuyển tiêu điểm</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {connectedNeighbors.map(({ node, link, direction }) => (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                          isDark
                            ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-slate-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getNodeColor(node.type, node.sentiment) }}
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold truncate">{node.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{link.relationLabelVi}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 shrink-0">
                          w:{link.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Scraped Articles */}
                {evidenceArticles.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Báo Chí Đang Đưa Tin ({evidenceArticles.length} bài)
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                      {evidenceArticles.map((art) => (
                        <div
                          key={art.id}
                          onClick={() => onSelectArticleDeepDive && onSelectArticleDeepDive(art)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
                            isDark
                              ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="font-semibold line-clamp-1 hover:text-indigo-400">{art.title}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                            <span>{art.source}</span>
                            <span>{art.timeAgo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`p-8 rounded-3xl border text-center space-y-3 ${
                  isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <Target className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs">
                  Chọn một Node trên bản đồ mạng lưới để xem chi tiết thực thể, mắt xích liên kết và phân tích tác động lan truyền.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* MAIN TAB 2: SHOCK PROPAGATION SCENARIOS */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {graphData.propagationScenarios.map((scen) => (
              <div
                key={scen.id}
                onClick={() => setSelectedScenario(scen)}
                className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 ${
                  selectedScenario?.id === scen.id
                    ? isDark
                      ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      scen.systemicRiskLevel === 'Nguy cơ cao'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {scen.systemicRiskLevel}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Xác suất: <strong className="text-slate-200">{scen.probability}</strong>
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {scen.scenarioName}
                  </h4>
                  <div className="text-xs text-amber-500 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Nút kích hoạt: {scen.triggerEntityName}
                  </div>
                </div>

                {/* Domino Chain Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">Chuỗi Hiệu Ứng Domino (3 bước):</div>
                  <div className="space-y-1.5">
                    {scen.affectedChain.map((step) => (
                      <div
                        key={step.step}
                        className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                          isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {step.step}
                        </span>
                        <div className="truncate">
                          <span className="font-bold">{step.entityName}:</span>{' '}
                          <span className="text-slate-400">{step.effectType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leadership Advice */}
                <div
                  className={`p-3 rounded-2xl text-xs border ${
                    isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Chỉ đạo Tham mưu Đề xuất:
                  </div>
                  <p className="line-clamp-2 text-[11px]">{scen.leadershipAdvice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN TAB 3: SYSTEMIC RISK HUBS */}
      {activeTab === 'risks' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {graphData.systemicRiskHubs.map((hub) => (
              <div
                key={hub.entityId}
                className={`p-6 rounded-3xl border space-y-4 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
                      {hub.riskScore}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{hub.entityName}</h4>
                      <div className="text-[11px] text-slate-400">{hub.connectedNodesCount} mắt xích chịu tác động</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    Systemic Risk
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs border space-y-1.5 ${
                    isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Điểm Nghẽn Trọng Tâm:
                  </div>
                  <p>{hub.riskSummary}</p>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs border space-y-1.5 ${
                    isDark ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Chiến Lược Phòng Ngừa & Ổn Định:
                  </div>
                  <p>{hub.mitigationStrategy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
