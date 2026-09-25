import GlobalNav from './components/GlobalNav'
import SplitView from './components/SplitView'
import { ShortcutUiProvider } from './shortcuts/ShortcutUiContext'

export default function App() {
  return (
    <ShortcutUiProvider>
      <GlobalNav>
        <SplitView />
      </GlobalNav>
    </ShortcutUiProvider>
  )
}
