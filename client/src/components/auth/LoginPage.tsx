import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c0c0e] rounded-lg border border-white/10 p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gov-gold font-mono text-xs tracking-widest uppercase mb-2">
            Observatorio La Rioja
          </p>
          <h1 className="text-2xl font-serif text-slate-100">
            Iniciar Sesión
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label 
              htmlFor="email" 
              className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-[#09090b] border border-white/10 rounded px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-gov-gold/50 transition-colors disabled:opacity-50"
              placeholder="tu@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label 
              htmlFor="password" 
              className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-[#09090b] border border-white/10 rounded px-4 py-3 text-slate-100 font-mono text-sm focus:outline-none focus:border-gov-gold/50 transition-colors disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3">
              <p className="text-red-400 text-sm font-mono">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gov-gold hover:bg-gov-gold-light disabled:bg-gov-gold/50 text-[#09090b] font-mono text-sm font-semibold uppercase tracking-wider py-3 rounded transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
