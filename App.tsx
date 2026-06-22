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
  fetchBottomStocks,
  fetchMarketBrief,
  fetchStockAnalysis,
  fetchTopStocks,
  mockMarketBrief,
  bottomRatedStocks as mockBottomRatedStocks,
  topRatedStocks as mockTopRatedStocks,
} from './src/services/jarvisApi';
import type { MarketBrief, StockAnalysis, TopRatedStock } from './src/types/jarvis';

type Language = 'zh' | 'en';

const copy = {
  zh: {
    appName: 'JARVIS 美股戰情室',
    title: '美股智能評分系統',
    subtitle: '輸入股票代號，查看公司簡介、評分因子、多空排行與風險重點。',
    marketPulse: '市場脈搏',
    analyzeTitle: '輸入股票代號分析',
    analyzeHelp: 'JARVIS 會整合基本面、動能、估值、資金流與風險，產生 0-100 的研究評分。',
    analyze: '開始分析',
    loading: '分析中',
    emptyTitle: '請輸入股票代號',
    emptyMessage: '例如 NVDA、AAPL、TSLA、SPY 或 QQQ。',
    failedTitle: '分析失敗',
    apiFailed: '目前無法連線到 JARVIS API。',
    posture: '研究定位',
    universeSide: '多空方向',
    factorCount: '因子數',
    companyIntro: '公司簡介',
    newsTitle: '新聞與催化重點',
    factorBreakdown: '因子拆解',
    modelScore: '0-100 模型分數',
    keyRisk: '主要風險',
    checklist: '研究檢查清單',
    checklistItems: [
      '確認最新財報日期、營收指引與法說內容。',
      '和同產業股票比較因子分數與相對強弱。',
      '檢查流動性、事件風險與部位大小，再做決策。',
    ],
    marketBrief: '今日市場摘要',
    updatedDaily: '每日更新',
    regime: '市場狀態',
    universe: '股票池',
    vix: 'VIX',
    bullishTop: '10 大多方股票',
    bearishTop: '10 大空方股票',
    proUnlocks: 'Pro 可解鎖完整排行',
    disclaimer:
      'JARVIS 僅供市場教育與研究使用，不提供投資建議、個人化推薦、券商服務或保證報酬。投資有風險，可能損失本金。',
    newsHint: '新聞串接前，先以公司評分摘要、產業位置與風險重點作為研究起點。',
  },
  en: {
    appName: 'JARVIS Stock War Room',
    title: 'US Equity Intelligence Rating',
    subtitle: 'Enter a ticker to review company context, factor scores, long/short rankings, and risk notes.',
    marketPulse: 'Market Pulse',
    analyzeTitle: 'Analyze a ticker',
    analyzeHelp:
      'JARVIS blends fundamentals, momentum, valuation, flow, and risk into one 0-100 research score.',
    analyze: 'Analyze',
    loading: 'Loading',
    emptyTitle: 'Enter a symbol',
    emptyMessage: 'Try NVDA, AAPL, TSLA, SPY, or QQQ.',
    failedTitle: 'Analysis failed',
    apiFailed: 'Unable to reach JARVIS API.',
    posture: 'Research posture',
    universeSide: 'Universe side',
    factorCount: 'Factor count',
    companyIntro: 'Company profile',
    newsTitle: 'News and catalysts',
    factorBreakdown: 'Factor breakdown',
    modelScore: '0-100 model score',
    keyRisk: 'Key risk',
    checklist: 'Research checklist',
    checklistItems: [
      'Confirm latest earnings date, guidance, and conference-call notes.',
      'Compare factor score against sector peers and relative strength.',
      'Check liquidity, event risk, and position sizing before any decision.',
    ],
    marketBrief: "Today's market brief",
    updatedDaily: 'Updated daily',
    regime: 'Regime',
    universe: 'Universe',
    vix: 'VIX',
    bullishTop: 'Top 10 bullish stocks',
    bearishTop: 'Top 10 bearish stocks',
    proUnlocks: 'Pro unlocks full rankings',
    disclaimer:
      'JARVIS is for market education and research only. It does not provide investment advice, personalized recommendations, brokerage services, or guaranteed results. Investing involves risk, including possible loss of principal.',
    newsHint: 'Before live news is connected, use the score summary, sector context, and risk notes as the research starting point.',
  },
} as const;

