import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParkingSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../roleHome';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-asphalt px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] bg-barrier bg-[length:56px_56px]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-barrier-yellow/10 blur-3xl" />

      <div className="relative w-full max-w-sm bg-concrete-card rounded-xl2 shadow-lift p-8 animate-rise">
        <div className="flex items-center gap-2 font-display text-2xl font-extrabold text-asphalt mb-1">
          <ParkingSquare className="w-6 h-6 text-barrier-yellow" strokeWidth={2.5} />
          Park<span className="text-barrier-amber">Ease</span>
        </div>
        <p className="text-sm text-steel mb-6">Sign in to manage bookings, malls, or gates.</p>

        {error && <div className="banner-error mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              className="field-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              className="field-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in…' : (
              <>
                Sign in <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-steel">
          New here?{' '}
          <Link to="/register" className="font-bold text-asphalt underline underline-offset-2">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
