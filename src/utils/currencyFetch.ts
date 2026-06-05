export interface RateData {
  usdSell: number;
  jpySell: number;
  updatedAt: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/json,*/*;q=0.8',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

// 嘗試抓 Cathay Bank JSON API
async function tryJsonApi(): Promise<RateData | null> {
  try {
    const r = await fetch(
      'https://www.cathaybk.com.tw/cathaybk/home/service/exchange-rate/exchange_rate_json/',
      {headers: HEADERS},
    );
    if (!r.ok) {return null;}
    const data = await r.json();

    const rows: any[] = Array.isArray(data) ? data : (data?.result ?? data?.data ?? []);
    let usdSell = 0;
    let jpySell = 0;

    for (const row of rows) {
      const code =
        (row.CURRENCY_CD ?? row.currency ?? row.Currency ?? row.CurrencyCode ?? '').toString().toUpperCase();
      const sell =
        parseFloat(row.SELLING ?? row.spotSell ?? row.SpotSell ?? row.sell ?? row.Sell ?? '0') || 0;
      if (code === 'USD' && sell > 0) {usdSell = sell;}
      if (code === 'JPY' && sell > 0) {jpySell = sell;}
    }

    if (usdSell > 0 && jpySell > 0) {
      return {usdSell, jpySell, updatedAt: new Date().toLocaleTimeString('zh-TW')};
    }
    return null;
  } catch {
    return null;
  }
}

// 嘗試從 HTML 解析
async function tryHtmlParse(): Promise<RateData | null> {
  try {
    const r = await fetch(
      'https://www.cathaybk.com.tw/cathaybk/personal/product/deposit/currency-billboard/',
      {headers: HEADERS},
    );
    if (!r.ok) {return null;}
    const html = await r.text();

    // 先找 JSON blob（__NUXT__ / __NEXT_DATA__ / window.__xxx__）
    const jsonPatterns = [
      /__NUXT__\s*=\s*(\{.+?\})\s*;?\s*<\/script>/s,
      /__NEXT_DATA__[^>]*>(\{.+?\})<\/script>/s,
      /window\.__INITIAL_STATE__\s*=\s*(\{.+?\})\s*;/s,
    ];
    for (const pat of jsonPatterns) {
      const m = html.match(pat);
      if (m) {
        try {
          const obj = JSON.parse(m[1]);
          const result = extractFromObject(obj);
          if (result) {return result;}
        } catch {}
      }
    }

    // 用 regex 從 table 中找即期賣出
    // USD: 找 "USD" 附近連續幾個數字，取第 4 欄（即期賣出）
    const usdMatch = findRateInHtml(html, 'USD');
    const jpyMatch = findRateInHtml(html, 'JPY');

    if (usdMatch > 0 && jpyMatch > 0) {
      return {usdSell: usdMatch, jpySell: jpyMatch, updatedAt: new Date().toLocaleTimeString('zh-TW')};
    }
    return null;
  } catch {
    return null;
  }
}

function extractFromObject(obj: any): RateData | null {
  const str = JSON.stringify(obj);
  const usdM = str.match(/"USD"[^}]{0,200}"spotSell"\s*:\s*"?([\d.]+)"?/);
  const jpyM = str.match(/"JPY"[^}]{0,200}"spotSell"\s*:\s*"?([\d.]+)"?/);
  if (usdM && jpyM) {
    return {usdSell: parseFloat(usdM[1]), jpySell: parseFloat(jpyM[1]), updatedAt: new Date().toLocaleTimeString('zh-TW')};
  }
  return null;
}

function findRateInHtml(html: string, code: string): number {
  // 找到 CODE 後面最近的 4 個數字（即期買入前有現金買入/現金賣出/即期買入，第4個是即期賣出）
  const codeIdx = html.indexOf(`>${code}<`);
  if (codeIdx === -1) {return 0;}
  const snippet = html.slice(codeIdx, codeIdx + 1000);
  const nums = [...snippet.matchAll(/>(\d+\.?\d*)</g)]
    .map(m => parseFloat(m[1]))
    .filter(n => n > 0.0001 && n < 200);
  // 通常順序：現金買入, 現金賣出, 即期買入, 即期賣出
  return nums[3] ?? nums[1] ?? 0;
}

export async function fetchCathayRates(): Promise<RateData> {
  const json = await tryJsonApi();
  if (json) {return json;}

  const html = await tryHtmlParse();
  if (html) {return html;}

  throw new Error('無法取得匯率，請確認網路連線後再試');
}
