export interface PredictionItem {
  label: string;
  confidence: number;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  top_predictions: PredictionItem[];
}

export type InputMode = "draw" | "upload" | "camera";

export interface InputModeRef {
  clear: () => void;
  predict: () => Promise<File | Blob | null>;
}