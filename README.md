# 📒 記帳本 APP

個人手機記帳應用程式，資料儲存於手機本地，支援深色/淺色模式，可透過 GitHub Release 自動更新。

---

## 安裝使用（一般用戶）

### 第一次安裝

1. 前往 [Releases 頁面](https://github.com/bdorz/book/releases/latest)
2. 下載最新版本的 `app-release.apk`
3. 手機開啟「允許安裝不明來源應用程式」
4. 點擊 APK 安裝

### 更新 APP

APP 安裝完成後，往後的更新不需要再手動下載：

1. 開啟 APP → 前往「設定」分頁
2. 找到「APP 更新」區塊
3. 點擊「檢查更新」
4. 若有新版本，點擊「下載並安裝」即可自動完成

---

## 功能介紹

### 首頁 Dashboard

- **問候語**：依照時間顯示早安/午安/晚安，搭配使用者姓名
- **統計卡**：顯示本月定期支出、預估收入、刷卡金額、現金手存
- **當前存款**：自動累積計算跨月結餘（存款基準 + 收入 − 支出 − 刷卡）
- **每月總支出**：進度條顯示已用金額佔預估收入的比例
- **快捷新增**：一鍵新增支出或收入
- **支出分類圖**：甜甜圈圖表顯示支出與刷卡的分類佔比
- **本月明細**：最近 5 筆記錄快速預覽

### 明細分頁

- 所有交易記錄，依月份分組顯示
- 可篩選：全部 / 支出 / 收入 / 刷卡
- 本月結餘快速統計
- 右下角浮動按鈕快速新增

### 家人代買分頁

- 獨立追蹤代付（幫家人付錢）與代收（收到家人還款）
- 顯示本月代付、代收、淨餘額三欄統計
- 右下角浮動按鈕快速新增

### 月結報表分頁

- 自動產生每個月的結算報表（從 2026 年 1 月起）
- 每月顯示：月初餘額、現金支出、信用卡、收入、月底結餘
- 依年份展開/收合，顯示年度結餘統計
- 本月卡片即時顯示當月數據

### 新增 / 編輯記錄

支援五種記錄類型：

| 類型 | 說明 |
|------|------|
| 支出 | 現金或日常消費 |
| 收入 | 薪資、獎金等收入 |
| 刷卡 | 信用卡消費 |
| 代付 | 幫家人代墊 |
| 代收 | 收到家人還款 |

- 選擇分類、輸入金額、選擇日期、填寫備註
- 所有記錄均可編輯或刪除

### 設定分頁

| 設定項目 | 說明 |
|------|------|
| 外觀模式 | 切換深色/淺色，自動儲存 |
| 個人資料 | 設定姓名（顯示於首頁問候） |
| 定期支出 | 新增多個固定支出項目（如房租、電話費） |
| 預估收入 | 新增多個固定收入項目（如薪資） |
| 存款基準 | 計算當前存款的起始金額 |
| 記帳提醒 | 設定每日提醒時間與間隔天數 |
| APP 更新 | 一鍵檢查並下載最新版本 |
| 清除資料 | 清除全部交易記錄（無法復原） |

---

## 資料儲存說明

所有資料儲存於手機本地（Android AsyncStorage），不會上傳至任何伺服器。

- 解除安裝 APP 會清除所有資料
- 更新 APP（覆蓋安裝）不會影響資料

---

## 開發者：建置與發布

### 環境需求

- Node.js 18+
- Android Studio（含 JDK 21、Android SDK）
- Java 路徑：`C:\Program Files\Android\Android Studio\jbr`

### 每次發布新版本

```powershell
# 1. 設定環境變數
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH += ";$env:JAVA_HOME\bin"

# 2. 打包 APK
cd android
.\gradlew.bat assembleRelease

# 3. 發布到 GitHub（版本號依序遞增）
gh release create v1.0.X `
  "app\build\outputs\apk\release\app-release.apk" `
  --title "v1.0.X" `
  --notes "本次更新內容..."
```

> 每次發布前記得更新 `src/utils/updater.ts` 的 `CURRENT_VERSION`。

### 技術棧

- React Native 0.85.3 + TypeScript
- @react-navigation（Bottom Tabs + Native Stack）
- @react-native-async-storage（本地儲存）
- react-native-svg（甜甜圈圖表）
- react-native-vector-icons（MaterialCommunityIcons）
- @notifee/react-native（本地推播通知）
- react-native-blob-util（APK 下載更新）
- @react-native-community/datetimepicker（日期選擇）
