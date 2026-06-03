import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors} from '../constants/colors';
import {getSettings, saveSettings} from '../storage/database';
import {
  fetchLatestRelease,
  hasNewVersion,
  downloadAndInstallApk,
  CURRENT_VERSION,
} from '../utils/updater';

interface AmountRowProps {
  icon: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  color?: string;
}

function AmountRow({icon, label, hint, value, onChange, color}: AmountRowProps) {
  return (
    <View style={rowStyles.wrap}>
      <View style={[rowStyles.iconWrap, {backgroundColor: (color ?? Colors.primary) + '18'}]}>
        <Icon name={icon} size={18} color={color ?? Colors.primary} />
      </View>
      <View style={rowStyles.labelWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.hint}>{hint}</Text>
      </View>
      <View style={rowStyles.inputWrap}>
        <Text style={[rowStyles.currency, {color: color ?? Colors.primary}]}>NT$</Text>
        <TextInput
          style={[rowStyles.input, {color: color ?? Colors.primary}]}
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={Colors.textLight}
          keyboardType="numeric"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {flex: 1},
  label: {fontSize: 14, fontWeight: '600', color: Colors.textPrimary},
  hint: {fontSize: 11, color: Colors.textSecondary, marginTop: 2},
  inputWrap: {flexDirection: 'row', alignItems: 'center', gap: 2},
  currency: {fontSize: 13, fontWeight: '700'},
  input: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'right',
    padding: 0,
  },
});

type UpdateStatus = 'idle' | 'checking' | 'latest' | 'available' | 'downloading';

