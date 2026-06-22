export type JarvisFactor = {
  name: string;
  score: number;
};

export type TopRatedStock = {
  symbol: string;
  name: string;
  score: number;
  sector?: string | null;
};

export type StockAnalysis = {
  symbol: string;
  score: number;
  rating: string;
  summary: string;
  keyRisk: string;
  factors: JarvisFactor[];
};

export type MarketBrief = {
  asOf: string | null;
  marketPulse: number;
  regime: string | null;
  vix: number | null;
  summary: string;
  universeCount: number;
};
