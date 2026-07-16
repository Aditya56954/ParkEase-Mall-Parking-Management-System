import { useEffect, useState } from 'react';
import { ClipboardCheck, Users, Gauge } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusPill from '../components/StatusPill';
import StatCard from '../components/StatCard';

const TABS = [
  { key: 'approvals', label: 'Mall approvals', icon: ClipboardCheck },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'overview', label: 'Platform overview', icon: Gauge },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState('approvals');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl">Admin console</h1>
        <p className="text-steel text-sm mt-1.5">
          Review mall submissions, manage privileged accounts, and monitor the platform.
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

      {tab === 'approvals' && <MallApprovals token={token} setError={setError} setNotice={setNotice} />}
      {tab === 'users' && <UsersPanel token={token} setError={setError} setNotice={setNotice} />}
      {tab === 'overview' && <OverviewPanel token={token} setError={setError} />}
    </div>
  );
}

function MallApprovals({ token, setError, setNotice }) {
  const [malls, setMalls] = useState([]);
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    const res = await api.get('/malls', token);
    setMalls(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id) => {
    setError('');
    try {
      await api.patch(`/malls/${id}/approve`, {}, token);
      setNotice('Mall approved.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const reject = async (id) => {
    setError('');
    try {
      await api.patch(`/malls/${id}/reject`, { reason }, token);
      setNotice('Mall rejected.');
      setReasonFor(null);
      setReason('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card overflow-x-auto">
      {malls.length === 0 ? (
        <div className="text-center py-10 text-steel text-sm">No malls submitted yet.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Mall</th>
              <th>Owner</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {malls.map((m) => (
              <tr key={m._id}>
                <td>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-steel">{m.address}</div>
                </td>
                <td>{m.owner?.name}</td>
                <td><StatusPill status={m.status} /></td>
                <td className="text-right">
                  {m.status === 'pending' && (
                    <div className="flex gap-2 justify-end items-center flex-wrap">
                      <button className="btn btn-success btn-sm" onClick={() => approve(m._id)}>Approve</button>
                      {reasonFor === m._id ? (
                        <>
                          <input
                            placeholder="Reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-36 px-2.5 py-1.5 rounded-lg border border-concrete-line text-sm focus:outline-none focus:border-barrier-yellow"
                          />
                          <button className="btn btn-danger btn-sm" onClick={() => reject(m._id)}>Confirm</button>
                        </>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={() => setReasonFor(m._id)}>Reject</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UsersPanel({ token, setError, setNotice }) {
  const [users, setUsers] = useState([]);
  const [malls, setMalls] = useState([]);
const [selectedMall, setSelectedMall] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'guard' });
  const [loading, setLoading] = useState(false);

 const load = async () => {
  const [usersRes, mallsRes] = await Promise.all([
    api.get('/admin/users', token),
    api.get('/malls', token),
  ]);

  setUsers(usersRes.data);

  setMalls(
    mallsRes.data.filter((mall) => mall.status === "approved")
  );
};

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/admin/users', form, token);
      setNotice(`${form.role} account created.`);
      setForm({ name: '', email: '', password: '', role: 'guard' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async (id) => {
    setError('');
    try {
      await api.patch(`/admin/users/${id}/deactivate`, {}, token);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };
  const assignGuard = async (guardId) => {
  if (!selectedMall[guardId]) return;

  setError("");

  try {
    await api.patch(
      `/admin/guards/${guardId}/assign`,
      {
        mallId: selectedMall[guardId],
      },
      token
    );

    setNotice("Guard assigned successfully.");

    await load();
  } catch (err) {
    setError(err.message);
  }
};

  return (
    <>
      <div className="card mb-5">
        <h3 className="text-base mb-4">Create a privileged account</h3>
        <form onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="field-label">Name</label>
              <input required className="field-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input type="email" required className="field-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input type="password" required minLength={6} className="field-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="field-label">Role</label>
              <select className="field-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="guard">Guard</option>
                <option value="admin">Admin</option>
                <option value="mallOwner">Mall owner</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary mt-5" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Mall</th>
              <th>Status</th>
              <th>ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td className="font-semibold">{u.name}</td>
                <td className="text-steel">{u.email}</td>
                <td>
                  <span className="rounded-full border border-concrete-line px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                    {u.role}
                  </span>
                </td>
                <td>
  {u.role === "guard"
    ? (u.assignedMall?.name || "Not Assigned")
    : "-"}
</td>
                <td>
  {u.isActive ? (
    <StatusPill status="approved" />
  ) : (
    <StatusPill status="rejected" />
  )}
</td>

<td className="font-mono text-[11px] text-steel">
  {u._id}
</td>

<td className="text-right">
  {u.role === "guard" ? (
    <div className="flex items-center gap-2 justify-end">
      <select
        className="field-input w-44"
        value={selectedMall[u._id] || ""}
        onChange={(e) =>
          setSelectedMall({
            ...selectedMall,
            [u._id]: e.target.value,
          })
        }
      >
        <option value="">Assign Mall</option>

        {malls.map((mall) => (
          <option key={mall._id} value={mall._id}>
            {mall.name}
          </option>
        ))}
      </select>

      <button
        className="btn btn-primary btn-sm"
        disabled={!selectedMall[u._id]}
        onClick={() => assignGuard(u._id)}
      >
        Assign
      </button>
    </div>
  ) : (
    u.isActive && (
      <button
        className="btn btn-outline btn-sm"
        onClick={() => deactivate(u._id)}
      >
        Deactivate
      </button>
    )
  )}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OverviewPanel({ token, setError }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/dashboard/admin/overview', token);
        setData(res.data);
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;

  return (
    <>
      <h3 className="text-base mb-3">Malls</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <StatCard label="Pending" value={data.malls.pending || 0} tone="yellow" />
        <StatCard label="Approved" value={data.malls.approved || 0} tone="green" />
        <StatCard label="Rejected" value={data.malls.rejected || 0} tone="red" />
      </div>

      <h3 className="text-base mb-3">Slots (platform-wide)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard label="Available" value={data.slots.available || 0} tone="green" />
        <StatCard label="Booked" value={data.slots.booked || 0} tone="yellow" />
        <StatCard label="Occupied" value={data.slots.occupied || 0} />
        <StatCard label="Disabled" value={data.slots.disabled || 0} tone="red" />
      </div>

      <h3 className="text-base mb-3">Revenue</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total revenue" value={`₹${data.revenue.totalRevenue}`} tone="green" />
        <StatCard label="Completed bookings" value={data.revenue.completedBookings} />
      </div>
    </>
  );
}
