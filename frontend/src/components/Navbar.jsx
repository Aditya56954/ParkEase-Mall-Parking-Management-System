import { LogOut, ParkingSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div>
      <div className="flex items-center justify-between h-16 px-6 bg-asphalt text-white">
        <div className="flex items-center gap-2 font-display text-xl font-extrabold">
          <ParkingSquare className="w-6 h-6 text-barrier-yellow" strokeWidth={2.5} />
          Park<span className="text-barrier-yellow">Ease</span>
        </div>
        {user && (
          <nav className="flex items-center gap-4 text-sm">
            <span className="text-white/80 hidden sm:inline">{user.name}</span>
            <span className="rounded-full border border-asphalt-line bg-asphalt-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-barrier-yellow">
              {user.role}
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-asphalt-line px-3 py-1.5 text-white/90 transition-colors hover:border-barrier-yellow hover:text-barrier-yellow"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </nav>
        )}
      </div>
      <div className="barrier-stripe" />
    </div>
  );
}
