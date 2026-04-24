import { useState } from "react";
import Navbar from "../components/Navbar";
import { recipeService } from "../services/recipeService";

export default function Recipes() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await recipeService.search(query.trim());
      setResults(response.data.recipes || []);
      setSource(response.data.source);
    } catch (err) {
      console.error(err);
      setError("Error buscando recetas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (recipe) => {
    setLoadingDetail(true);
    try {
      const response = await recipeService.getById(recipe.id);
      setSelected(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError("Error cargando el detalle");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => setSelected(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-xl">
              <div className="relative">
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="w-full h-64 object-cover"
                />
                <button
                  onClick={closeDetail}
                  className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selected.name}
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selected.category && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full">
                      {selected.category}
                    </span>
                  )}
                  {selected.area && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                      🌍 {selected.area}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-700 mb-2">
                  🧾 Ingredientes
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
                  {selected.ingredients?.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>

                <h3 className="font-semibold text-gray-700 mb-2">
                  👨‍🍳 Instrucciones
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed mb-4">
                  {selected.instructions}
                </p>

                {selected["youtube"] && (
                  <a
                    href={selected["youtube"]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                  >
                    ▶️ Ver video en YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Recetas</h1>
          <p className="text-gray-500 mt-1">
            Descubre recetas del mundo para inspirarte
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej. pasta, chicken, pizza..."
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

        {source && results.length > 0 && (
          <div className="text-xs text-gray-400 mb-3">
            {source === "cache" ? "⚡ Desde caché" : "🌐 Desde TheMealDB"}
            {" · "}
            {results.length} receta{results.length !== 1 ? "s" : ""}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => handleView(recipe)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition cursor-pointer overflow-hidden group"
            >
              <div className="aspect-video overflow-hidden bg-gray-100">
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[3rem]">
                  {recipe.name}
                </h3>
                <div className="flex gap-2 mt-2 text-xs">
                  {recipe.category && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                      {recipe.category}
                    </span>
                  )}
                  {recipe.area && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      🌍 {recipe.area}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {loadingDetail && (
          <div className="fixed inset-0 bg-black/30 z-20 flex items-center justify-center">
            <div className="bg-white rounded-lg px-6 py-4 shadow-lg">
              Cargando receta...
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p>Busca una receta para empezar</p>
            <p className="text-sm mt-1">Prueba: pasta, chicken, pizza, salad...</p>
          </div>
        )}
      </div>
    </div>
  );
}