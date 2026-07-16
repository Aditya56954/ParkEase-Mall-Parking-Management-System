import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParkingSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleHome } from '../roleHome';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
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
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-barrier-yellow/10 blur-3xl" />

      <div className="relative w-full max-w-sm bg-concrete-card rounded-xl2 shadow-lift p-8 animate-rise">
        <div className="flex items-center gap-2 font-display text-2xl font-extrabold text-asphalt mb-1">
          <ParkingSquare className="w-6 h-6 text-barrier-yellow" strokeWidth={2.5} />
          Park<span className="text-barrier-amber">Ease</span>
        </div>
        <p className="text-sm text-steel mb-6">
          Guard and admin accounts are created by an administrator — this form is for shoppers and mall owners.
        </p>

        {error && <div className="banner-error mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">Full name</label>
            <input required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              type="email"
              required
              className="field-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="field-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">I am a</label>
            <select className="field-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">Shopper looking to park</option>
              <option value="mallOwner">Mall owner</option>
            </select>
          </div>
          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account…' : (
              <>
                Create account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-steel">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-asphalt underline underline-offset-2">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
