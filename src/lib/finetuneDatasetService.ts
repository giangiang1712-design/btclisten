import { TrainingSample, TrainingJob, ModelComparisonResult, FineTuningStudioConfig } from '../types/finetune';

export const BENCHMARK_FINANCE_PROMPTS = [
  {
    id: 'bm-1',
    category: 'Vĩ mô & Lãi suất, Tỷ giá',
    prompt: 'Phân tích tác động khi Ngân hàng Nhà nước hút ròng 30.000 tỷ qua tín phiếu 28 ngày và tỷ giá USD/VND tự do vượt 25.800. Đánh giá thanh khoản liên ngân hàng và khuyến nghị cho ban điều hành ngân hàng.',
  },
  {
    id: 'bm-2',
    category: 'Bất động sản & Trái phiếu Doanh nghiệp',
    prompt: 'Một tập đoàn bất động sản lớn bị trái chủ bác đề xuất gia hạn lô trái phiếu 3.500 tỷ và ngân hàng quản lý tài sản bảo đảm kích hoạt điều khoản bán giải chấp cổ phiếu. Đánh giá rủi ro vỡ nợ chéo và kịch bản ứng phó.',
  },
  {
    id: 'bm-3',
    category: 'Hệ thống Ngân hàng & Quản trị Rủi ro',
    prompt: 'Phân tích trường hợp NIM của khối NHTM cổ phần giảm 40 điểm cơ bản trong khi tỷ lệ nợ nhóm 2 và nợ tái cơ cấu chuyển xấu tăng 35%. Đánh giá áp lực trích lập dự phòng và định giá cổ phiếu ngân hàng.',
  },
  {
    id: 'bm-4',
    category: 'Khủng hoảng Truyền thông & Tin đồn',
    prompt: 'Mạng xã hội lan truyền văn bản chưa kiểm chứng về việc phong tỏa tài sản và tạm hoãn xuất cảnh Chủ tịch HĐQT của một công ty chứng khoán Top 5. Xây dựng kịch bản 4T xử lý khủng hoảng trong 24 giờ đầu.',
  },
  {
    id: 'bm-5',
    category: 'Thẩm định Báo cáo Tài chính & Dấu hiệu Cảnh báo',
    prompt: 'Doanh nghiệp niêm yết có doanh thu tăng 45% nhưng dòng tiền thuần từ HĐKD âm 3 năm liên tiếp, khoản tạm ứng nhân viên và phải thu khác chiếm 65% tổng tài sản. Đánh giá chất lượng lợi nhuận và rủi ro kiểm toán.',
  }
];

export async function fetchDatasetSamples(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
}): Promise<{ samples: TrainingSample[]; total: number; categories: { name: string; count: number }[] }> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.pageSize) query.append('pageSize', String(params.pageSize));
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`/api/finetune/samples?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch dataset from server API:', err);
  }

  return {
    samples: [],
    total: 0,
    categories: [],
  };
}

export async function fetchTrainingJobs(): Promise<TrainingJob[]> {
  try {
    const res = await fetch('/api/finetune/jobs');
    if (res.ok) {
      const data = await res.json();
      return data.jobs || [];
    }
  } catch (err) {
    console.warn('Failed to fetch training jobs:', err);
  }
  return [];
}

export async function startTrainingJob(params: {
  name: string;
  baseModel: string;
  epochs: number;
  batchSize: number;
  learningRateMultiplier: number;
  adapterType: string;
}): Promise<{ success: boolean; job: TrainingJob; message: string }> {
  const res = await fetch('/api/finetune/start-training', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Lỗi khởi động huấn luyện' }));
    throw new Error(err.error || 'Không thể bắt đầu quá trình huấn luyện');
  }

  return await res.json();
}

export async function runModelComparison(prompt: string, tunedModelId?: string): Promise<ModelComparisonResult> {
  const res = await fetch('/api/finetune/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, tunedModelId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Lỗi đánh giá so sánh mô hình' }));
    throw new Error(err.error || 'Không thể thực thi so sánh mô hình');
  }

  const data = await res.json();
  return data.result;
}

export async function getStudioConfig(): Promise<FineTuningStudioConfig> {
  try {
    const res = await fetch('/api/finetune/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Config fetch failed:', e);
  }
  return {
    activeModelMode: 'few_shot_boosted',
    activeTunedModelId: 'tunedModels/vietnam-finance-expert-v1',
    fewShotSampleCount: 3,
    confidenceThreshold: 0.85,
  };
}

export async function updateStudioConfig(config: Partial<FineTuningStudioConfig>): Promise<FineTuningStudioConfig> {
  const res = await fetch('/api/finetune/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    throw new Error('Không thể cập nhật cấu hình triển khai mô hình');
  }
  return await res.json();
}
