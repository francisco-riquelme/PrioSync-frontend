// src/app/login/page.tsx
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">PrioSync</h1>
        <p className="text-gray-400">Tu asistente de tiempo inteligente</p>
      </div>
      <LoginForm />
    </main>
  );
}