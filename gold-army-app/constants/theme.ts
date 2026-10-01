import { Platform } from 'react-native';

export const colors = {
  blackDeep: '#080808',
  blackPure: '#000000',
  graphite: '#151515',
  surface: '#1C1C1C',
  surface2: '#242424',
  line: '#2B2B2B',
  red: '#E50914',
  redBright: '#FF1E2D',
  crimson: '#8B0000',
  redMuted: '#5E1116',
  gold: '#D4AF37',
  goldSoft: '#E6C76A',
  platinum: '#D9D9D9',
  white: '#FFFFFF',
  text2: '#D0D0D0',
  muted: '#8A8A8A',
  green: '#3FB27F',
  amber: '#E0A62B',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const radius = { sm: 9, md: 12, lg: 16, xl: 24 } as const;
export const fonts = {
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  display: Platform.select({ ios: 'System', android: 'sans-serif-condensed', default: 'sans-serif' }),
} as const;
