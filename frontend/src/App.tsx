import { useState, useEffect } from 'react'
import './App.css'
import SettingsPage from './components/SettingsPage'
import MainPage from './components/MainPage'
// Use relative paths since alias resolution seems problematic
import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { Upload, FileText, Cloud, Moon, Sun } from 'lucide-react'

// Constants for localStorage keys
const ACCOUNT_ID_KEY = 'cloudflare_account_id'
const API_TOKEN_KEY = 'cloudflare_api_token'

// Environment variables from .env file
const ENV_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID
const ENV_API_TOKEN = import.meta.env.VITE_CLOUDFLARE_API_TOKEN

function App() {
  const [accountId, setAccountId] = useState<string | null>(null)
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // 首先检查环境变量
    if (ENV_ACCOUNT_ID && ENV_API_TOKEN && 
        ENV_ACCOUNT_ID !== 'your_account_id_here' && 
        ENV_API_TOKEN !== 'your_api_token_here') {
      setAccountId(ENV_ACCOUNT_ID)
      setApiToken(ENV_API_TOKEN)
      // 同时保存到 localStorage
      localStorage.setItem(ACCOUNT_ID_KEY, ENV_ACCOUNT_ID)
      localStorage.setItem(API_TOKEN_KEY, ENV_API_TOKEN)
      setHasCheckedLocalStorage(true)
      return
    }
    
    // 如果环境变量不可用，则检查 localStorage
    const storedAccountId = localStorage.getItem(ACCOUNT_ID_KEY)
    const storedApiToken = localStorage.getItem(API_TOKEN_KEY)

    if (storedAccountId && storedApiToken) {
      setAccountId(storedAccountId)
      setApiToken(storedApiToken)
    }
    setHasCheckedLocalStorage(true) // Mark check as complete
  }, [])

  const handleSaveCredentials = (id: string, token: string) => {
    localStorage.setItem(ACCOUNT_ID_KEY, id)
    localStorage.setItem(API_TOKEN_KEY, token)
    setAccountId(id)
    setApiToken(token)
  }

  const handleClearCredentials = () => {
    localStorage.removeItem(ACCOUNT_ID_KEY)
    localStorage.removeItem(API_TOKEN_KEY)
    setAccountId(null)
    setApiToken(null)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.body.classList.toggle('dark-theme')
  }

  // Don't render anything until localStorage check is complete
  if (!hasCheckedLocalStorage) {
    return null // Or a loading indicator
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className={`ghibli-container ${isDarkMode ? 'dark-theme' : ''}`}>
        <header className="ghibli-header">
          <div className="flex items-center">
            <FileText size={32} color="white" className="mr-2" />
            <h1 className="text-white text-2xl font-bold">文档转Markdown</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={toggleDarkMode} 
              className="ghibli-icon-button"
              title={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {accountId && apiToken && (
              <button 
                onClick={handleClearCredentials} 
                className="ghibli-button text-sm"
              >
                清除凭据
              </button>
            )}
          </div>
        </header>

        <main>
          <h2 className="ghibli-title">将文字照片转化为Markdown文本</h2>

          {accountId && apiToken ? (
            <MainPage
              accountId={accountId}
              apiToken={apiToken}
              onClearCredentials={handleClearCredentials}
            />
          ) : (
            <SettingsPage onSave={handleSaveCredentials} />
          )}
        </main>

        <footer className="ghibli-footer">
          <p>© 2025 文档转Markdown服务 | 由 Cloudflare AI 提供技术支持</p>
        </footer>
      </div>
    </ThemeProvider>
  )
}

export default App
