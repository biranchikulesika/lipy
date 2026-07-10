export interface PredictionItem {
  label: string;
  confidence: number;
  character: string;
}

export type PredictionStatus = "success" | "low_confidence" | "ambiguous";

export interface PredictionResponse {
  status: PredictionStatus;
  prediction: string | null;
  confidence: number;
  character: string | null;
  reason: string | null;
  top_predictions: PredictionItem[];
}

export type InputMode = "draw" | "upload" | "camera";

export interface InputModeRef {
  clear: () => void;
  predict: () => Promise<File | Blob | null>;
}