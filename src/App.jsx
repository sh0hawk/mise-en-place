import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './lib/AppContext'
import { BottomNav } from './components/NavBar'
import { Home } from './pages/Home'
import { Plan } from './pages/Plan'
import { RecipeLibrary } from './pages/RecipeLibrary'
import { RecipeDetail } from './pages/RecipeDetail'
import { RecipeNew } from './pages/RecipeNew'
import { Shopping } from './pages/Shopping'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <AppProvider>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/recipes" element={<RecipeLibrary />} />
            <Route path="/recipes/new" element={<RecipeNew />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </AppProvider>
  )
}
