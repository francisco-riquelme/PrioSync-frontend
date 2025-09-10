// src/components/auth/AuthForm.tsx
"use client";

import { useState } from 'react';

// Este componente se puede mover a un archivo separado si es necesario
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 400.3 381.2 512 244 512S0 400.3 0 261.8 106.8 11.6 244 11.6c67.7 0 121.5 24.9 166.4 68.6l-67.9 67.9C313.5 112.5 282.3 96 244 96c-83.2 0-151.2 67.9-151.2 151.1s68 151.1 151.2 151.1c97.1 0 134-62.3 138.6-95.4H244v-74.6h239.1c1.2 12.8 2.9 25.4 2.9 40.8z"></path>
    </svg>
  );
}

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
  }

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
          <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300">
            ¿Olvidaste tu contraseña?
          </a>
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