export interface DiagnosticsResult {
  id: string;
  answers: Record<string, number>;
  totalScore: number;
  totalPercentage: number;
  blockScores: Array<{
    id: string;
    title: string;
    score: number;
    maxScore: number;
    percentage: number;
    level: 'critical' | 'medium' | 'good';
    icon: string;
  }>;
  createdAt: string;
}

const STORAGE_KEY = 'diagnostics_results';

export const saveDiagnosticsResult = (result: Omit<DiagnosticsResult, 'id' | 'createdAt'>): DiagnosticsResult => {
  const results = getDiagnosticsResults();
  
  const newResult: DiagnosticsResult = {
    ...result,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };
  
  results.unshift(newResult);
  
  if (results.length > 10) {
    results.splice(10);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  
  return newResult;
};

export const getDiagnosticsResults = (): DiagnosticsResult[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading diagnostics results:', error);
    return [];
  }
};

export const getDiagnosticsResultById = (id: string): DiagnosticsResult | null => {
  const results = getDiagnosticsResults();
  return results.find(r => r.id === id) || null;
};

export const deleteDiagnosticsResult = (id: string): void => {
  const results = getDiagnosticsResults();
  const filtered = results.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};