export default function App() {
  const [language, setLanguage] = useState<Language>('zh');
  const [symbol, setSymbol] = useState('');
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [marketBrief, setMarketBrief] = useState<MarketBrief>(mockMarketBrief);
  const [topStocks, setTopStocks] = useState<TopRatedStock[]>(mockTopRatedStocks);
  const [bottomStocks, setBottomStocks] = useState<TopRatedStock[]>(mockBottomRatedStocks);
  const t = copy[language];

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [brief, stocks, bottom] = await Promise.all([
          fetchMarketBrief(),
          fetchTopStocks(10),
          fetchBottomStocks(10),
        ]);
        if (!isMounted) return;
        setMarketBrief(brief);
        setTopStocks(stocks);
        setBottomStocks(bottom);
      } catch {
        if (!isMounted) return;
        setMarketBrief(mockMarketBrief);
        setTopStocks(mockTopRatedStocks);
        setBottomStocks(mockBottomRatedStocks);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const marketTone = useMemo(() => {
    if (language === 'zh') {
      if (marketBrief.marketPulse >= 80) return '市場偏多，強勢領導股集中在高品質動能族群。';
      if (marketBrief.marketPulse >= 65) return '市場有選股機會，但品質與風控更重要。';
      return '市場偏防守，等待更明確的確認訊號。';
    }
    if (marketBrief.marketPulse >= 80) return 'Risk-on leadership is concentrated in high-quality momentum.';
    if (marketBrief.marketPulse >= 65) return 'Selective opportunity. Quality and risk control matter.';
    return 'Defensive posture. Wait for stronger confirmation.';
  }, [language, marketBrief.marketPulse]);

  const sortedFactors = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.factors].sort((a, b) => b.score - a.score);
  }, [analysis]);

  async function analyzeSymbol(nextSymbol?: string) {
    const normalized = (nextSymbol ?? symbol).trim().toUpperCase();
    if (!normalized) {
      Alert.alert(t.emptyTitle, t.emptyMessage);
      return;
    }
    setSymbol(normalized);
    setIsLoading(true);
    try {
      setAnalysis(await fetchStockAnalysis(normalized));
    } catch (error) {
      const message = error instanceof Error ? error.message : t.apiFailed;
      Alert.alert(t.failedTitle, message);
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
              <Text style={styles.eyebrow}>JARVIS SCORE</Text>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.heroSub}>{t.subtitle}</Text>
              <View style={styles.languageRow}>
                <Pressable
                  onPress={() => setLanguage('zh')}
                  style={[styles.languageChip, language === 'zh' ? styles.languageChipActive : null]}
                >
                  <Text style={styles.languageChipText}>繁中</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLanguage('en')}
                  style={[styles.languageChip, language === 'en' ? styles.languageChipActive : null]}
                >
                  <Text style={styles.languageChipText}>English</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeValue}>{marketBrief.marketPulse}</Text>
              <Text style={styles.scoreBadgeLabel}>{t.marketPulse}</Text>
            </View>
          </View>

          <View style={styles.searchPanel}>
            <Text style={styles.sectionTitle}>{t.analyzeTitle}</Text>
            <Text style={styles.helperText}>{t.analyzeHelp}</Text>
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
                <Text style={styles.primaryButtonText}>{isLoading ? t.loading : t.analyze}</Text>
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
                <Metric label={t.posture} value={scoreLabel(analysis.score, language)} />
                <Metric label={t.universeSide} value={analysis.score >= 55 ? (language === 'zh' ? '多方觀察' : 'Long screen') : (language === 'zh' ? '空方警戒' : 'Short watch')} />
                <Metric label={t.factorCount} value={`${analysis.factors.length}`} />
              </View>
              <View style={styles.companyBox}>
                <Text style={styles.sectionTitle}>{t.companyIntro}</Text>
                <Text style={styles.summary}>{analysis.summary}</Text>
              </View>
              <View style={styles.newsBox}>
                <Text style={styles.sectionTitle}>{t.newsTitle}</Text>
                <Text style={styles.riskText}>{t.newsHint}</Text>
              </View>
              <View style={styles.factorPanel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.sectionTitle}>{t.factorBreakdown}</Text>
                  <Text style={styles.updated}>{t.modelScore}</Text>
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
                <Text style={styles.riskTitle}>{t.keyRisk}</Text>
                <Text style={styles.riskText}>{analysis.keyRisk}</Text>
              </View>
              <View style={styles.checklist}>
                <Text style={styles.sectionTitle}>{t.checklist}</Text>
                {t.checklistItems.map((item) => (
                  <ChecklistItem key={item} label={item} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.sectionTitle}>{t.marketBrief}</Text>
              <Text style={styles.updated}>{t.updatedDaily}</Text>
            </View>
            <Text style={styles.marketTone}>{marketTone}</Text>
            <View style={styles.marketGrid}>
              <Metric label={t.regime} value={marketBrief.regime ?? 'Unknown'} />
              <Metric label={t.universe} value={`${marketBrief.universeCount}`} />
              <Metric label={t.vix} value={marketBrief.vix ? marketBrief.vix.toFixed(1) : 'N/A'} />
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.sectionTitle}>{t.bullishTop}</Text>
              <Text style={styles.updated}>{t.proUnlocks}</Text>
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

          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.sectionTitle}>{t.bearishTop}</Text>
              <Text style={styles.updated}>{t.proUnlocks}</Text>
            </View>
            {bottomStocks.map((stock, index) => (
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
                <Text style={[styles.stockScore, { color: scoreColor(stock.score) }]}>{stock.score}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>{t.disclaimer}</Text>
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

function scoreLabel(score: number, language: Language): string {
  if (language === 'zh') {
    if (score >= 85) return '強勢';
    if (score >= 70) return '觀察';
    if (score >= 55) return '中性';
    return '警戒';
  }
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
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  languageChip: {
    backgroundColor: '#080a0e',
    borderColor: '#243044',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageChipActive: {
    borderColor: '#19c58c',
    backgroundColor: '#10251e',
  },
  languageChipText: {
    color: '#f6f8fb',
    fontSize: 12,
    fontWeight: '900',
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
  companyBox: {
    backgroundColor: '#0b1017',
    borderColor: '#233041',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  newsBox: {
    backgroundColor: '#091912',
    borderColor: '#1c8f69',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
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
