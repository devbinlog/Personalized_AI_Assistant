'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Brain, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function validate(): string | null {
    if (!email) return '이메일을 입력하세요.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) return '올바른 이메일 형식을 입력하세요.'
    if (!password) return '비밀번호를 입력하세요.'
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.'
    if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? '회원가입 중 오류가 발생했습니다.')
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/auth/signin'), 1500)
      }
    } catch {
      setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700 mb-4">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">회원가입</h1>
        <p className="mt-1 text-sm text-slate-500">새 계정을 만들어 시작하세요</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            회원가입이 완료되었습니다. 로그인 페이지로 이동합니다…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: '이름', type: 'text', value: name, setter: setName, placeholder: '홍길동', optional: true },
            { label: '이메일', type: 'email', value: email, setter: setEmail, placeholder: 'you@example.com' },
            { label: '비밀번호', type: 'password', value: password, setter: setPassword, placeholder: '8자 이상' },
            { label: '비밀번호 확인', type: 'password', value: confirmPassword, setter: setConfirmPassword, placeholder: '비밀번호를 다시 입력하세요' },
          ].map(({ label, type, value, setter, placeholder, optional }) => (
            <div key={label}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {label} {optional && <span className="text-slate-400 font-normal">(선택)</span>}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                required={!optional}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 focus:outline-none transition-colors"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || success}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            회원가입
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/signin" className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
