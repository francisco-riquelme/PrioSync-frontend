// src/components/auth/AuthForm.tsx
"use client";

import { useState } from 'react';
import GoogleIcon from './GoogleIcon';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Por ahora, solo mostramos en consola que capturamos los datos.
    // La validación real se hará en una tarea futura.
    console.log('Datos de inicio de sesión enviados:', { email, password });
    // Aquí iría la lógica para llamar a tu API de inicio de sesión
  };

  const handleGoogleLogin = () => {
    console.log('Iniciar sesión con Google');
    // La lógica de Google se implementará en su propia tarea.
  };

  const handleForgotPassword = () => {
    // Aquí puedes redirigir o mostrar un modal, según tu flujo
    console.log('Redirigir a recuperación de contraseña');
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">PrioSync</h1>
        <p className="text-gray-400">Tu asistente de tiempo inteligente</p>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full inline-flex justify-center items-center gap-3 py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      <div className="flex items-center">
        <div className="flex-grow bg-gray-600 h-px"></div>
        <span className="flex-shrink px-4 text-sm text-gray-400">O</span>
        <div className="flex-grow bg-gray-600 h-px"></div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Correo Electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
          />
        </div>

        <div className="text-right text-sm">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="font-medium text-indigo-400 hover:text-indigo-300 underline focus:outline-none"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button
          type="submit"
          className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}