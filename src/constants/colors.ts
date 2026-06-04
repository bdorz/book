// Static colors that don't change with theme (category palette)
export const CategoryColors: Record<string, string> = {
  餐飲: '#FF9F43',
  購物: '#FF4757',
  交通: '#2D9CDB',
  娛樂: '#A29BFE',
  醫療: '#00CEC9',
  住房: '#6C5CE7',
  教育: '#0984E3',
  其他: '#636E72',
  薪資: '#00C897',
  獎金: '#FDCB6E',
  投資: '#00B894',
  代付: '#FF9F43',
  代收: '#00C897',
};

// Re-export theme colors for backwards compat
export {LightColors as Colors} from '../context/ThemeContext';
