export interface RateData {
  usdSell: number;
  jpySell: number;
  updatedAt: string;
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  Accept: 'text/html,*/*',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

// 從 HTML 找指定幣別的即期賣出匯率
// 結構：<img src=".../USD.svg"> → 找到卡片 → 找 "即期匯率" → 取第二個數字（銀行賣出）
function findRateInHtml(html: string, code: string): number {
  const svgIdx = html.indexOf(`/${code}.svg`);
  if (svgIdx === -1) {return 0;}

  const spotIdx = html.indexOf('即期匯率', svgIdx);
  if (spotIdx === -1) {return 0;}

  const snippet = html.slice(spotIdx, spotIdx + 300);
  const nums = [...snippet.matchAll(/>(\d+\.?\d*)</g)]
    .map(m => parseFloat(m[1]))
    .filter(n => n > 0);

  // 順序：銀行買進、銀行賣出 → 取索引 1
  return nums[1] ?? 0;
}

export async function fetchCathayRates(): Promise<RateData> {
  let r: Response;
  try {
    r = await fetch(
      'https://www.cathaybk.com.tw/cathaybk/personal/product/deposit/currency-billboard/',
      {headers: HEADERS},
    );
  } catch (e: any) {
    throw new Error(`網路錯誤: ${e?.message}`);
  }

  if (!r.ok) {throw new Error(`伺服器回應 HTTP ${r.status}`);}

  const html = await r.text();
  const htmlLen = html.length;
  const hasSvg = html.includes('/USD.svg');
  const hasSpot = html.includes('即期匯率');

  const usdSell = findRateInHtml(html, 'USD');
  const jpySell = findRateInHtml(html, 'JPY');

  if (usdSell > 0 && jpySell > 0) {
    return {usdSell, jpySell, updatedAt: new Date().toLocaleTimeString('zh-TW')};
  }

  throw new Error(
    `解析失敗 (HTML ${htmlLen}字, USD.svg:${hasSvg}, 即期:${hasSpot}, USD:${usdSell}, JPY:${jpySell})`,
  );
}
