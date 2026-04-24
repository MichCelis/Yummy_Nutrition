import { useState } from "react";
import Navbar from "../components/Navbar";
import { foodService } from "../services/foodService";
import { logService } from "../services/logService";

export default function Foods() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await foodService.search(query.trim());
      setResults(response.data.foods || []);
      setSource(response.data.source);
    } catch (err) {
      console.error(err);
      setError("Error buscando alimentos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async (food) => {
    setSavingId(food.name);
    try {
      await logService.create({
        food: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
      });
      setToast(`✅ "${food.name}" registrado`);
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      console.error(err);
      setToast("❌ Error al registrar");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🥗 Buscar alimentos</h1>
          <p className="text-gray-500 mt-1">
            Encuentra información nutricional y registra lo que comiste
          </p>
        </header>

        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej. banana, chicken, rice..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold px-6 rounded-lg transition"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Info de fuente */}
        {source && results.length > 0 && (
          <div className="text-xs text-gray-400 mb-3">
            {source === "cache"
              ? "⚡ Resultados desde caché"
              : "🌐 Resultados desde USDA"}
            {" · "}
            {results.length} alimento{results.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-3">
          {results.map((food, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                    {food.name}
                </h3>

                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                    {food.brand && <span>🏷️ {food.brand}</span>}
                    {food.category && <span>· {food.category}</span>}
                    {food.servingSize && (
                    <span>· Porción: {food.servingSize}{food.servingUnit}</span>
                    )}
                </div>

                <div className="flex gap-2 mt-2 text-xs flex-wrap">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                    🔥 {Math.round(food.calories)} kcal
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    💪 {food.protein.toFixed(1)}g prot
                    </span>
                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded">
                    🌾 {food.carbs.toFixed(1)}g carb
                    </span>
                    <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded">
                    🥑 {food.fat.toFixed(1)}g grasa
                    </span>
                </div>
                </div>
              <button
                onClick={() => handleLog(food)}
                disabled={savingId === food.name}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                {savingId === food.name ? "Guardando..." : "+ Registrar"}
              </button>
            </div>
          ))}
        </div>

        {/* Estado vacío */}
        {!loading && results.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p>Busca un alimento para empezar</p>
            <p className="text-sm mt-1">Prueba: banana, rice, chicken, apple...</p>
          </div>
        )}
      </div>

      {/* Toast de confirmación */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}
    </div>
  );
}