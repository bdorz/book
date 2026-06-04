import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Switch} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useColors, useTheme, AppColors} from '../context/ThemeContext';
import {FixedItem} from '../types';
import {getSettings, saveSettings} from '../storage/database';
import {fetchLatestRelease, hasNewVersion, downloadAndInstallApk, CURRENT_VERSION} from '../utils/updater';
import {getNotificationSettings, saveNotificationSettings, scheduleReminders, cancelAllReminders, requestNotificationPermission, NotificationSettings} from '../utils/notifications';

type UpdateStatus = 'idle' | 'checking' | 'latest' | 'available' | 'downloading';

const INTERVALS = [
  {value: 1, label: '每天'},
  {value: 2, label: '每2天'},
  {value: 3, label: '每3天'},
  {value: 7, label: '每週'},
];
const MINUTES = [0, 15, 30, 45];

interface FixedItemsListProps {
  title: string;
  icon: string;
  color: string;
  items: FixedItem[];
  onAdd: (name: string, amount: number) => void;
  onDelete: (id: string) => void;
}

function FixedItemsList({title, icon, color, items, onAdd, onDelete}: FixedItemsListProps) {
  const colors = useColors();
  const ls = useMemo(() => createListStyles(colors), [colors]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const total = items.reduce((s, i) => s + i.amount, 0);

  const handleAdd = () => {
    const amt = parseFloat(newAmount);
    if (!newName.trim()) {Alert.alert('請輸入項目名稱'); return;}
    if (!newAmount || isNaN(amt) || amt <= 0) {Alert.alert('請輸入有效金額'); return;}
    onAdd(newName.trim(), amt);
    setNewName(''); setNewAmount(''); setAdding(false);
  };

  return (
    <View style={ls.wrap}>
      <View style={ls.header}>
        <View style={[ls.iconWrap, {backgroundColor: color + '18'}]}>
          <Icon name={icon} size={16} color={color} />
        </View>
        <Text style={ls.title}>{title}</Text>
        <Text style={[ls.total, {color}]}>NT${total.toLocaleString()}</Text>
      </View>
      {items.map(item => (
        <View key={item.id} style={ls.item}>
          <Text style={ls.itemName}>{item.name}</Text>
          <Text style={[ls.itemAmount, {color}]}>NT${item.amount.toLocaleString()}</Text>
          <TouchableOpacity onPress={() => onDelete(item.id)} style={ls.deleteBtn}>
            <Icon name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      ))}
      {adding ? (
        <View style={ls.addForm}>
          <TextInput style={ls.nameInput} value={newName} onChangeText={setNewName} placeholder="項目名稱（如：房租）" placeholderTextColor={colors.textLight} autoFocus />
          <View style={ls.amountRow}>
            <Text style={[ls.currency, {color}]}>NT$</Text>
            <TextInput style={[ls.amountInput, {color}]} value={newAmount} onChangeText={setNewAmount} placeholder="0" placeholderTextColor={colors.textLight} keyboardType="numeric" returnKeyType="done" />
          </View>
          <View style={ls.formBtns}>
            <TouchableOpacity style={[ls.confirmBtn, {backgroundColor: color}]} onPress={handleAdd}>
              <Text style={ls.confirmText}>確認</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ls.cancelBtn} onPress={() => {setAdding(false); setNewName(''); setNewAmount('');}}>
              <Text style={ls.cancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[ls.addBtn, {borderColor: color + '40'}]} onPress={() => setAdding(true)}>
          <Icon name="plus" size={14} color={color} />
          <Text style={[ls.addBtnText, {color}]}>新增項目</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createListStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {marginTop: 12},
    header: {flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8},
    iconWrap: {width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
    title: {flex: 1, fontSize: 13, fontWeight: '700', color: c.textPrimary},
    total: {fontSize: 14, fontWeight: '800'},
    item: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: c.border},
    itemName: {flex: 1, fontSize: 14, color: c.textPrimary},
    itemAmount: {fontSize: 14, fontWeight: '600', marginRight: 8},
    deleteBtn: {padding: 2},
    addForm: {backgroundColor: c.background, borderRadius: 10, padding: 12, marginTop: 6, gap: 8},
    nameInput: {fontSize: 14, color: c.textPrimary, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 6},
    amountRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
    currency: {fontSize: 14, fontWeight: '700'},
    amountInput: {flex: 1, fontSize: 20, fontWeight: '700', padding: 0},
    formBtns: {flexDirection: 'row', gap: 8, marginTop: 4},
    confirmBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center'},
    confirmText: {color: '#fff', fontSize: 14, fontWeight: '700'},
    cancelBtn: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: c.border},
    cancelText: {color: c.textSecondary, fontSize: 14, fontWeight: '600'},
    addBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', marginTop: 6, gap: 4},
    addBtnText: {fontSize: 13, fontWeight: '600'},
  });
}

