import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetIcons()],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'text-ellipsis': 'truncate',
  },
  theme: {
    colors: {
      primary: '#589286',
      'primary-light': '#EEF5F4',
      'primary-dark': '#4a7d73',
      accent: '#589286',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
    },
  },
})
