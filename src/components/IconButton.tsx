import styled from 'styled-components'
import {
  IconButton as FloraIconButtonBase,
  Button as FloraButtonBase,
} from '@zendesk-ui/react-components'

/**
 * Flora content IconButton: 32px hit target.
 * Glyphs come from @zendesk-ui/assets (20px Flora Icons) and render at 16px.
 */
export const IconButton = styled(FloraIconButtonBase)`
  && {
    width: 32px;
    height: 32px;
    min-width: 32px;
    padding: 0;
  }

  && svg {
    width: 16px;
    height: 16px;
  }
`

/** Small text buttons with Flora 20px icons displayed at 16px. */
export const SmallButton = Object.assign(
  styled(FloraButtonBase)`
    && svg {
      width: 16px;
      height: 16px;
    }
  `,
  {
    StartIcon: FloraButtonBase.StartIcon,
    EndIcon: FloraButtonBase.EndIcon,
  },
)
