import type { MarketBrief, StockAnalysis, TopRatedStock } from '../types/jarvis';

export const topRatedStocks: TopRatedStock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp.', score: 91 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', score: 88 },
  { symbol: 'AAPL', name: 'Apple Inc.', score: 84 },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', score: 81 },
  { symbol: 'SPY', name: 'S&P 500 ETF', score: 78 },
];

export const mockMarketBrief: MarketBrief = {
  asOf: null,
  marketPulse: 82,
  regime: 'Mock',
  vix: null,
  summary: 'Connect the JARVIS FastAPI service to load the latest scored universe.',
  universeCount: topRatedStocks.length,
};

const factorNames = ['Quality', 'Growth', 'Valuation', 'Momentum', 'Flow', 'Risk'];

export function getMockStockAnalysis(symbol: string): StockAnalysis {
  const seed = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const score = 58 + (seed % 38);
  const rating = score >= 85
    ? 'Strong Research Candidate'
    : score >= 72
      ? 'Watchlist Candidate'
      : score >= 60
        ? 'Neutral'
        : 'High Risk';

  return {
    symbol,
    score,
    rating,
    summary: `${symbol} currently screens as a ${rating.toLowerCase()} in the JARVIS research model. The next production step is to connect this card to the FastAPI scoring endpoint generated from the Python JARVIS pipeline.`,
    keyRisk: 'This is research data, not a trading signal. Confirm earnings date, liquidity, valuation, and market regime before making any decision.',
    factors: factorNames.map((name, index) => ({
      name,
      score: Math.max(35, Math.min(96, score + ((seed + index * 13) % 21) - 10)),
    })),
  };
}

export async function fetchStockAnalysis(symbol: string): Promise<StockAnalysis> {
  const baseUrl = process.env.EXPO_PUBLIC_JARVIS_API_URL;
  if (!baseUrl) return getMockStockAnalysis(symbol);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/stocks/${symbol}/score`);
  if (!response.ok) {
    throw new Error(`JARVIS API ${response.status}`);
  }

  return response.json() as Promise<StockAnalysis>;
}

export async function fetchMarketBrief(): Promise<MarketBrief> {
  const baseUrl = process.env.EXPO_PUBLIC_JARVIS_API_URL;
  if (!baseUrl) return mockMarketBrief;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/market/brief`);
  if (!response.ok) {
    throw new Error(`JARVIS API ${response.status}`);
  }

  return response.json() as Promise<MarketBrief>;
}

export async function fetchTopStocks(limit = 5): Promise<TopRatedStock[]> {
  const baseUrl = process.env.EXPO_PUBLIC_JARVIS_API_URL;
  if (!baseUrl) return topRatedStocks;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/stocks/top?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`JARVIS API ${response.status}`);
  }

  const payload = await response.json() as { stocks: TopRatedStock[] };
  return payload.stocks;
}