export default function SettingsScreen() {
  const [userName, setUserName] = useState('');
  const [baseSavings, setBaseSavings] = useState('');
  const [fixedExpense, setFixedExpense] = useState('');
  const [estimatedIncome, setEstimatedIncome] = useState('');
  const [saved, setSaved] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [latestTag, setLatestTag] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      getSettings().then(s => {
        setUserName(s.user_name);
        setBaseSavings(String(s.base_savings || 0));
        setFixedExpense(String(s.fixed_expense || 0));
        setEstimatedIncome(String(s.estimated_income || 0));
      });
    }, []),
  );

  const handleSave = async () => {
    await saveSettings({
      user_name: userName,
      base_savings: parseFloat(baseSavings) || 0,
      fixed_expense: parseFloat(fixedExpense) || 0,
      estimated_income: parseFloat(estimatedIncome) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    Alert.alert(
      '清除所有資料',
      '確定要清除所有交易記錄嗎？此操作無法復原。',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '確認清除',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@book_transactions');
            Alert.alert('完成', '所有記錄已清除');
          },
        },
      ],
    );
  };

  const handleCheckUpdate = async () => {
    setUpdateStatus('checking');
    try {
      const release = await fetchLatestRelease();
      setLatestTag(release.tag_name);
      if (hasNewVersion(release.tag_name)) {
        const apkAsset = release.assets.find(a => a.name.endsWith('.apk'));
        if (apkAsset) {
          setDownloadUrl(apkAsset.browser_download_url);
          setUpdateStatus('available');
        } else {
          Alert.alert('找不到 APK', '此 Release 沒有附上 APK 檔案');
          setUpdateStatus('idle');
        }
      } else {
        setUpdateStatus('latest');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch (e: any) {
      Alert.alert('檢查失敗', e?.message ?? '無法連線到 GitHub，請確認網路或 repo 設定');
      setUpdateStatus('idle');
    }
  };

  const handleDownload = async () => {
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    try {
      await downloadAndInstallApk(downloadUrl, pct => setDownloadProgress(pct));
    } catch (e: any) {
      Alert.alert('下載失敗', e?.message ?? '請再試一次');
      setUpdateStatus('available');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerBg}>
        <Icon name="cog" size={40} color="rgba(255,255,255,0.3)" />
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>個人資料</Text>
        <View style={styles.nameRow}>
          <Icon name="account-outline" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.nameInput}
            value={userName}
            onChangeText={setUserName}
            placeholder="輸入姓名（顯示於首頁問候）"
            placeholderTextColor={Colors.textLight}
            maxLength={10}
          />
        </View>
      </View>

      {/* Monthly Fixed Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>每月固定金額</Text>
        <Text style={styles.sectionHint}>設定後顯示於首頁統計卡，不影響實際交易記錄</Text>
        <AmountRow
          icon="cash-minus"
          label="定期支出"
          hint="每月固定支出（房租、電話費等）"
          value={fixedExpense}
          onChange={setFixedExpense}
          color={Colors.expense}
        />
        <AmountRow
          icon="cash-plus"
          label="預估收入"
          hint="每月預期薪資或固定收入"
          value={estimatedIncome}
          onChange={setEstimatedIncome}
          color={Colors.income}
        />
      </View>

      {/* Savings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>存款設定</Text>
        <AmountRow
          icon="piggy-bank-outline"
          label="存款基準"
          hint="計算「當前存款」的初始金額"
          value={baseSavings}
          onChange={setBaseSavings}
          color={Colors.primary}
        />
      </View>

      {/* Formula */}
      <View style={styles.formulaCard}>
        <Icon name="information-outline" size={16} color={Colors.primary} />
        <View style={styles.formulaContent}>
          <Text style={styles.formulaTitle}>存款計算公式</Text>
          <Text style={styles.formulaText}>
            當前存款 = 存款基準 + 實際收入 − 實際支出 − 刷卡
          </Text>
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.savedBtn]}
        onPress={handleSave}
        activeOpacity={0.8}>
        <Icon name={saved ? 'check' : 'content-save'} size={18} color="#fff" />
        <Text style={styles.saveBtnText}>{saved ? '已儲存！' : '儲存設定'}</Text>
      </TouchableOpacity>

      {/* APP Update */}
      <View style={styles.section}>
        <View style={styles.updateHeader}>
          <View>
            <Text style={styles.sectionTitle}>APP 更新</Text>
            <Text style={styles.sectionHint}>目前版本 v{CURRENT_VERSION}</Text>
          </View>
          {latestTag && updateStatus !== 'idle' && (
            <View style={[
              styles.versionBadge,
              {backgroundColor: updateStatus === 'available' ? Colors.expense + '18' : Colors.income + '18'},
            ]}>
              <Text style={[
                styles.versionBadgeText,
                {color: updateStatus === 'available' ? Colors.expense : Colors.income},
              ]}>
                {updateStatus === 'available' ? `v${latestTag} 可更新` : '已是最新'}
              </Text>
            </View>
          )}
        </View>

        {updateStatus === 'downloading' ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {width: `${Math.round(downloadProgress * 100)}%`}]} />
            </View>
            <Text style={styles.progressText}>下載中 {Math.round(downloadProgress * 100)}%</Text>
          </View>
        ) : updateStatus === 'available' ? (
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.85}>
            <Icon name="download" size={18} color="#fff" />
            <Text style={styles.downloadBtnText}>下載並安裝 v{latestTag}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.checkBtn}
            onPress={handleCheckUpdate}
            disabled={updateStatus === 'checking'}
            activeOpacity={0.8}>
            <Icon
              name={updateStatus === 'checking' ? 'loading' : updateStatus === 'latest' ? 'check-circle' : 'cloud-download-outline'}
              size={18}
              color={updateStatus === 'latest' ? Colors.income : Colors.primary}
            />
            <Text style={[styles.checkBtnText, updateStatus === 'latest' && {color: Colors.income}]}>
              {updateStatus === 'checking' ? '檢查中...' : updateStatus === 'latest' ? '已是最新版本' : '檢查更新'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>危險區域</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData} activeOpacity={0.8}>
          <Icon name="delete-outline" size={18} color={Colors.expense} />
          <Text style={styles.dangerBtnText}>清除所有交易記錄</Text>
        </TouchableOpacity>
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: Colors.background},
  content: {paddingBottom: 20},
  headerBg: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {fontSize: 24, fontWeight: '800', color: '#fff'},
  section: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  sectionTitle: {fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2},
  sectionHint: {fontSize: 11, color: Colors.textSecondary, marginBottom: 4},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    gap: 8,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 2,
  },
  formulaCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  formulaContent: {flex: 1},
  formulaTitle: {fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 4},
  formulaText: {fontSize: 12, color: Colors.primary, lineHeight: 18},
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  savedBtn: {backgroundColor: Colors.income},
  saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  dangerSection: {marginHorizontal: 16, marginTop: 24},
  dangerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.expense + '10',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.expense + '30',
  },
  dangerBtnText: {fontSize: 15, color: Colors.expense, fontWeight: '600'},
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  versionBadgeText: {fontSize: 12, fontWeight: '700'},
  progressWrap: {gap: 6},
  progressBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
    minWidth: 4,
  },
  progressText: {fontSize: 12, color: Colors.textSecondary, textAlign: 'center'},
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.expense,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  downloadBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
  checkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  checkBtnText: {fontSize: 15, fontWeight: '700', color: Colors.primary},
});
