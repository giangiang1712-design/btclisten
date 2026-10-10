export interface GenerateVideoParams {
  prompt?: string;
  newsTitle?: string;
  newsContent?: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
}

export interface VideoStatusResult {
  done: boolean;
  error?: any;
  response?: any;
}

export interface GeneratedVideoRecord {
  id: string;
  title: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  operationName: string;
  createdAt: string;
  videoUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  isQuotaExceeded?: boolean;
  warningMessage?: string;
}

export async function requestGenerateNewsVideo(params: GenerateVideoParams): Promise<{
  operationName: string;
  promptUsed: string;
  isQuotaExceeded?: boolean;
  warningMessage?: string;
}> {
  const res = await fetch('/api/generate-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      newsTitle: params.newsTitle,
      newsContent: params.newsContent,
      aspectRatio: params.aspectRatio || '16:9',
      resolution: params.resolution || '720p',
      model: 'veo-3.1-fast-generate-preview'
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Lỗi khi yêu cầu tạo video với mô hình Google Veo 3.');
  }

  return {
    operationName: data.operationName,
    promptUsed: data.promptUsed,
    isQuotaExceeded: data.isQuotaExceeded,
    warningMessage: data.warningMessage
  };
}

export async function checkNewsVideoStatus(operationName: string): Promise<VideoStatusResult> {
  const res = await fetch('/api/video-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operationName }),
  });

  if (!res.ok) {
    throw new Error('Không thể kiểm tra trạng thái tiến trình tạo video.');
  }

  return await res.json();
}

export function getNewsVideoDownloadUrl(operationName: string): string {
  return `/api/video-download?operationName=${encodeURIComponent(operationName)}`;
}
