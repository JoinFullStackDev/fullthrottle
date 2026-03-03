'use client';

import { createTheme, alpha } from '@mui/material/styles';

const CHARCOAL_BG = '#0A0A0F';
const SURFACE_BG = '#131318';
const SURFACE_ELEVATED = '#1A1A22';
const SURFACE_HOVER = '#22222E';
const BORDER_COLOR = '#2A2A36';

const ACCENT = '#5C6BC0';
const ACCENT_LIGHT = '#7986CB';

const TEXT_PRIMARY = '#E0E0E6';
const TEXT_SECONDARY = '#9E9EB0';
const TEXT_DISABLED = '#5A5A6E';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: ACCENT,
      light: ACCENT_LIGHT,
      dark: '#3F51B5',
    },
    background: {
      default: CHARCOAL_BG,
      paper: SURFACE_BG,
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
      disabled: TEXT_DISABLED,
    },
    divider: BORDER_COLOR,
    error: {
      main: '#CF6679',
      light: '#E57373',
      dark: '#B71C1C',
    },
    warning: {
      main: '#C9A84C',
      light: '#E2C06E',
      dark: '#8D6E3F',
    },
    success: {
      main: '#66BB6A',
      light: '#81C784',
      dark: '#388E3C',
    },
    info: {
      main: ACCENT,
    },
    action: {
      hover: alpha(ACCENT, 0.08),
      selected: alpha(ACCENT, 0.14),
      focus: alpha(ACCENT, 0.12),
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h2: {
      fontSize: '1.375rem',
      fontWeight: 600,
      letterSpacing: '-0.005em',
      lineHeight: 1.35,
    },
    h3: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.55,
      color: TEXT_SECONDARY,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: TEXT_SECONDARY,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: CHARCOAL_BG,
          scrollbarWidth: 'thin',
          scrollbarColor: `${BORDER_COLOR} transparent`,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${BORDER_COLOR}`,
          backgroundColor: SURFACE_BG,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${BORDER_COLOR}`,
          backgroundColor: SURFACE_BG,
          '&:hover': {
            backgroundColor: SURFACE_HOVER,
            borderColor: alpha(ACCENT, 0.3),
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '6px 16px',
        },
        contained: {
          '&:hover': {
            backgroundColor: ACCENT_LIGHT,
          },
        },
        outlined: {
          borderColor: BORDER_COLOR,
          '&:hover': {
            borderColor: ACCENT,
            backgroundColor: alpha(ACCENT, 0.08),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: BORDER_COLOR,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: BORDER_COLOR,
            },
            '&:hover fieldset': {
              borderColor: TEXT_SECONDARY,
            },
            '&.Mui-focused fieldset': {
              borderColor: ACCENT,
            },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: SURFACE_ELEVATED,
          border: `1px solid ${BORDER_COLOR}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: SURFACE_ELEVATED,
          border: `1px solid ${BORDER_COLOR}`,
          color: TEXT_PRIMARY,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 44,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.Mui-selected': {
            backgroundColor: alpha(ACCENT, 0.14),
            '&:hover': {
              backgroundColor: alpha(ACCENT, 0.2),
            },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: ACCENT,
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: ACCENT,
          },
        },
      },
    },
  },
});

export default theme;
