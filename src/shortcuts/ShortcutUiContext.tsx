import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

interface ShortcutUiValue {
  showShortcuts: boolean
  setShowShortcuts: Dispatch<SetStateAction<boolean>>
  activeShortcut: string | null
  setActiveShortcut: Dispatch<SetStateAction<string | null>>
}

const ShortcutUiContext = createContext<ShortcutUiValue | null>(null)

export function ShortcutUiProvider({ children }: { children: ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null)

  const value = useMemo(
    () => ({
      showShortcuts,
      setShowShortcuts,
      activeShortcut,
      setActiveShortcut,
    }),
    [showShortcuts, activeShortcut],
  )

  return (
    <ShortcutUiContext.Provider value={value}>{children}</ShortcutUiContext.Provider>
  )
}

export function useShortcutUi() {
  const value = useContext(ShortcutUiContext)
  if (!value) {
    throw new Error('useShortcutUi must be used within ShortcutUiProvider')
  }
  return value
}
