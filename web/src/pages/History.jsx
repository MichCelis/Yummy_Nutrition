import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { logService } from "../services/logService";

export default function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logService.getAll();
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      setError("Error cargando el historial");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, foodName) => {
    if (!confirm(`¿Eliminar "${foodName}"?`)) return;

    setDeletingId(id);
    try {
      await logService.delete(id);
      setLogs(logs.filter((log) => log.id !== id));
      setToast(`✅ "${foodName}" eliminado`);
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      console.error(err);
      setToast("❌ Error al eliminar");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setDeletingId(null);
    }
  };

  // Agrupar logs por fecha
  const groupedByDate = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  // Totales globales
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + Number(log.calories || 0),
      protein: acc.protein + Number(log.protein || 0),
      carbs: acc.carbs + Number(log.carbs || 0),
      fat: acc.fat + Number(log.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📅 Historial</h1>
          <p className="text-gray-500 mt-1">
            Todas tus comidas registradas
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
            Cargando historial...
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p>Aún no has registrado comidas</p>
            <p className="text-sm mt-1">
              Ve a <span className="text-emerald-600 font-medium">Alimentos</span> para empezar
            </p>
          </div>
        ) : (
          <>
            {/* Resumen total */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
              <h2 className="text-sm font-medium opacity-80 mb-3">
                Total registrado ({logs.length} comidas)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs opacity-80">🔥 Calorías</p>
                  <p className="text-2xl font-bold">
                    {Math.round(totals.calories)}
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-80">💪 Proteína</p>
                  <p className="text-2xl font-bold">
                    {totals.protein.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-80">🌾 Carbos</p>
                  <p className="text-2xl font-bold">
                    {totals.carbs.toFixed(1)}g
                  </p>
                </div>
                <div>
                  <p className="text-xs opacity-80">🥑 Grasas</p>
                  <p className="text-2xl font-bold">
                    {totals.fat.toFixed(1)}g
                  </p>
                </div>
              </div>
            </div>

            {/* Logs agrupados por fecha */}
            {Object.entries(groupedByDate).map(([date, dayLogs]) => (
              <section key={date} className="mb-6">
                <h2 className="text-sm font-semibold text-gray-600 mb-2 capitalize">
                  {date}
                </h2>
                <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
                  {dayLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {log.food}
                        </p>
                        <div className="flex gap-2 mt-1 text-xs flex-wrap">
                          <span className="text-emerald-600">
                            🔥 {Math.round(log.calories)} kcal
                          </span>
                          <span className="text-blue-600">
                            💪 {Number(log.protein).toFixed(1)}g
                          </span>
                          <span className="text-amber-600">
                            🌾 {Number(log.carbs).toFixed(1)}g
                          </span>
                          <span className="text-rose-600">
                            🥑 {Number(log.fat).toFixed(1)}g
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(log.created_at).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(log.id, log.food)}
                        disabled={deletingId === log.id}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deletingId === log.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}