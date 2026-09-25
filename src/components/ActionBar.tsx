import styled from 'styled-components'
import { Button, ChevronButton } from '@zendesk-ui/react-components'
import LightningBoltIcon from '@zendesk-ui/assets/icons/20px/lightning-bolt-stroke.svg?react'
import ChevronDownIcon from '@zendesk-ui/assets/icons/20px/chevron-down.svg?react'
import { flora } from '../flora/tokens'
import { typeStyle } from '../flora/typography'

const Bar = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 52px;
  padding: 8px 12px;
  border-top: 1px solid #dedddb;
  background: #ffffff;
  flex-shrink: 0;
`

const MacroField = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 260px;
  height: 40px;
  padding: 10px 12px;
  border: 1px solid #b7b7b3;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  font: inherit;
`

const MacroLabel = styled.span`
  flex: 1;
  ${typeStyle('mediumDefault')}
  color: ${flora.fg.placeholder};
`

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Icon = styled(LightningBoltIcon)`
  width: 20px;
  height: 20px;
  color: #2f3130;
  flex-shrink: 0;
`

const Chevron = styled(ChevronDownIcon)`
  width: 20px;
  height: 20px;
  color: #2f3130;
  flex-shrink: 0;
`

const PrimarySplit = styled(Button)`
  && svg {
    width: 16px;
    height: 16px;
  }
`

export default function ActionBar() {
  return (
    <Bar>
      <MacroField type="button" aria-label="Select a macro">
        <Icon />
        <MacroLabel>Select a macro</MacroLabel>
        <Chevron />
      </MacroField>
      <Actions>
        <ChevronButton size="medium" isBasic>
          Close tab
        </ChevronButton>
        <PrimarySplit size="medium" isPrimary>
          Submit as Open
          <Button.EndIcon>
            <ChevronDownIcon />
          </Button.EndIcon>
        </PrimarySplit>
      </Actions>
    </Bar>
  )
}
