import { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrapedNewsItem, ScrapeResponse, TimestampIntegrityReport } from '../types';
import { auditAndFlagNewsTimestamps } from '../lib/dataIntegrityChecker';

export interface UseDataIntegrityCheckOptions {
  autoEnrich?: boolean;
  enabled?: boolean;
}

export interface UseDataIntegrityCheckReturn {
  integrityReport: TimestampIntegrityReport | null;
  anomalousArticles: ScrapedNewsItem[];
  excludeAnomalies: boolean;
  setExcludeAnomalies: React.Dispatch<React.SetStateAction<boolean>>;
  toggleExcludeAnomalies: () => void;
  filterCleanArticles: (items: ScrapedNewsItem[]) => ScrapedNewsItem[];
  auditNewsList: (items: ScrapedNewsItem[]) => { auditedNews: ScrapedNewsItem[]; report: TimestampIntegrityReport };
  lastAuditedTimestamp: string | null;
}

/**
 * Custom hook that conducts real-time Data Integrity Audits on scraped news batches.
 * Automatically identifies, flags, and classifies articles with non-standard,
 * missing, future, or unparseable timestamps to assist upstream filtering and purge junk items.
 */
export function useDataIntegrityCheck(
  data: ScrapeResponse | null,
  options: UseDataIntegrityCheckOptions = {}
): UseDataIntegrityCheckReturn {
  const { enabled = true } = options;

  const [integrityReport, setIntegrityReport] = useState<TimestampIntegrityReport | null>(null);
  const [excludeAnomalies, setExcludeAnomalies] = useState<boolean>(true); // Default to clean feed (hide anomalous junk)
  const [lastAuditedTimestamp, setLastAuditedTimestamp] = useState<string | null>(null);

  // Run audit whenever new scrape data arrives
  useEffect(() => {
    if (!enabled || !data?.news || data.news.length === 0) {
      if (data?.totalFound === 0) {
        setIntegrityReport({
          totalChecked: 0,
          validCount: 0,
          anomalousCount: 0,
          integrityRate: 100,
          anomaliesByReason: [],
          checkedAt: new Date().toISOString()
        });
      }
      return;
    }

    const startTime = performance.now();
    const { report } = auditAndFlagNewsTimestamps(data.news);
    const duration = Math.round(performance.now() - startTime);

    setIntegrityReport(report);
    setLastAuditedTimestamp(report.checkedAt);

    if (report.anomalousCount > 0) {
      console.warn(
        `🛡️ [Data Integrity Hook] Audited ${report.totalChecked} articles in ${duration}ms: ` +
        `Found ${report.anomalousCount} items with non-standard timestamps (${report.integrityRate}% valid).`,
        report.anomaliesByReason
      );
    } else {
      console.log(
        `✅ [Data Integrity Hook] Audited ${report.totalChecked} articles in ${duration}ms: ` +
        `100% timestamps are standardized and valid.`
      );
    }
  }, [data?.timestamp, data?.news?.length, enabled]);

  const toggleExcludeAnomalies = useCallback(() => {
    setExcludeAnomalies((prev) => !prev);
  }, []);

  const anomalousArticles = useMemo(() => {
    if (!data?.news) return [];
    return data.news.filter((item) => item.isTimestampAnomalous);
  }, [data?.news]);

  const filterCleanArticles = useCallback(
    (items: ScrapedNewsItem[]): ScrapedNewsItem[] => {
      if (!excludeAnomalies) return items;
      return items.filter((item) => !item.isTimestampAnomalous);
    },
    [excludeAnomalies]
  );

  const auditNewsList = useCallback((items: ScrapedNewsItem[]) => {
    return auditAndFlagNewsTimestamps(items);
  }, []);

  return {
    integrityReport,
    anomalousArticles,
    excludeAnomalies,
    setExcludeAnomalies,
    toggleExcludeAnomalies,
    filterCleanArticles,
    auditNewsList,
    lastAuditedTimestamp
  };
}
