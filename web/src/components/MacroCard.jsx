export default function MacroCard({ label, value, unit, color, icon }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || colors.emerald}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">{value}</span>
        <span className="text-sm opacity-70">{unit}</span>
      </div>
    </div>
  );
}