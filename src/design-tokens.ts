// Design System Tokens for Creator Studio

export const typography = {
    fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    lineHeight: {
        tight: '1.2',
        normal: '1.5',
        relaxed: '1.75',
    },
} as const;

export const spacing = {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
} as const;

export const colors = {
    // Semantic colors
    success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
    },
    warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
    },
    error: {
        50: '#fef2f2',
        100: '#fee2e2',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
    },
    info: {
        50: '#eff6ff',
        100: '#dbeafe',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
    },
    // Brand colors
    primary: {
        50: '#fef2f2',
        100: '#fee2e2',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
    },
    purple: {
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
    },
    cyan: {
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
    },
} as const;

export const shadows = {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(239, 68, 68, 0.3)',
    glowPurple: '0 0 20px rgba(139, 92, 246, 0.3)',
    glowCyan: '0 0 20px rgba(6, 182, 212, 0.3)',
} as const;

export const borderRadius = {
    sm: '8px',
    base: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
} as const;

export const animation = {
    duration: {
        fast: '150ms',
        base: '300ms',
        slow: '500ms',
    },
    easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
} as const;

export const zIndex = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
} as const;
