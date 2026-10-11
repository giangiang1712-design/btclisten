import express from 'express';
import fs from 'fs';
import path from 'path';

export interface ServerProcessedAction {
  id: string;
  articleId: string;
  title: string;
  url?: string;
  source?: string;
  summary?: string;
  publishedAt?: string | number;
  handledAt: string; // ISO string
  tier: 'C4' | 'C3' | 'C2' | 'C1';
  importance: 'URGENT' | 'IMPORTANT' | 'MONITORING';
  directiveLabel: string;
  handlingStatus: 'DONE';
  handledBy?: string;
  solutionSummary?: string;
  notes?: string;
  sector?: string;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'processed_actions_db.json');

export class ProcessedActionsManager {
  private actions: ServerProcessedAction[] = [];
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
          this.actions = parsed;
          console.log(`[ProcessedActionsManager] Loaded ${this.actions.length} resolved actions from disk.`);
          return;
        }
      }
    } catch (err: any) {
      console.warn('[ProcessedActionsManager] Error loading processed actions from disk:', err?.message || err);
    }

    // Start with empty actions (0 bài), only recorded when user actively processes an item
    this.actions = [];
    this.saveToDisk(true);
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
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.actions, null, 2), 'utf-8');
      } catch (err: any) {
        console.error('[ProcessedActionsManager] Error saving to disk:', err?.message || err);
      }
    };

    if (immediate) {
      doSave();
    } else {
      this.saveTimeout = setTimeout(doSave, 400);
    }
  }

  public getAll(): ServerProcessedAction[] {
    return [...this.actions];
  }

  public getFiltered(days?: number): ServerProcessedAction[] {
    if (!days || days <= 0) {
      return [...this.actions];
    }
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.actions.filter((item) => {
      const ts = new Date(item.handledAt).getTime();
      return !isNaN(ts) && ts >= cutoffMs;
    });
  }

  public addOrUpdate(item: ServerProcessedAction): ServerProcessedAction {
    const existingIdx = this.actions.findIndex((a) => a.articleId === item.articleId || a.id === item.id);
    if (existingIdx >= 0) {
      this.actions[existingIdx] = {
        ...this.actions[existingIdx],
        ...item,
        handledAt: item.handledAt || new Date().toISOString()
      };
      this.saveToDisk();
      return this.actions[existingIdx];
    } else {
      const newItem: ServerProcessedAction = {
        ...item,
        id: item.id || item.articleId || `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        articleId: item.articleId || item.id,
        handledAt: item.handledAt || new Date().toISOString(),
        handlingStatus: 'DONE'
      };
      this.actions.unshift(newItem);
      this.saveToDisk();
      return newItem;
    }
  }

  public remove(id: string): boolean {
    const initialLen = this.actions.length;
    this.actions = this.actions.filter((a) => a.id !== id && a.articleId !== id);
    if (this.actions.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public batchSync(items: ServerProcessedAction[]): ServerProcessedAction[] {
    if (!Array.isArray(items)) return this.actions;
    items.forEach((item) => {
      this.addOrUpdate(item);
    });
    this.saveToDisk(true);
    return this.actions;
  }
}

export const processedActionsManager = new ProcessedActionsManager();

export const processedActionsRouter = express.Router();

// GET /api/processed-actions?days=1|2|3|7|all
processedActionsRouter.get('/', (req, res) => {
  try {
    const daysParam = req.query.days as string;
    let days: number | undefined;
    if (daysParam && daysParam !== 'all') {
      days = parseInt(daysParam, 10);
      if (isNaN(days) || days <= 0) days = undefined;
    }
    const results = processedActionsManager.getFiltered(days);
    return res.json({
      success: true,
      total: results.length,
      days: days || 'all',
      actions: results
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi lấy dữ liệu việc đã xử lý' });
  }
});

// POST /api/processed-actions
processedActionsRouter.post('/', (req, res) => {
  try {
    const item = req.body;
    if (!item || (!item.articleId && !item.id)) {
      return res.status(400).json({ success: false, error: 'Thiếu mã bài viết (articleId)' });
    }
    const saved = processedActionsManager.addOrUpdate(item);
    return res.json({ success: true, action: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi lưu việc đã xử lý' });
  }
});

// DELETE /api/processed-actions/:id
processedActionsRouter.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const removed = processedActionsManager.remove(id);
    return res.json({ success: true, removed });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi xóa việc đã xử lý' });
  }
});

// POST /api/processed-actions/sync
processedActionsRouter.post('/sync', (req, res) => {
  try {
    const { items } = req.body;
    const all = processedActionsManager.batchSync(items || []);
    return res.json({ success: true, total: all.length, actions: all });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi đồng bộ việc đã xử lý' });
  }
});
