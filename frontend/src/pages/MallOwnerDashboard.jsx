import { useEffect, useState } from 'react';
import { Building2, LayoutGrid, ShieldCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusPill from '../components/StatusPill';
import StatCard from '../components/StatCard';

const TABS = [
  { key: 'malls', label: 'My malls', icon: Building2 },
  { key: 'slots', label: 'Slots', icon: LayoutGrid },
  { key: 'guards', label: 'Guards', icon: ShieldCheck },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function MallOwnerDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState('malls');
  const [malls, setMalls] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    const res = await api.get('/malls/my', token);
    setMalls(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approvedMalls = malls.filter((m) => m.status === 'approved');

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl">Mall owner console</h1>
        <p className="text-steel text-sm mt-1.5">
          Submit malls for approval, provision slots, assign gate guards, and track performance.
        </p>
      </div>

      {error && <div className="banner-error mb-5">{error}</div>}
      {notice && <div className="banner-success mb-5">{notice}</div>}

      <div className="flex gap-1 mb-6 bg-[#e4e2da] p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab flex items-center gap-1.5 whitespace-nowrap ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'malls' && (
        <MyMalls malls={malls} token={token} reload={load} setError={setError} setNotice={setNotice} />
      )}
      {tab === 'slots' && (
        <SlotsPanel malls={approvedMalls} token={token} setError={setError} setNotice={setNotice} />
      )}
      {tab === 'guards' && (
        <GuardsPanel malls={approvedMalls} token={token} setError={setError} setNotice={setNotice} />
      )}
      {tab === 'analytics' && <AnalyticsPanel malls={approvedMalls} token={token} setError={setError} />}
    </div>
  );
}

function MyMalls({ malls, token, reload, setError, setNotice }) {
  const [form, setForm] = useState({ name: '', address: '', lat: '', lng: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/malls', form, token);
      setForm({ name: '', address: '', lat: '', lng: '' });
      setNotice('Mall submitted — waiting on admin approval.');
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card mb-5">
        <h3 className="text-base mb-4">Submit a new mall</h3>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Mall name</label>
              <input required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Address</label>
              <input required className="field-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary mt-5" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit for approval'}
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        {malls.length === 0 ? (
          <div className="text-center py-10 text-steel text-sm">No malls submitted yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Status</th>
                <th>Total slots</th>
              </tr>
            </thead>
            <tbody>
              {malls.map((m) => (
                <tr key={m._id}>
                  <td className="font-semibold">{m.name}</td>
                  <td className="text-steel">{m.address}</td>
                  <td><StatusPill status={m.status} /></td>
                  <td className="font-mono">{m.totalSlots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function SlotsPanel({ malls, token, setError, setNotice }) {
  const [mallId, setMallId] = useState('');
  const [form, setForm] = useState({ floor: 'Ground', count: 20, prefix: '' });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSlots = async (id) => {
    if (!id) return setSlots([]);
    const res = await api.get(`/malls/${id}/slots`, token);
    setSlots(res.data);
  };

  const generate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post(`/malls/${mallId}/slots/generate`, form, token);
      setNotice(`Generated ${form.count} slots.`);
      await loadSlots(mallId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!malls.length) {
    return <div className="card text-center py-10 text-steel text-sm">No approved malls yet — slots can only be added once a mall is approved.</div>;
  }

  return (
    <>
      <div className="card mb-5">
        <div className="mb-2">
          <label className="field-label">Mall</label>
          <select
            className="field-input"
            value={mallId}
            onChange={(e) => {
              setMallId(e.target.value);
              loadSlots(e.target.value);
            }}
          >
            <option value="">Select a mall…</option>
            {malls.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        {mallId && (
          <form onSubmit={generate} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="field-label">Floor label</label>
                <input className="field-input" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Count</label>
                <input
                  type="number"
                  min={1}
                  max={2000}
                  className="field-input"
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="field-label">Prefix (optional)</label>
                <input placeholder="e.g. P1-" className="field-input" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary mt-5" disabled={loading}>
              {loading ? 'Generating…' : 'Generate slots'}
            </button>
          </form>
        )}
      </div>

      {mallId && (
        <div className="card overflow-x-auto">
          {slots.length === 0 ? (
            <div className="text-center py-10 text-steel text-sm">No slots generated yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Floor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {slots.slice(0, 50).map((s) => (
                  <tr key={s._id}>
                    <td className="font-mono">{s.slotNumber}</td>
                    <td>{s.floor}</td>
                    <td><StatusPill status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {slots.length > 50 && (
            <p className="text-xs text-steel mt-3">Showing first 50 of {slots.length} slots.</p>
          )}
        </div>
      )}
    </>
  );
}

function GuardsPanel({ malls, token, setError, setNotice }) {
  const [mallId, setMallId] = useState('');
  const [guardId, setGuardId] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch(`/malls/${mallId}/assign-guard`, { guardId }, token);
      setNotice('Guard assigned to mall.');
      setGuardId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!malls.length) return <div className="card text-center py-10 text-steel text-sm">No approved malls yet.</div>;

  return (
    <div className="card">
      <h3 className="text-base mb-1.5">Assign a guard</h3>
      <p className="text-sm text-steel mb-5">
        Guard accounts are created by an admin. Enter the guard's user ID (shared by your admin) to post them to a
        mall's entry/exit gate.
      </p>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Mall</label>
            <select required className="field-input" value={mallId} onChange={(e) => setMallId(e.target.value)}>
              <option value="">Select a mall…</option>
              {malls.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Guard user ID</label>
            <input required className="field-input font-mono text-xs" value={guardId} onChange={(e) => setGuardId(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary mt-5" disabled={loading}>
          {loading ? 'Assigning…' : 'Assign guard'}
        </button>
      </form>
    </div>
  );
}

function AnalyticsPanel({ malls, token, setError }) {
  const [mallId, setMallId] = useState('');
  const [data, setData] = useState(null);

  const load = async (id) => {
    if (!id) return setData(null);
    try {
      const res = await api.get(`/dashboard/${id}`, token);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!malls.length) return <div className="card text-center py-10 text-steel text-sm">No approved malls yet.</div>;

  return (
    <>
      <div className="max-w-xs mb-6">
        <label className="field-label">Mall</label>
        <select
          className="field-input"
          value={mallId}
          onChange={(e) => {
            setMallId(e.target.value);
            load(e.target.value);
          }}
        >
          <option value="">Select a mall…</option>
          {malls.map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Available" value={data.slots.available} tone="green" />
            <StatCard label="Booked" value={data.slots.booked} tone="yellow" />
            <StatCard label="Occupied" value={data.slots.occupied} />
            <StatCard label="Disabled" value={data.slots.disabled} tone="red" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total revenue" value={`₹${data.revenue.totalRevenue}`} tone="green" />
            <StatCard label="Completed bookings" value={data.revenue.completedBookings} />
            <StatCard label="Avg. ticket" value={`₹${data.revenue.avgAmount}`} />
          </div>
        </>
      )}
    </>
  );
}
