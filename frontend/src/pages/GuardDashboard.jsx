import { useState } from 'react';
import { ScanLine, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import StatusPill from '../components/StatusPill';
import QRcodeScanner from "../components/QRcodeScanner";

function extractToken(raw) {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.token) return parsed.token;
  } catch {
    // not JSON — treat the raw input as the token itself
  }
  return trimmed;
}

export default function GuardDashboard() {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const scan = async (action) => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const qrToken = extractToken(input);
      const res = await api.post(`/bookings/${action}`, { qrToken }, token);
      setResult({ action, ...res.data });
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl md:text-3xl flex items-center gap-2.5">
          <ScanLine className="w-7 h-7 text-barrier-amber" /> Gate scanner
        </h1>
        <p className="text-steel text-sm mt-1.5">Scan or paste a booking QR payload to process entry or exit.</p>
      </div>

      {error && <div className="banner-error mb-5">{error}</div>}

      <label className="field-label">
QR Scanner
</label>

<QRCodeScanner
  onScanSuccess={(decodedText) => {
    console.log("Decoded QR:", decodedText);

    setInput(decodedText);
  }}
/>

<div className="mt-5">
  <label className="field-label">
    QR Payload
  </label>

  <textarea
    rows={3}
    className="field-input font-mono text-xs"
    value={input}
    onChange={(e) => setInput(e.target.value)}
  />


        <div className="flex flex-wrap gap-3 mt-4">
          <button className="btn btn-success" disabled={!input || loading} onClick={() => scan('entry')}>
            <LogIn className="w-4 h-4" />
            {loading ? 'Processing…' : 'Approve entry'}
          </button>
          <button className="btn btn-dark" disabled={!input || loading} onClick={() => scan('exit')}>
            <LogOut className="w-4 h-4" />
            {loading ? 'Processing…' : 'Process exit'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card mt-5 animate-rise">
          <h3 className="text-base mb-4">{result.action === 'entry' ? 'Entry approved' : 'Exit processed'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-steel">Vehicle</div>
              <div className="font-mono text-lg font-bold mt-1">{result.data.booking.vehicleNumber}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-steel">Status</div>
              <div className="mt-1.5">
                <StatusPill status={result.data.booking.status} />
              </div>
            </div>
          </div>
          {result.action === 'exit' && result.data.billing && (
            <div className="mt-5 pt-5 border-t border-concrete-line grid grid-cols-3 gap-4">
              <StatBlock label="Duration" value={`${result.data.billing.minutes} min`} />
              <StatBlock label="Rate / hr" value={`₹${result.data.billing.ratePerHour}`} />
              <StatBlock label="Amount due" value={`₹${result.data.billing.amount}`} highlight />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, highlight }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-steel">{label}</div>
      <div className={`font-mono text-lg font-bold mt-1 ${highlight ? 'text-signal-green' : ''}`}>{value}</div>
    </div>
  );
}
