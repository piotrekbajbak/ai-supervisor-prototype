/** Flora text + color tokens aligned to Figma Auto Assist / Flora Core */
export const flora = {
  font: {
    family:
      "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  fg: {
    default: '#2f3130',
    strong: '#313131',
    ink: '#0a0d0e',
    subtle: '#646864',
    muted: '#5c6970',
    placeholder: '#8b8e89',
    primary: '#1f73b7',
    activeSubtitle: '#222121',
  },
  type: {
    /** Medium/Bold — 14/20 Semibold, -0.154 */
    mediumBold: {
      size: '14px',
      lineHeight: '20px',
      weight: 600,
      letterSpacing: '-0.154px',
    },
    /** Medium/Default — 14/20 Regular, -0.154 */
    mediumDefault: {
      size: '14px',
      lineHeight: '20px',
      weight: 400,
      letterSpacing: '-0.154px',
    },
    /** Small/Bold — 12/16 Semibold, -0.0004 */
    smallBold: {
      size: '12px',
      lineHeight: '16px',
      weight: 600,
      letterSpacing: '-0.0004px',
    },
    /** Small/Default — 12/16 Regular, -0.0004 */
    smallDefault: {
      size: '12px',
      lineHeight: '16px',
      weight: 400,
      letterSpacing: '-0.0004px',
    },
  },
} as const

export type FloraTypeStyle = keyof typeof flora.type
