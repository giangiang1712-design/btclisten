export interface TrainingSample {
  id: number;
  category: string;
  subCategory?: string;
  systemInstruction: string;
  userInput: string;
  idealOutput: string;
  entities?: string[];
  riskLevel?: 'critical' | 'high' | 'medium' | 'low';
  createdAt?: string;
}

export interface TrainingHyperparameters {
  epochs: number;
  batchSize: number;
  learningRateMultiplier: number;
  adapterType: 'LoRA' | 'Full Tuning' | 'QLoRA';
  rank?: number;
}

export interface LossStep {
  epoch: number;
  step: number;
  loss: number;
  valLoss: number;
  learningRate: number;
  accuracy: number;
  timestamp: string;
}

export type TrainingJobStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed' | 'paused';

export interface TrainingJob {
  id: string;
  name: string;
  baseModel: string;
  status: TrainingJobStatus;
  progress: number; // 0 - 100
  currentEpoch: number;
  totalEpochs: number;
  currentStep: number;
  totalSteps: number;
  loss: number;
  valLoss: number;
  datasetSize: number;
  hyperparameters: TrainingHyperparameters;
  lossHistory: LossStep[];
  startedAt: string;
  completedAt?: string;
  tunedModelId?: string;
  logs: string[];
}

export interface ModelComparisonResult {
  prompt: string;
  baseModel: string;
  tunedModel: string;
  baseOutput: string;
  tunedOutput: string;
  baseLatencyMs: number;
  tunedLatencyMs: number;
  evaluation: {
    structureCompliance: number; // 0 - 100
    expertDepthScore: number;    // 0 - 100
    actionabilityScore: number;  // 0 - 100
    policyAccuracy: number;      // 0 - 100
    overallImprovement: number;  // % improvement
    highlights: string[];
  };
}

export interface FineTuningStudioConfig {
  activeModelMode: 'base' | 'tuned' | 'few_shot_boosted';
  activeTunedModelId?: string;
  fewShotSampleCount: number;
  confidenceThreshold: number;
}
