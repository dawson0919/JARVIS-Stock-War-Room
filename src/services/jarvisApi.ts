import type { MarketBrief, StockAnalysis, TopRatedStock } from '../types/jarvis';

export class StockNotFoundError extends Error {
  constructor(public readonly symbol: string) {
    super(`${symbol} is not in the current JARVIS scored universe.`);
    this.name = 'StockNotFoundError';
  }
}

export const topRatedStocks: TopRatedStock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corp.', score: 91 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', score: 88 },
  { symbol: 'AAPL', name: 'Apple Inc.', score: 84 },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', score: 81 },
  { symbol: 'SPY', name: 'S&P 500 ETF', score: 78 },
];

export const bottomRatedStocks: TopRatedStock[] = [
  { symbol: 'RIVN', name: 'Rivian Automotive Inc.', score: 42 },
  { symbol: 'SNAP', name: 'Snap Inc.', score: 39 },
  { symbol: 'PLUG', name: 'Plug Power Inc.', score: 35 },
  { symbol: 'LCID', name: 'Lucid Group Inc.', score: 33 },
  { symbol: 'WBA', name: 'Walgreens Boots Alliance Inc.', score: 31 },
];

export const mockMarketBrief: MarketBrief = {
  asOf: null,
  marketPulse: 82,
  regime: 'Mock',
  vix: null,
  summary: 'Connect the JARVIS FastAPI service to load the latest scored universe.',
  universeCount: topRatedStocks.length,
};

const factorNames = ['Quality', 'Growth', 'Value', 'Momentum', 'Institutional', 'Short Interest'];

const mockCompanyProfiles: Record<string, string> = {
  NVDA: 'NVIDIA designs GPUs, accelerated computing platforms, and AI infrastructure used across data centers, gaming, visualization, automotive, and edge AI.',
  AAPL: 'Apple designs consumer devices, software, and services, with revenue driven by iPhone, Mac, iPad, wearables, and its services ecosystem.',
  MSFT: 'Microsoft provides cloud infrastructure, productivity software, operating systems, enterprise platforms, gaming, and AI services.',
  BE: 'Bloom Energy Corporation designs and sells solid-oxide fuel-cell systems used for on-site power generation.',
};

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
    name: topRatedStocks.find((stock) => stock.symbol === symbol)?.name ?? symbol,
    sector: symbol === 'NVDA' ? 'Information Technology' : 'US Equity',
    score,
    rating,
    summary: `${symbol} currently screens as a ${rating.toLowerCase()} in the JARVIS research model. The next production step is to connect this card to the FastAPI scoring endpoint generated from the Python JARVIS pipeline.`,
    keyRisk: 'This is research data, not a trading signal. Confirm earnings date, liquidity, valuation, and market regime before making any decision.',
    factors: factorNames.map((name, index) => ({
      name,
      score: Math.max(35, Math.min(96, score + ((seed + index * 13) % 21) - 10)),
    })),
    companyProfile: mockCompanyProfiles[symbol] ?? `${symbol} is profiled through the JARVIS research model using sector context, factor strength, market regime, and risk inputs.`,
    qualitativeAnalysis: `${symbol} is a research candidate in the JARVIS model. Review the strongest and weakest factor scores before making any decision.`,
    newsCatalysts: [
      `Company/news check: verify the latest filings, earnings date, and management guidance for ${symbol}.`,
      `Sector catalyst: compare ${symbol} against sector peers and relative strength.`,
      `Market catalyst: watch revisions, volume, and market risk appetite; current score is ${score}/100.`,
    ],
  };
}

export async function fetchStockAnalysis(symbol: string): Promise<StockAnalysis> {
  const baseUrl = process.env.EXPO_PUBLIC_JARVIS_API_URL;
  if (!baseUrl) return getMockStockAnalysis(symbol);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/stocks/${symbol}/score`);
  if (response.status === 404) {
    throw new StockNotFoundError(symbol);
  }
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

export async function fetchBottomStocks(limit = 10): Promise<TopRatedStock[]> {
  const baseUrl = process.env.EXPO_PUBLIC_JARVIS_API_URL;
  if (!baseUrl) return bottomRatedStocks.slice(0, limit);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/stocks/bottom?limit=${limit}`);
  if (!response.ok) {
    return bottomRatedStocks.slice(0, limit);
  }

  const payload = await response.json() as { stocks: TopRatedStock[] };
  return payload.stocks;
}
