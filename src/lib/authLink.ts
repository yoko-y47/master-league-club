// メールのリンク（パスワード再設定など）から開いたときの後始末
// Supabase はリンクの結果を URL の # に付けて戻す（#access_token=…&type=recovery、失敗なら #error=…&error_code=…）。
// このアプリは # をページの切り替え（HashRouter）に使うので、画面を出す前に読み取ってから、行き先のページに書き換える
import { supabase } from './supabaseClient'

const RECOVERY_KEY = 'auth.passwordRecovery'
const LINK_ERROR_KEY = 'auth.linkError'

function remember(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key)
    else sessionStorage.setItem(key, value)
  } catch {
    // 保存できなくても続ける（プライベートモードなど）
  }
}
function recall(key: string) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export async function handleAuthLink() {
  const hash = window.location.hash
  if (!/(^|[#&])(access_token|error|error_code)=/.test(hash)) return
  const params = new URLSearchParams(hash.replace(/^#\/?/, ''))
  if (params.get('error') || params.get('error_code')) {
    remember(LINK_ERROR_KEY, params.get('error_code') ?? params.get('error'))
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/login`)
    return
  }
  // ログインの状態を URL から読み終えるのを待ってから、行き先へ
  await supabase.auth.getSession()
  const recovery = params.get('type') === 'recovery'
  if (recovery) remember(RECOVERY_KEY, '1')
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/${recovery ? 'account/password' : ''}`)
}

// 再設定のリンクから来たか（新しいパスワードを保存したら消す）
export const isPasswordRecovery = () => recall(RECOVERY_KEY) === '1'
export const clearPasswordRecovery = () => remember(RECOVERY_KEY, null)
// リンクが無効・期限切れだったとき（ログイン画面で一度だけ出す）
export function takeLinkError() {
  const code = recall(LINK_ERROR_KEY)
  remember(LINK_ERROR_KEY, null)
  return code
}
