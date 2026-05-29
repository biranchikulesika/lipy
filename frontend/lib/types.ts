export interface PredictionItem {
  label: string;
  confidence: number;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  top_predictions: PredictionItem[];
}
