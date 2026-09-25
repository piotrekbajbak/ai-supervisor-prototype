import { useMemo } from 'react'
import { getAvatarBubbleColor, type BubbleRole } from '../utils/avatarBubbleColor'

export function useAvatarBubbleColor(avatarSrc: string, role: BubbleRole): string {
  return useMemo(() => getAvatarBubbleColor(avatarSrc, role), [avatarSrc, role])
}
