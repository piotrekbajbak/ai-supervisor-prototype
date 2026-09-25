import styled, { css } from 'styled-components'
import { typeStyle } from '../flora/typography'

/**
 * Delicate keyboard key badge — soft fill, thin stroke, light keycap depth.
 * `$pressed` inverts colors for active-shortcut feedback.
 * Single-character keys stay 20×20; longer labels (e.g. esc) grow horizontally.
 */
const Key = styled.span<{ $pressed?: boolean; $wide?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 20px;
  width: ${({ $wide }) => ($wide ? 'auto' : '20px')};
  height: 20px;
  padding: ${({ $wide }) => ($wide ? '0 5px' : '0')};
  border-radius: 3px;
  border-style: solid;
  border-width: 1px;
  /* Top/left catch light; bottom/right soft edge for a raised keycap. */
  border-color: #d4d3d0 #b7b7b3 #a8a8a4 #d4d3d0;
  background: #eae9e8;
  box-shadow:
    inset 0 0.5px 0 rgba(255, 255, 255, 0.85),
    0.5px 0.5px 0 rgba(139, 142, 137, 0.28),
    0 6px 10px rgba(12, 12, 13, 0.14),
    0 14px 22px rgba(12, 12, 13, 0.12);
  ${typeStyle('smallBold')}
  font-size: 11px;
  font-weight: 500;
  color: #68737d;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  transition:
    background 80ms ease,
    color 80ms ease,
    border-color 80ms ease,
    box-shadow 80ms ease;

  ${({ $pressed }) =>
    $pressed &&
    css`
      background: #2f3941;
      color: #f8f9f9;
      border-color: #1f272d #3a454d #3a454d #1f272d;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 6px 10px rgba(12, 12, 13, 0.22),
        0 14px 22px rgba(12, 12, 13, 0.16);
    `}
`

interface ShortcutKeyProps {
  label: string
  pressed?: boolean
  className?: string
}

export default function ShortcutKey({ label, pressed = false, className }: ShortcutKeyProps) {
  return (
    <Key className={className} $pressed={pressed} $wide={label.length > 1} aria-hidden>
      {label}
    </Key>
  )
}
