import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { statsService } from "../services/statsService";
import { logService } from "../services/logService";
import Navbar from "../components/Navbar";
import MacroCard from "../components/MacroCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Pedir stats y logs en paralelo
      const [statsRes, logsRes] = await Promise.all([
        statsService.getDaily(user.id),
        logService.getAll(),
      ]);

      setStats(statsRes.data);
      // Mostrar solo los 5 más recientes
      setRecentLogs(logsRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError("Error cargando datos. Revisa que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const hello = user?.name || user?.email?.split("@")[0] || "Usuario";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            👋 Hola, {hello}
          </h1>
          <p className="text-gray-500 mt-1">
            Aquí está tu resumen nutricional de hoy
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
            Cargando tus datos...
          </div>
        ) : (
          <>
            {/* Stats del día */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                📊 Totales de hoy
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MacroCard
                  label="Calorías"
                  value={stats?.todayCalories ?? 0}
                  unit="kcal"
                  color="emerald"
                  icon="🔥"
                />
                <MacroCard
                  label="Proteína"
                  value={stats?.todayProtein ?? 0}
                  unit="g"
                  color="blue"
                  icon="💪"
                />
                <MacroCard
                  label="Carbos"
                  value={stats?.todayCarbs ?? 0}
                  unit="g"
                  color="amber"
                  icon="🌾"
                />
                <MacroCard
                  label="Grasas"
                  value={stats?.todayFat ?? 0}
                  unit="g"
                  color="rose"
                  icon="🥑"
                />
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {stats?.mealsToday ?? 0} comidas registradas hoy
              </p>
            </section>

            {/* Últimos registros */}
            <section className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                🕒 Últimas comidas registradas
              </h2>

              {recentLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🍽️</div>
                  <p>No has registrado comidas todavía.</p>
                  <p className="text-sm mt-1">
                    Ve a <span className="text-emerald-600 font-medium">Alimentos</span> para empezar.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentLogs.map((log) => (
                    <li key={log.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{log.food}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleString("es-MX", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-600">
                          {Number(log.calories).toFixed(0)} kcal
                        </p>
                        <p className="text-xs text-gray-400">
                          P: {Number(log.protein).toFixed(1)}g · C: {Number(log.carbs).toFixed(1)}g · G: {Number(log.fat).toFixed(1)}g
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}