export default function SettingsScreen() {
  const colors = useColors();
  const {isDark, toggleTheme} = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [userName, setUserName] = useState('');
  const [baseSavings, setBaseSavings] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedItem[]>([]);
  const [estimatedIncomes, setEstimatedIncomes] = useState<FixedItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({enabled: false, hour: 21, minute: 0, intervalDays: 1});
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [latestTag, setLatestTag] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      getSettings().then(s => {
        setUserName(s.user_name);
        setBaseSavings(String(s.base_savings || 0));
        setFixedExpenses(s.fixed_expenses ?? []);
        setEstimatedIncomes(s.estimated_incomes ?? []);
      });
      getNotificationSettings().then(setNotifSettings);
    }, []),
  );

  const handleNotifToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {Alert.alert('無法開啟通知', '請到手機設定中允許此 APP 發送通知'); return;}
    }
    const updated = {...notifSettings, enabled};
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
    if (enabled) {await scheduleReminders(updated);} else {await cancelAllReminders();}
  };

  const handleNotifChange = async (changes: Partial<NotificationSettings>) => {
    const updated = {...notifSettings, ...changes};
    setNotifSettings(updated);
    await saveNotificationSettings(updated);
    if (updated.enabled) {await scheduleReminders(updated);}
  };

  const handleSave = async () => {
    await saveSettings({user_name: userName, base_savings: parseFloat(baseSavings) || 0, fixed_expenses: fixedExpenses, estimated_incomes: estimatedIncomes});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const autoSave = (fe: FixedItem[], ei: FixedItem[]) => {
    saveSettings({user_name: userName, base_savings: parseFloat(baseSavings) || 0, fixed_expenses: fe, estimated_incomes: ei});
  };

  const addFixedExpense = (name: string, amount: number) => { const u = [...fixedExpenses, {id: `${Date.now()}`, name, amount}]; setFixedExpenses(u); autoSave(u, estimatedIncomes); };
  const deleteFixedExpense = (id: string) => { const u = fixedExpenses.filter(i => i.id !== id); setFixedExpenses(u); autoSave(u, estimatedIncomes); };
  const addEstimatedIncome = (name: string, amount: number) => { const u = [...estimatedIncomes, {id: `${Date.now()}`, name, amount}]; setEstimatedIncomes(u); autoSave(fixedExpenses, u); };
  const deleteEstimatedIncome = (id: string) => { const u = estimatedIncomes.filter(i => i.id !== id); setEstimatedIncomes(u); autoSave(fixedExpenses, u); };

  const handleClearData = () => {
    Alert.alert('清除所有資料', '確定要清除所有交易記錄嗎？此操作無法復原。', [
      {text: '取消', style: 'cancel'},
      {text: '確認清除', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem('@book_transactions'); Alert.alert('完成', '所有記錄已清除'); }},
    ]);
  };

  const handleCheckUpdate = async () => {
    setUpdateStatus('checking');
    try {
      const release = await fetchLatestRelease();
      setLatestTag(release.tag_name);
      if (hasNewVersion(release.tag_name)) {
        const apkAsset = release.assets.find(a => a.name.endsWith('.apk'));
        if (apkAsset) { setDownloadUrl(apkAsset.browser_download_url); setUpdateStatus('available'); }
        else { Alert.alert('找不到 APK', '此 Release 沒有附上 APK 檔案'); setUpdateStatus('idle'); }
      } else { setUpdateStatus('latest'); setTimeout(() => setUpdateStatus('idle'), 3000); }
    } catch (e: any) { Alert.alert('檢查失敗', e?.message ?? '無法連線到 GitHub'); setUpdateStatus('idle'); }
  };

  const handleDownload = async () => {
    setUpdateStatus('downloading'); setDownloadProgress(0);
    try { await downloadAndInstallApk(downloadUrl, pct => setDownloadProgress(pct)); }
    catch (e: any) { Alert.alert('下載失敗', e?.message ?? '請再試一次'); setUpdateStatus('available'); }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerBg}>
        <Icon name="cog" size={40} color="rgba(255,255,255,0.3)" />
        <Text style={styles.headerTitle}>設定</Text>
      </View>

      {/* 外觀 */}
      <View style={styles.section}>
        <View style={styles.appearanceRow}>
          <View style={styles.appearanceLeft}>
            <Icon name={isDark ? 'weather-night' : 'weather-sunny'} size={22} color={colors.primary} />
            <View>
              <Text style={styles.sectionTitle}>外觀模式</Text>
              <Text style={styles.sectionHint}>{isDark ? '深色模式' : '淺色模式'}</Text>
            </View>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{false: colors.border, true: colors.primary + '80'}} thumbColor={isDark ? colors.primary : '#f0f0f0'} />
        </View>
      </View>

      {/* 個人資料 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>個人資料</Text>
        <View style={styles.nameRow}>
          <Icon name="account-outline" size={20} color={colors.textSecondary} />
          <TextInput style={styles.nameInput} value={userName} onChangeText={setUserName} placeholder="輸入姓名（顯示於首頁問候）" placeholderTextColor={colors.textLight} maxLength={10} />
        </View>
      </View>

      {/* 每月固定金額 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>每月固定金額</Text>
        <Text style={styles.sectionHint}>設定後顯示於首頁統計卡總額</Text>
        <FixedItemsList title="定期支出" icon="cash-minus" color={colors.expense} items={fixedExpenses} onAdd={addFixedExpense} onDelete={deleteFixedExpense} />
        <View style={styles.divider} />
        <FixedItemsList title="預估收入" icon="cash-plus" color={colors.income} items={estimatedIncomes} onAdd={addEstimatedIncome} onDelete={deleteEstimatedIncome} />
      </View>

      {/* 存款基準 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>存款基準</Text>
        <Text style={styles.sectionHint}>計算「當前存款」的初始金額</Text>
        <View style={styles.savingsRow}>
          <Text style={styles.currency}>NT$</Text>
          <TextInput style={styles.savingsInput} value={baseSavings} onChangeText={setBaseSavings} placeholder="0" placeholderTextColor={colors.textLight} keyboardType="numeric" returnKeyType="done" />
        </View>
      </View>

      {/* 公式 */}
      <View style={styles.formulaCard}>
        <Icon name="information-outline" size={16} color={colors.primary} />
        <View style={styles.formulaContent}>
          <Text style={styles.formulaTitle}>存款計算公式</Text>
          <Text style={styles.formulaText}>當前存款 = 存款基準 + 累積收入 − 累積支出 − 累積刷卡</Text>
        </View>
      </View>

      {/* 通知 */}
      <View style={styles.section}>
        <View style={styles.notifHeader}>
          <View>
            <Text style={styles.sectionTitle}>記帳提醒通知</Text>
            <Text style={styles.sectionHint}>提醒你每天記帳</Text>
          </View>
          <Switch value={notifSettings.enabled} onValueChange={handleNotifToggle} trackColor={{false: colors.border, true: colors.primary + '80'}} thumbColor={notifSettings.enabled ? colors.primary : '#f0f0f0'} />
        </View>
        {notifSettings.enabled && (
          <View style={styles.notifBody}>
            <Text style={styles.notifLabel}>提醒時間</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity style={styles.timeBtn} onPress={() => handleNotifChange({hour: (notifSettings.hour + 23) % 24})}>
                <Icon name="chevron-left" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.timeDisplay}>{String(notifSettings.hour).padStart(2, '0')}:{String(notifSettings.minute).padStart(2, '0')}</Text>
              <TouchableOpacity style={styles.timeBtn} onPress={() => handleNotifChange({hour: (notifSettings.hour + 1) % 24})}>
                <Icon name="chevron-right" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={styles.minuteGap} />
              {MINUTES.map(m => (
                <TouchableOpacity key={m} style={[styles.minuteChip, notifSettings.minute === m && {backgroundColor: colors.primary, borderColor: colors.primary}]} onPress={() => handleNotifChange({minute: m})}>
                  <Text style={[styles.minuteChipText, notifSettings.minute === m && {color: '#fff'}]}>:{String(m).padStart(2, '0')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.notifLabel, {marginTop: 12}]}>提醒間隔</Text>
            <View style={styles.intervalRow}>
              {INTERVALS.map(iv => (
                <TouchableOpacity key={iv.value} style={[styles.intervalChip, notifSettings.intervalDays === iv.value && {backgroundColor: colors.primary, borderColor: colors.primary}]} onPress={() => handleNotifChange({intervalDays: iv.value})}>
                  <Text style={[styles.intervalChipText, notifSettings.intervalDays === iv.value && {color: '#fff'}]}>{iv.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 儲存 */}
      <TouchableOpacity style={[styles.saveBtn, saved && {backgroundColor: colors.income}]} onPress={handleSave} activeOpacity={0.8}>
        <Icon name={saved ? 'check' : 'content-save'} size={18} color="#fff" />
        <Text style={styles.saveBtnText}>{saved ? '已儲存！' : '儲存設定'}</Text>
      </TouchableOpacity>

      {/* 更新 */}
      <View style={styles.section}>
        <View style={styles.updateHeader}>
          <View>
            <Text style={styles.sectionTitle}>APP 更新</Text>
            <Text style={styles.sectionHint}>目前版本 v{CURRENT_VERSION}</Text>
          </View>
          {latestTag !== '' && updateStatus !== 'idle' && (
            <View style={[styles.versionBadge, {backgroundColor: updateStatus === 'available' ? colors.expense + '18' : colors.income + '18'}]}>
              <Text style={[styles.versionBadgeText, {color: updateStatus === 'available' ? colors.expense : colors.income}]}>
                {updateStatus === 'available' ? `v${latestTag} 可更新` : '已是最新'}
              </Text>
            </View>
          )}
        </View>
        {updateStatus === 'downloading' ? (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {width: `${Math.round(downloadProgress * 100)}%`, backgroundColor: colors.primary}]} />
            </View>
            <Text style={styles.progressText}>下載中 {Math.round(downloadProgress * 100)}%</Text>
          </View>
        ) : updateStatus === 'available' ? (
          <TouchableOpacity style={[styles.downloadBtn, {backgroundColor: colors.expense}]} onPress={handleDownload} activeOpacity={0.85}>
            <Icon name="download" size={18} color="#fff" />
            <Text style={styles.downloadBtnText}>下載並安裝 v{latestTag}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.checkBtn, {backgroundColor: colors.primary + '10', borderColor: colors.primary + '30'}]} onPress={handleCheckUpdate} disabled={updateStatus === 'checking'} activeOpacity={0.8}>
            <Icon name={updateStatus === 'latest' ? 'check-circle' : 'cloud-download-outline'} size={18} color={updateStatus === 'latest' ? colors.income : colors.primary} />
            <Text style={[styles.checkBtnText, {color: updateStatus === 'latest' ? colors.income : colors.primary}]}>
              {updateStatus === 'checking' ? '檢查中...' : updateStatus === 'latest' ? '已是最新版本' : '檢查更新'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 危險區域 */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>危險區域</Text>
        <TouchableOpacity style={[styles.dangerBtn, {backgroundColor: colors.expense + '10', borderColor: colors.expense + '30'}]} onPress={handleClearData} activeOpacity={0.8}>
          <Icon name="delete-outline" size={18} color={colors.expense} />
          <Text style={[styles.dangerBtnText, {color: colors.expense}]}>清除所有交易記錄</Text>
        </TouchableOpacity>
      </View>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.background},
    content: {paddingBottom: 20},
    headerBg: {backgroundColor: c.primary, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24},
    headerTitle: {fontSize: 24, fontWeight: '800', color: '#fff'},
    section: {backgroundColor: c.card, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, elevation: 2, shadowColor: c.shadow, shadowOffset: {width: 0, height: 1}, shadowOpacity: 1, shadowRadius: 4},
    sectionTitle: {fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 2},
    sectionHint: {fontSize: 11, color: c.textSecondary, marginBottom: 4},
    appearanceRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    appearanceLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
    divider: {height: 1, backgroundColor: c.border, marginVertical: 16},
    nameRow: {flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 10, gap: 8},
    nameInput: {flex: 1, fontSize: 16, color: c.textPrimary, paddingVertical: 2},
    savingsRow: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8},
    currency: {fontSize: 16, fontWeight: '700', color: c.primary},
    savingsInput: {flex: 1, fontSize: 24, fontWeight: '700', color: c.primary, padding: 0},
    formulaCard: {flexDirection: 'row', backgroundColor: c.primary + '15', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, gap: 10, alignItems: 'flex-start'},
    formulaContent: {flex: 1},
    formulaTitle: {fontSize: 13, fontWeight: '700', color: c.primary, marginBottom: 4},
    formulaText: {fontSize: 12, color: c.primary, lineHeight: 18},
    notifHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
    notifBody: {marginTop: 16, gap: 4},
    notifLabel: {fontSize: 12, fontWeight: '700', color: c.textSecondary, marginBottom: 6},
    timeRow: {flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap'},
    timeBtn: {padding: 4},
    timeDisplay: {fontSize: 22, fontWeight: '800', color: c.primary, minWidth: 70, textAlign: 'center'},
    minuteGap: {width: 8},
    minuteChip: {paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: c.background, borderWidth: 1, borderColor: c.border},
    minuteChipText: {fontSize: 13, fontWeight: '600', color: c.textSecondary},
    intervalRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
    intervalChip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.background},
    intervalChipText: {fontSize: 13, fontWeight: '600', color: c.textSecondary},
    saveBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary, marginHorizontal: 16, marginTop: 20, paddingVertical: 16, borderRadius: 16, gap: 8},
    saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    updateHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
    versionBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
    versionBadgeText: {fontSize: 12, fontWeight: '700'},
    progressWrap: {gap: 6},
    progressBg: {height: 8, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden'},
    progressFill: {height: '100%', borderRadius: 4, minWidth: 4},
    progressText: {fontSize: 12, color: c.textSecondary, textAlign: 'center'},
    downloadBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8},
    downloadBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
    checkBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8, borderWidth: 1},
    checkBtnText: {fontSize: 15, fontWeight: '700'},
    dangerSection: {marginHorizontal: 16, marginTop: 24},
    dangerTitle: {fontSize: 13, fontWeight: '700', color: c.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1},
    dangerBtn: {flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1},
    dangerBtnText: {fontSize: 15, fontWeight: '600'},
  });
}
