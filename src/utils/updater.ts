import ReactNativeBlobUtil from 'react-native-blob-util';
import {Alert, Platform} from 'react-native';

// 設定你的 GitHub 帳號和 repo 名稱
export const GITHUB_OWNER = 'bdorz';
export const GITHUB_REPO = 'book';

export const CURRENT_VERSION = '1.0.0';

interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: {
    name: string;
    browser_download_url: string;
    size: number;
  }[];
}

function versionToNumber(v: string): number {
  const parts = v.replace(/^v/, '').split('.').map(Number);
  return parts[0] * 10000 + (parts[1] ?? 0) * 100 + (parts[2] ?? 0);
}

export async function fetchLatestRelease(): Promise<GithubRelease> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
  const resp = await fetch(url, {
    headers: {Accept: 'application/vnd.github+json'},
  });
  if (!resp.ok) {throw new Error(`GitHub API 錯誤: ${resp.status}`);}
  return resp.json();
}

export function hasNewVersion(latestTag: string): boolean {
  return versionToNumber(latestTag) > versionToNumber(CURRENT_VERSION);
}

export async function downloadAndInstallApk(
  url: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  if (Platform.OS !== 'android') {
    Alert.alert('不支援', '目前只支援 Android 更新');
    return;
  }

  const fileName = `BookApp-update.apk`;
  const downloadDest = `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

  try {
    await ReactNativeBlobUtil.config({
      fileCache: true,
      path: downloadDest,
      addAndroidDownloads: {
        useDownloadManager: false,
        notification: false,
        path: downloadDest,
      },
    })
      .fetch('GET', url)
      .progress((received, total) => {
        onProgress(Number(received) / Number(total));
      });

    await ReactNativeBlobUtil.android.actionViewIntent(
      downloadDest,
      'application/vnd.android.package-archive',
    );
  } catch (e: any) {
    throw new Error(e?.message ?? '下載失敗');
  }
}
