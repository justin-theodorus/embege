import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { GibrainPanel } from './components/layout/GibrainPanel'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { InventoryPage } from './components/inventory/InventoryPage'
import { RecipesPage } from './components/recipes/RecipesPage'
import { GroceriesPage } from './components/groceries/GroceriesPage'
import { ChatPage } from './components/chat/ChatPage'
import { useConversation } from './hooks/useConversation'

function AppShell () {
  const conversationData = useConversation()

  return (
    <div className="flex h-full">
      <Sidebar />

      <main className="flex-1 ml-[72px] min-h-full overflow-y-auto bg-brand-bg">
        <Routes>
          <Route path="/" element={<DashboardPage conversationData={conversationData} />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/recipes" element={<RecipesPage conversationData={conversationData} />} />
          <Route path="/groceries" element={<GroceriesPage />} />
          <Route path="/chat" element={<ChatPage conversationData={conversationData} />} />
        </Routes>
      </main>

      <GibrainPanel conversationData={conversationData} />
    </div>
  )
}

export default function App () {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
