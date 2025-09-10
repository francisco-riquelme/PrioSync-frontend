// src/app/login/page.tsx
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <AuthForm />
    </main>
  );
}