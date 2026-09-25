# AI Supervisor Prototype

Zendesk Support **Split view** prototype rebuilt from the [Auto Assist 2026 Q2](https://www.figma.com/design/wZQ4zdhup4MUaAENuB03g9/Auto-Assist--2026-Q2-?node-id=22535-29268) Figma frame, using **Flora** (`@zendesk-ui/react-components`) + Zendesk-UI navigation.

## Stack

- React 18 + TypeScript + Vite
- `@zendesk-ui/react-components` — Flora ThemeProvider, Button, Tag, Avatar, IconButton, Anchor, ChevronButton
- `@zendesk-ui/assets` — Flora Icons (`icons/20px`), used for nav + content (content IconButtons display them at 16px)
- `@zendesk-ui/navigation` — Product / Header / Nav / Main shell
- `styled-components` — layout chrome matching Figma spacing

Do **not** mix `@zendeskgarden/svg-icons` into content — thinner Garden strokes break Flora optical weight.

## Run

```bash
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5174

## Structure

```
src/
  components/
    GlobalNav.tsx           # Support product shell
    SplitView.tsx           # Work list + record + action bar
    WorkListPanel.tsx       # Filter / Recommended list
    ConversationPanel.tsx   # Ticket header, message, composer
    CustomerContextPanel.tsx
    ContextSidebar.tsx
    ActionBar.tsx
  data/tickets.ts
```

## Design source

- Frame: `Split view` (`22535:29268`)
- Flora libraries: Foundations + Components, Icons (see Flora skill)
