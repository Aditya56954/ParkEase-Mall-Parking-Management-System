import { useEffect, useState } from 'react';
import { CarFront, TicketX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusPill from '../components/StatusPill';

export default function UserDashboard() {
  const { token } = useAuth();
  const [malls, setMalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedMall, setSelectedMall] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQr, setLastQr] = useState(null);

  const load = async () => {
    const [mallsRes, bookingsRes] = await Promise.all([
      api.get('/malls', token),
      api.get('/bookings/my', token),
    ]);
    setMalls(mallsRes.data);
    setBookings(bookingsRes.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeBooking = bookings.find((b) => ['booked', 'active'].includes(b.status));

  const book = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/bookings', { mallId: selectedMall, vehicleNumber }, token);
      setLastQr(res.data.qrCode);
      setVehicleNumber('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (id) => {
    setError('');
    try {
      await api.patch(`/bookings/${id}/cancel`, {}, token);
      setLastQr(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl">Find parking</h1>
        <p className="text-steel text-sm mt-1.5">Book a slot at an approved mall and get a QR code for entry &amp; exit.</p>
      </div>

      {error && <div className="banner-error mb-5">{error}</div>}

      {activeBooking ? (
        <div className="card mb-6 animate-rise">
          <h3 className="text-base mb-4">Your active booking</h3>

          <div className="relative flex items-center gap-5 rounded-2xl bg-asphalt text-white p-5 overflow-hidden">
            <div className="absolute inset-y-0 left-[132px] border-l-2 border-dashed border-white/20" />
            <div className="relative w-28 h-28 shrink-0 rounded-lg bg-white p-2 flex items-center justify-center">
              {lastQr ? (
                <img src={lastQr} alt="Entry/exit QR code" className="w-full h-full" />
              ) : (
                <span className="text-asphalt text-[10px] text-center leading-tight">
                  QR shown at booking time
                </span>
              )}
            </div>
            <div>
              <div className="text-barrier-yellow text-[11px] font-bold uppercase tracking-wider">Slot</div>
              <div className="font-mono text-3xl font-bold my-1">{activeBooking.slot?.slotNumber}</div>
              <div className="text-white/60 text-sm">
                {activeBooking.mall?.name} · {activeBooking.vehicleNumber}
              </div>
              <div className="mt-2.5">
                <StatusPill status={activeBooking.status} />
              </div>
            </div>
          </div>

          {activeBooking.status === 'booked' && (
            <button className="btn btn-outline btn-sm mt-4" onClick={() => cancel(activeBooking._id)}>
              <TicketX className="w-3.5 h-3.5" /> Cancel booking
            </button>
          )}
          {!lastQr && (
            <p className="text-xs text-steel mt-3">
              The QR image is only returned once, at booking time. Show it to the gate guard, or ask them to look up
              your slot number if you've lost it.
            </p>
          )}
        </div>
      ) : (
        <div className="card mb-6">
          <h3 className="text-base mb-4">Book a slot</h3>
          <form onSubmit={book}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Mall</label>
                <select required className="field-input" value={selectedMall} onChange={(e) => setSelectedMall(e.target.value)}>
                  <option value="">Select a mall…</option>
                  {malls.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Vehicle number</label>
                <input
                  required
                  className="field-input"
                  placeholder="e.g. UP32 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-primary mt-5" disabled={loading || !malls.length}>
              <CarFront className="w-4 h-4" />
              {loading ? 'Booking…' : 'Auto-allocate a slot'}
            </button>
            {!malls.length && (
              <p className="text-xs text-steel mt-3">No approved malls are available yet.</p>
            )}
          </form>
        </div>
      )}

      <h3 className="text-base mt-8 mb-3">Booking history</h3>
      <div className="card overflow-x-auto">
        {bookings.length === 0 ? (
          <div className="text-center py-10 text-steel text-sm">No bookings yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Mall</th>
                <th>Slot</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.mall?.name}</td>
                  <td className="font-mono">{b.slot?.slotNumber}</td>
                  <td className="font-mono">{b.vehicleNumber}</td>
                  <td>
                    <StatusPill status={b.status} />
                  </td>
                  <td>{b.amount ? `₹${b.amount}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
