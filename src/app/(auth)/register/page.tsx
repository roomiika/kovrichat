'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction } from '@/actions/auth'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta')
        setLoading(false)
        return
      }

      // Conta criada — faz login automático
      try {
        const result = await loginAction(form.email, form.password)
        if (result?.error) {
          window.location.href = '/login'
        }
        // sucesso: server action redireciona via NEXT_REDIRECT
      } catch {
        window.location.href = '/login'
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Image src="/logo.png" alt="Kovrichat" width={120} height={120} />
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900">Criar conta</h1>
            <p className="text-sm text-gray-500 mt-1">Comece gratuitamente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-gray-700">Seu nome</Label>
            <Input id="name" name="name" placeholder="João Silva" value={form.name} onChange={handleChange} required className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="organizationName" className="text-gray-700">Nome da empresa</Label>
            <Input id="organizationName" name="organizationName" placeholder="Minha Empresa" value={form.organizationName} onChange={handleChange} required className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-gray-700">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={handleChange} required className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>Criar conta</Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
