import type { PredictionResponse } from "@/types/ocr";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: any, message?: string };
    if (typeof payload.message === 'string') {
      return payload.message;
    }
    if (typeof payload.detail === 'string') {
      return payload.detail;
    }
    if (Array.isArray(payload.detail) && payload.detail.length > 0 && payload.detail[0].msg) {
      return payload.detail.map((d: any) => d.msg).join(", ");
    }
    return response.statusText ?? "Prediction request failed.";
  } catch {
    return response.statusText || "Prediction request failed.";
  }
}

export async function predictOdiaCharacter(image: File): Promise<PredictionResponse> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const formData = new FormData();
  formData.append("image", image);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as PredictionResponse;
}
