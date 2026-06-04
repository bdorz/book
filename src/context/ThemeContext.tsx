import React, {createContext, useContext, useState, useEffect, useMemo} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@book_theme';

export const LightColors = {
  background: '#F0F0F8',
  card: '#FFFFFF',
  primary: '#7C6FF7',
  expense: '#FF4757',
  income: '#00C897',
  creditCard: '#2D9CDB',
  family: '#FF9F43',
  textPrimary: '#1A1A2E',
  textSecondary: '#8E8E93',
  textLight: '#BDBDBD',
  border: '#E8E8EE',
  shadow: 'rgba(0,0,0,0.08)',
};

export const DarkColors = {
  background: '#111120',
  card: '#1C1C2E',
  primary: '#9B87F5',
  expense: '#FF6B78',
  income: '#00D9A5',
  creditCard: '#52AFEF',
  family: '#FFBA6E',
  textPrimary: '#EEEEF5',
  textSecondary: '#8888A0',
  textLight: '#44445A',
  border: '#2C2C40',
  shadow: 'rgba(0,0,0,0.3)',
};

export type AppColors = typeof LightColors;

interface ThemeContextType {
  isDark: boolean;
  colors: AppColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: LightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(v => {
      if (v === 'dark') {setIsDark(true);}
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const value = useMemo(
    () => ({isDark, colors: isDark ? DarkColors : LightColors, toggleTheme}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useColors(): AppColors {
  return useContext(ThemeContext).colors;
}
