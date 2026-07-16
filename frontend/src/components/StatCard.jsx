const toneMap = {
  green: 'text-signal-green',
  red: 'text-alert-red',
  yellow: 'text-[#8a6a00]',
};

export default function StatCard({ label, value, tone }) {
  return (
    <div className="card">
      <div className="text-[11px] font-bold uppercase tracking-wider text-steel">{label}</div>
      <div className={`font-display text-3xl font-extrabold mt-1.5 ${toneMap[tone] || 'text-asphalt'}`}>{value}</div>
    </div>
  );
}
