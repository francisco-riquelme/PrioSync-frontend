import RegisterForm from '@/components/auth/RegisterForm';
import { ENABLE_REGISTRATION } from '@/config/registration';
import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Redirigir a login si el registro está deshabilitado
  if (!ENABLE_REGISTRATION) {
    redirect('/auth/login');
  }
  
  return <RegisterForm />;
}
