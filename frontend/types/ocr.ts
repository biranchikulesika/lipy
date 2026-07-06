export interface PredictionItem {
  label: string;
  confidence: number;
  character?: string;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  character?: string;
  top_predictions: PredictionItem[];
}

export type InputMode = "draw" | "upload" | "camera";

export interface InputModeRef {
  clear: () => void;
  predict: () => Promise<File | Blob | null>;
}