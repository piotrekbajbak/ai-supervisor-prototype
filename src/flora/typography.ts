import { css } from 'styled-components'
import { flora, type FloraTypeStyle } from './tokens'

export const typeStyle = (key: FloraTypeStyle) => {
  const t = flora.type[key]
  return css`
    font-family: ${flora.font.family};
    font-size: ${t.size};
    line-height: ${t.lineHeight};
    font-weight: ${t.weight};
    letter-spacing: ${t.letterSpacing};
  `
}
