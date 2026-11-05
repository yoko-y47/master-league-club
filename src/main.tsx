import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './lib/AuthContext.tsx'
import { LanguageProvider } from './lib/i18n/LanguageContext.tsx'
import { handleAuthLink } from './lib/authLink.ts'

// メールのリンク（パスワード再設定など）から開いたときは、その結果を読み取ってから画面を出す
handleAuthLink().finally(() => createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
))
