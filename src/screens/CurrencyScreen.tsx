import React, {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useColors, AppColors} from '../context/ThemeContext';
import {fetchCathayRates, RateData} from '../utils/currencyFetch';

export default function CurrencyScreen() {
  const navigation = useNavigation();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scrollRef = useRef<ScrollView>(null);

  const [rates, setRates] = useState<RateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [twdInput, setTwdInput] = useState('');
  const [usdInput, setUsdInput] = useState('');
  const [jpyInput, setJpyInput] = useState('');

  const clearAll = useCallback(() => {
    setTwdInput('');
    setUsdInput('');
    setJpyInput('');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCathayRates();
      setRates(data);
    } catch (e: any) {
      setError(e?.message ?? '無法取得匯率');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // TWD → USD/JPY
  const handleTwdChange = (val: string) => {
    setTwdInput(val);
    setUsdInput('');
    setJpyInput('');
    if (!rates) {return;}
    const twd = parseFloat(val);
    if (!isNaN(twd) && twd > 0) {
      setUsdInput((twd / rates.usdSell).toFixed(2));
      setJpyInput(Math.floor(twd / rates.jpySell).toLocaleString());
    }
  };

  // USD → TWD
  const handleUsdChange = (val: string) => {
    setUsdInput(val);
    setTwdInput('');
    setJpyInput('');
    if (!rates) {return;}
    const usd = parseFloat(val);
    if (!isNaN(usd) && usd > 0) {
      setTwdInput(Math.round(usd * rates.usdSell).toLocaleString());
    }
  };

  // JPY → TWD
  const handleJpyChange = (val: string) => {
    const numOnly = val.replace(/,/g, '');
    setJpyInput(val);
    setTwdInput('');
    setUsdInput('');
    if (!rates) {return;}
    const jpy = parseFloat(numOnly);
    if (!isNaN(jpy) && jpy > 0) {
      setTwdInput(Math.round(jpy * rates.jpySell).toLocaleString());
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>即時匯率換算</Text>
        <TouchableOpacity onPress={load} style={styles.refreshBtn} disabled={loading}>
          <Icon name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Source info */}
        <View style={styles.sourceRow}>
          <Icon name="bank" size={14} color={colors.textSecondary} />
          <Text style={styles.sourceText}>
            {'  '}資料來源：國泰世華銀行｜即期匯率 銀行賣出
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>取得即時匯率中...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Icon name="wifi-off" size={48} color={colors.border} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, {backgroundColor: colors.primary}]} onPress={load}>
              <Text style={styles.retryBtnText}>重試</Text>
            </TouchableOpacity>
          </View>
        ) : rates ? (
          <>
            {/* Rate Cards */}
            <View style={styles.rateCards}>
              <View style={[styles.rateCard, {borderLeftColor: '#0052B4'}]}>
                <View style={styles.rateCardTop}>
                  <Text style={styles.flag}>🇺🇸</Text>
                  <View>
                    <Text style={styles.rateCurrencyCode}>USD</Text>
                    <Text style={styles.rateCurrencyName}>美元</Text>
                  </View>
                  <Text style={styles.rateBadge}>即期賣出</Text>
                </View>
                <Text style={[styles.rateValue, {color: colors.primary}]}>
                  NT$ <Text style={styles.rateNum}>{rates.usdSell.toFixed(3)}</Text>
                </Text>
              </View>

              <View style={[styles.rateCard, {borderLeftColor: '#BC002D'}]}>
                <View style={styles.rateCardTop}>
                  <Text style={styles.flag}>🇯🇵</Text>
                  <View>
                    <Text style={styles.rateCurrencyCode}>JPY</Text>
                    <Text style={styles.rateCurrencyName}>日圓</Text>
                  </View>
                  <Text style={styles.rateBadge}>即期賣出</Text>
                </View>
                <Text style={[styles.rateValue, {color: colors.primary}]}>
                  NT$ <Text style={styles.rateNum}>{rates.jpySell.toFixed(4)}</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.updatedText}>更新時間：{rates.updatedAt}</Text>

            {/* Converter */}
            <View style={styles.converterSection}>
              <Text style={styles.converterTitle}>換算工具</Text>
              <Text style={styles.converterHint}>輸入任一欄位，其他自動換算</Text>

              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <Text style={styles.inputFlag}>🇹🇼</Text>
                  <Text style={styles.inputLabel}>TWD 台幣</Text>
                  <TextInput
                    style={styles.input}
                    value={twdInput}
                    onChangeText={handleTwdChange}
                    onFocus={clearAll}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.inputRow}>
                  <Text style={styles.inputFlag}>🇺🇸</Text>
                  <View style={styles.inputLabelWrap}>
                    <Text style={styles.inputLabel}>USD 美元</Text>
                    <Text style={styles.rateHint}>1 USD = NT${rates.usdSell.toFixed(2)}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={usdInput}
                    onChangeText={handleUsdChange}
                    onFocus={clearAll}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.inputRow}>
                  <Text style={styles.inputFlag}>🇯🇵</Text>
                  <View style={styles.inputLabelWrap}>
                    <Text style={styles.inputLabel}>JPY 日圓</Text>
                    <Text style={styles.rateHint}>1 JPY = NT${rates.jpySell.toFixed(4)}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={jpyInput}
                    onChangeText={handleJpyChange}
                    onFocus={() => {
                      clearAll();
                      setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>
            </View>
          </>
        ) : null}

        <View style={{height: 300}} />
      </ScrollView>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.background},
    header: {
      backgroundColor: c.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    backBtn: {padding: 8},
    headerTitle: {flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff'},
    refreshBtn: {padding: 8},
    scroll: {flex: 1},
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    sourceText: {fontSize: 11, color: c.textSecondary},
    loadingWrap: {alignItems: 'center', paddingTop: 80, gap: 12},
    loadingText: {fontSize: 14, color: c.textSecondary},
    errorWrap: {alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 32},
    errorText: {fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 22},
    retryBtn: {paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, marginTop: 8},
    retryBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
    rateCards: {marginHorizontal: 16, marginTop: 8, gap: 10},
    rateCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 16,
      borderLeftWidth: 4,
      elevation: 2,
      shadowColor: c.shadow,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 1,
      shadowRadius: 4,
    },
    rateCardTop: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10},
    flag: {fontSize: 28},
    rateCurrencyCode: {fontSize: 18, fontWeight: '800', color: c.textPrimary},
    rateCurrencyName: {fontSize: 12, color: c.textSecondary},
    rateBadge: {
      marginLeft: 'auto',
      fontSize: 10,
      fontWeight: '700',
      color: c.primary,
      backgroundColor: c.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    rateValue: {fontSize: 14, fontWeight: '500'},
    rateNum: {fontSize: 28, fontWeight: '800'},
    updatedText: {
      fontSize: 11,
      color: c.textLight,
      textAlign: 'right',
      marginHorizontal: 16,
      marginTop: 6,
    },
    converterSection: {marginHorizontal: 16, marginTop: 20},
    converterTitle: {fontSize: 16, fontWeight: '700', color: c.textPrimary, marginBottom: 2},
    converterHint: {fontSize: 11, color: c.textSecondary, marginBottom: 12},
    inputCard: {
      backgroundColor: c.card,
      borderRadius: 16,
      elevation: 2,
      shadowColor: c.shadow,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 1,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    inputRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10},
    inputFlag: {fontSize: 22},
    inputLabelWrap: {flex: 1},
    inputLabel: {fontSize: 14, fontWeight: '600', color: c.textPrimary},
    rateHint: {fontSize: 10, color: c.textSecondary, marginTop: 1},
    input: {
      fontSize: 20,
      fontWeight: '700',
      color: c.primary,
      textAlign: 'right',
      minWidth: 100,
      padding: 0,
    },
    dividerLine: {height: 1, backgroundColor: c.border, marginLeft: 58},
  });
}
