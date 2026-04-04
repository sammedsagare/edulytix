/** Auth */
export interface AuthResponse {
  token: string;
  email: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
}

/** Analysis result returned by backend */
export interface AnalysisResult {
  id: number;
  fileName: string;
  selectedColumn: string;
  rowCount: number;
  overallSentiment: 'Positive' | 'Negative' | 'Neutral';
  sentimentDistribution: Record<string, number>;
  keywords: string[];
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  createdAt: string;
}
