import AsyncStorage from '@react-native-async-storage/async-storage';
import {getAllTransactions, getSettings, saveSettings} from '../storage/database';

const PAT_KEY = '@book_gist_pat';
const GIST_ID_KEY = '@book_gist_id';
const LAST_BACKUP_KEY = '@book_gist_last_backup';
const GIST_FILENAME = 'bookapp_backup.json';

export async function getStoredPat(): Promise<string> {
  return (await AsyncStorage.getItem(PAT_KEY)) ?? '';
}

export async function saveGistPat(pat: string): Promise<void> {
  await AsyncStorage.setItem(PAT_KEY, pat.trim());
}

export async function getLastBackupTime(): Promise<string> {
  return (await AsyncStorage.getItem(LAST_BACKUP_KEY)) ?? '';
}

export async function backupToGist(pat: string): Promise<void> {
  if (!pat.trim()) {throw new Error('請先設定 GitHub PAT');}

  const [transactions, settings] = await Promise.all([getAllTransactions(), getSettings()]);
  const content = JSON.stringify({version: 1, backupAt: new Date().toISOString(), transactions, settings});

  const storedId = await AsyncStorage.getItem(GIST_ID_KEY);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${pat.trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    description: 'BookApp 記帳備份',
    public: false,
    files: {[GIST_FILENAME]: {content}},
  });

  let resp = storedId
    ? await fetch(`https://api.github.com/gists/${storedId}`, {method: 'PATCH', headers, body})
    : null;

  if (!resp || resp.status === 404) {
    resp = await fetch('https://api.github.com/gists', {method: 'POST', headers, body});
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as any;
    throw new Error(err.message ?? `GitHub 回應 ${resp.status}`);
  }

  const data = await resp.json();
  await AsyncStorage.setItem(GIST_ID_KEY, data.id);
  await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toLocaleString('zh-TW'));
}

export async function restoreFromGist(pat: string): Promise<void> {
  if (!pat.trim()) {throw new Error('請先設定 GitHub PAT');}

  const storedId = await AsyncStorage.getItem(GIST_ID_KEY);
  if (!storedId) {throw new Error('找不到備份記錄，請確認是否已在此裝置備份過');}

  const resp = await fetch(`https://api.github.com/gists/${storedId}`, {
    headers: {Authorization: `Bearer ${pat.trim()}`, Accept: 'application/vnd.github+json'},
  });
  if (!resp.ok) {throw new Error(`無法取得備份 (HTTP ${resp.status})`);}

  const gist = await resp.json();
  const file = (gist as any).files[GIST_FILENAME];
  if (!file) {throw new Error('備份檔案不存在');}

  const {transactions, settings} = JSON.parse(file.content);
  await AsyncStorage.setItem('@book_transactions', JSON.stringify(transactions));
  if (settings) {await saveSettings(settings);}
}

export async function autoBackup(): Promise<void> {
  try {
    const pat = await getStoredPat();
    if (pat) {await backupToGist(pat);}
  } catch {
    // Silent — auto backup must not interrupt user flow
  }
}
