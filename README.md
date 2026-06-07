# 記帳本 APP

個人 Android 記帳應用程式，資料儲存於手機本地，支援深色/淺色模式、雲端備份，可透過 APP 內建功能自動更新。

目前版本：**v1.0.19**

---

## 安裝使用

### 第一次安裝

1. 前往 [Releases 頁面](https://github.com/bdorz/book/releases/latest)
2. 下載最新版本的 `BookApp-vX.X.X.apk`
3. 手機開啟「允許安裝不明來源應用程式」
4. 點擊 APK 安裝

### 更新 APP

安裝後，往後更新不需要手動下載：

1. 開啟 APP → 前往「設定」分頁
2. 找到「APP 更新」區塊，點擊「檢查更新」
3. 若有新版本，點擊「下載並安裝」即可自動完成

---

## 功能介紹

### 首頁

- 依時間顯示問候語（早安 / 午安 / 晚安），搭配使用者姓名
- 統計卡：本月定期支出、預估收入、刷卡金額、現金手存
- 當前存款：自動累積跨月結餘（存款基準 + 收入 − 支出 − 刷卡）
- 每月總支出進度條：已用金額佔預估收入的比例
- 快捷按鈕：一鍵新增支出或收入
- 甜甜圈圖表：支出與刷卡的分類佔比，**點擊色塊可展開該分類的所有明細**
- 本月明細：最近 5 筆記錄快速預覽

### 明細分頁

- 所有交易依月份、**日期**分組顯示
- 進入頁面時今天自動展開，其他日期預設收合
- 每日標頭顯示雙列欄位：
  - 上列：支出 ／ 收入 ／ 總額（標籤）
  - 下列：數值（支出紅色、收入綠色、總額依正負顯示）
- 點擊日期列可展開或收起當日細項
- 篩選：全部 / 支出 / 收入 / 刷卡
- 本月支出、收入、結餘快速統計

### 家人代買分頁

- 獨立追蹤代付（幫家人付錢）與代收（收到家人還款）
- 本月代付、代收、淨餘額三欄統計

### 月結報表分頁

- 自動產生每月結算報表
- 每月顯示：月初餘額、現金支出、信用卡、收入、月底結餘
- 依年份展開/收合，顯示年度結餘統計

### 新增 / 編輯記錄

支援五種記錄類型：

| 類型 | 說明 |
|------|------|
| 支出 | 現金或日常消費 |
| 收入 | 薪資、獎金等 |
| 刷卡 | 信用卡消費 |
| 代付 | 幫家人代墊 |
| 代收 | 收到家人還款 |

- 選擇分類、輸入金額、選擇日期、填寫備註
- 所有記錄均可編輯或刪除

### 設定分頁

| 設定項目 | 說明 |
|------|------|
| 外觀模式 | 切換深色 / 淺色，自動儲存 |
| 即時匯率換算 | 美元、日圓即期賣出匯率（國泰世華），支援三欄互換 |
| 個人資料 | 設定姓名（顯示於首頁問候） |
| 定期支出 | 新增多個固定支出項目（如房租、電話費） |
| 預估收入 | 新增多個固定收入項目（如薪資） |
| 存款基準 | 計算當前存款的起始金額 |
| 記帳提醒 | 設定每日提醒時間與間隔天數 |
| 雲端備份 | 備份至 GitHub Gist，支援還原（需 Personal Access Token） |
| APP 更新 | 一鍵檢查並下載最新版本 |
| 清除資料 | 清除全部交易記錄（無法復原） |

---

## 資料儲存

所有資料預設儲存於手機本地（AsyncStorage），不會上傳至任何伺服器。

- 解除安裝 APP 會清除本機資料
- 覆蓋安裝（更新）不影響既有資料

### 雲端備份（選用）

設定頁可設定 GitHub Personal Access Token (PAT) 進行備份：

1. 前往 [github.com](https://github.com) → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 建立新 Token，只需勾選 **`gist`** 權限
3. 將 Token 貼入 APP 設定頁的「雲端備份」欄位
4. 點擊「立即備份」，資料會備份至你帳號的私人 Gist
5. 換機或重裝時，輸入相同 PAT 後點「從雲端還原」即可

---

## 開發者：建置與發布

### 環境需求

- Node.js 18+
- Android Studio（含 JDK 21、Android SDK）
- Java 路徑：`C:\Program Files\Android\Android Studio\jbr`

### 每次發布新版本

```powershell
# 1. 更新版本號
# 修改 src/utils/updater.ts 的 CURRENT_VERSION

# 2. 設定環境變數並打包
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew assembleRelease

# 3. 發布到 GitHub
gh release create v1.0.X `
  "app\build\outputs\apk\release\app-release.apk#BookApp-v1.0.X.apk" `
  --title "v1.0.X - 更新說明" `
  --notes "本次更新內容..."
```

> **注意**：使用 `assembleRelease`（非 `assembleDebug`）才能確保 APK 大小正常（約 74MB）。

### 技術棧

| 套件 | 用途 |
|------|------|
| React Native 0.85.3 + TypeScript | 主框架 |
| @react-navigation | Bottom Tabs + Native Stack 導覽 |
| @react-native-async-storage | 本地資料儲存 |
| react-native-svg | 甜甜圈圖表 |
| react-native-vector-icons | MaterialCommunityIcons 圖示 |
| @notifee/react-native | 本地推播通知（記帳提醒） |
| react-native-blob-util | APK 下載 / 自動更新 |
| @react-native-community/datetimepicker | 日期選擇器 |
