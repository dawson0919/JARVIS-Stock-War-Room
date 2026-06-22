import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchMarketBrief,
  fetchStockAnalysis,
  fetchTopStocks,
  mockMarketBrief,
  topRatedStocks as mockTopRatedStocks,
} from './src/services/jarvisApi';
import type { MarketBrief, StockAnalysis, TopRatedStock } from './src/types/jarvis';

export default function App() {
  const [symbol, setSymbol] = useState('');
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [marketBrief, setMarketBrief] = useState<MarketBrief>(mockMarketBrief);
  const [topStocks, setTopStocks] = useState<TopRatedStock[]>(mockTopRatedStocks);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [brief, stocks] = await Promise.all([
          fetchMarketBrief(),
          fetchTopStocks(5),
        ]);
        if (!isMounted) return;
        setMarketBrief(brief);
        setTopStocks(stocks);
      } catch {
        if (!isMounted) return;
        setMarketBrief(mockMarketBrief);
        setTopStocks(mockTopRatedStocks);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const marketTone = useMemo(() => {
    if (marketBrief.marketPulse >= 80) return 'Risk-on leadership is concentrated in high-quality momentum.';
    if (marketBrief.marketPulse >= 65) return 'Selective opportunity. Quality and risk control matter.';
    return 'Defensive posture. Wait for stronger confirmation.';
  }, [marketBrief.marketPulse]);

  const sortedFactors = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.factors].sort((a, b) => b.score - a.score);
  }, [analysis]);

  async function analyzeSymbol(nextSymbol?: string) {
    const normalized = (nextSymbol ?? symbol).trim().toUpperCase();
    if (!normalized) {
      Alert.alert('Enter a symbol', 'Type a US ticker such as NVDA, AAPL, TSLA, SPY, or QQQ.');
      return;
    }
    setSymbol(normalized);
    setIsLoading(true);
    try {
      setAnalysis(await fetchStockAnalysis(normalized));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach JARVIS API.';
      Alert.alert('Analysis failed', message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.hero}>
            <View>
              <Text style={styles.eyebrow}>JARVIS STOCK WAR ROOM</Text>
              <Text style={styles.title}>US Equity Scoring Console</Text>
              <Text style={styles.heroSub}>
                Rank the universe, inspect factor strength, and turn a ticker into a research brief.
              </Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeValue}>{marketBrief.marketPulse}</Text>
              <Text style={styles.scoreBadgeLabel}>Market Pulse</Text>
            </View>
          </View>

          <View style={styles.searchPanel}>
            <Text style={styles.sectionTitle}>Analyze a ticker</Text>
            <Text style={styles.helperText}>
              Enter a US stock symbol. JARVIS turns fundamentals, momentum, valuation, flow,
              and risk into one research score.
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={setSymbol}
                onSubmitEditing={() => analyzeSymbol()}
                placeholder="NVDA"
                placeholderTextColor="#69707f"
                returnKeyType="search"
                style={styles.input}
                value={symbol}
              />
              <Pressable
                disabled={isLoading}
                onPress={() => analyzeSymbol()}
                style={[styles.primaryButton, isLoading ? styles.disabledButton : null]}
              >
                <Text style={styles.primaryButtonText}>{isLoading ? 'Loading' : 'Analyze'}</Text>
              </Pressable>
            </View>
            <View style={styles.quickRow}>
              {topStocks.slice(0, 4).map((stock) => (
                <Pressable
                  disabled={isLoading}
                  key={stock.symbol}
                  onPress={() => analyzeSymbol(stock.symbol)}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>{stock.symbol}</Text>
                  <Text style={styles.quickChipScore}>{stock.score}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {analysis ? (
            <View style={styles.analysisCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.symbol}>{analysis.symbol}</Text>
                  <Text style={[styles.rating, { color: scoreColor(analysis.score) }]}>
                    {analysis.rating}
                  </Text>
                </View>
                <View style={[styles.largeScore, { borderColor: scoreColor(analysis.score) }]}>
                  <Text style={[styles.largeScoreText, { color: scoreColor(analysis.score) }]}>
                    {analysis.score}
                  </Text>
                  <Text style={styles.largeScoreSub}> / 100</Text>
                </View>
              </View>
              <View style={styles.scoreMeterTrack}>
                <View
                  style={[
                    styles.scoreMeterFill,
                    { backgroundColor: scoreColor(analysis.score), width: `${analysis.score}%` },
                  ]}
                />
              </View>
              <View style={styles.researchStrip}>
                <Metric label="Research posture" value={scoreLabel(analysis.score)} />
                <Metric label="Universe side" value="Long screen" />
                <Metric label="Factor count" value={`${analysis.factors.length}`} />
              </View>
              <Text style={styles.summary}>{analysis.summary}</Text>
              <View style={styles.factorPanel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.sectionTitle}>Factor breakdown</Text>
                  <Text style={styles.updated}>0-100 model score</Text>
                </View>
                {sortedFactors.map((factor) => (
                  <View key={factor.name} style={styles.factorRow}>
                    <View style={styles.factorTopLine}>
                      <Text style={styles.factorName}>{factor.name}</Text>
                      <Text style={[styles.factorValue, { color: scoreColor(factor.score) }]}>
                        {factor.score}
                      </Text>
                    </View>
                    <View style={styles.factorTrack}>
                      <View
                        style={[
                          styles.factorFill,
                          { backgroundColor: scoreColor(factor.score), width: `${factor.score}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.riskBox}>
                <Text style={styles.riskTitle}>Key risk</Text>
                <Text style={styles.riskText}>{analysis.keyRisk}</Text>
              </View>
              <View style={styles.checklist}>
                <Text style={styles.sectionTitle}>Research checklist</Text>
                <ChecklistItem label="Confirm latest earnings date and guidance." />
                <ChecklistItem label="Compare factor score against sector peers." />
                <ChecklistItem label="Check liquidity, event risk, and position sizing before any decision." />
              </View>
            </View>
          ) : null}

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.sectionTitle}>Today&apos;s market brief</Text>
              <Text style={styles.updated}>Updated daily</Text>
            </View>
            <Text style={styles.marketTone}>{marketTone}</Text>
            <View style={styles.marketGrid}>
              <Metric label="Regime" value={marketBrief.regime ?? 'Unknown'} />
              <Metric label="Universe" value={`${marketBrief.universeCount}`} />
              <Metric label="VIX" value={marketBrief.vix ? marketBrief.vix.toFixed(1) : 'N/A'} />
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.sectionTitle}>Top rated stocks</Text>
              <Text style={styles.updated}>Pro unlocks Top 100</Text>
            </View>
            {topStocks.map((stock, index) => (
              <Pressable
                disabled={isLoading}
                key={stock.symbol}
                onPress={() => analyzeSymbol(stock.symbol)}
                style={styles.stockRow}
              >
                <Text style={styles.rank}>#{index + 1}</Text>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                  <Text style={styles.stockName}>{stock.sector ?? stock.name}</Text>
                </View>
                <Text style={styles.stockScore}>{stock.score}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              JARVIS is for market education and research only. It does not provide investment
              advice, personalized recommendations, brokerage services, or guaranteed results.
              Investing involves risk, including possible loss of principal.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <View style={styles.checklistItem}>
      <View style={styles.checkDot} />
      <Text style={styles.checkText}>{label}</Text>
    </View>
  );
}

function scoreColor(score: number): string {
  if (score >= 85) return '#18d79a';
  if (score >= 70) return '#4f8cff';
  if (score >= 55) return '#ffcc66';
  return '#ff6b72';
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Watch';
  if (score >= 55) return 'Neutral';
  return 'Caution';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07090d',
  },
  keyboard: {
    flex: 1,
  },
  page: {
    gap: 18,
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: '#111720',
    borderColor: '#243044',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    padding: 20,
  },
  eyebrow: {
    color: '#19c58c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
  },
  title: {
    color: '#f6f8fb',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 32,
    maxWidth: 420,
  },
  heroSub: {
    color: '#9ba4b2',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 470,
  },
  scoreBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0b1118',
    borderColor: '#1c8f69',
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 92,
    padding: 14,
  },
  scoreBadgeValue: {
    color: '#19c58c',
    fontSize: 32,
    fontWeight: '900',
  },
  scoreBadgeLabel: {
    color: '#a8b1bf',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchPanel: {
    backgroundColor: '#111318',
    borderColor: '#242833',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  sectionTitle: {
    color: '#f4f7fb',
    fontSize: 18,
    fontWeight: '900',
  },
  helperText: {
    color: '#9ba4b2',
    fontSize: 14,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: '#080a0e',
    borderColor: '#2a3140',
    borderRadius: 8,
    borderWidth: 1,
    color: '#ffffff',
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#19c58c',
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 98,
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#03100b',
    fontSize: 15,
    fontWeight: '900',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickChip: {
    alignItems: 'center',
    backgroundColor: '#080a0e',
    borderColor: '#243044',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  quickChipText: {
    color: '#f6f8fb',
    fontSize: 13,
    fontWeight: '900',
  },
  quickChipScore: {
    color: '#19c58c',
    fontSize: 13,
    fontWeight: '900',
  },
  analysisCard: {
    backgroundColor: '#10151d',
    borderColor: '#1c8f69',
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  symbol: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },
  rating: {
    color: '#19c58c',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  largeScore: {
    alignItems: 'baseline',
    backgroundColor: '#080a0e',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  largeScoreText: {
    color: '#19c58c',
    fontSize: 42,
    fontWeight: '900',
  },
  largeScoreSub: {
    color: '#8d96a5',
    fontSize: 16,
    fontWeight: '800',
  },
  scoreMeterTrack: {
    backgroundColor: '#252b35',
    borderRadius: 999,
    height: 9,
    overflow: 'hidden',
  },
  scoreMeterFill: {
    borderRadius: 999,
    height: '100%',
  },
  researchStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  summary: {
    color: '#dce4ef',
    fontSize: 15,
    lineHeight: 22,
  },
  factorPanel: {
    backgroundColor: '#07090d',
    borderColor: '#242833',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  factorRow: {
    gap: 7,
  },
  factorTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  factorName: {
    color: '#dce4ef',
    fontSize: 13,
    fontWeight: '800',
  },
  factorValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  factorTrack: {
    backgroundColor: '#1c222c',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  factorFill: {
    borderRadius: 999,
    height: '100%',
  },
  riskBox: {
    backgroundColor: '#17120b',
    borderColor: '#4c3513',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  riskTitle: {
    color: '#ffcc66',
    fontSize: 14,
    fontWeight: '900',
  },
  riskText: {
    color: '#d8dce3',
    fontSize: 14,
    lineHeight: 21,
  },
  checklist: {
    backgroundColor: '#0b1017',
    borderColor: '#233041',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  checklistItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  checkDot: {
    backgroundColor: '#19c58c',
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  checkText: {
    color: '#cbd3df',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  panel: {
    backgroundColor: '#111318',
    borderColor: '#242833',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updated: {
    color: '#788292',
    fontSize: 12,
    fontWeight: '700',
  },
  marketTone: {
    color: '#dce4ef',
    fontSize: 15,
    lineHeight: 22,
  },
  marketGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    alignItems: 'center',
    backgroundColor: '#080a0e',
    borderColor: '#232a36',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#8f98a7',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  stockRow: {
    alignItems: 'center',
    backgroundColor: '#080a0e',
    borderColor: '#232a36',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  rank: {
    color: '#687183',
    fontSize: 14,
    fontWeight: '900',
    width: 34,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  stockName: {
    color: '#8f98a7',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  stockScore: {
    color: '#19c58c',
    fontSize: 24,
    fontWeight: '900',
  },
  disclaimer: {
    borderColor: '#293140',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  disclaimerText: {
    color: '#8d96a5',
    fontSize: 12,
    lineHeight: 18,
  },
});
