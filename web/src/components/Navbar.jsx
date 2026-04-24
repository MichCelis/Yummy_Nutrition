import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/foods", label: "Alimentos", icon: "🥗" },
    { path: "/recipes", label: "Recetas", icon: "🍽️" },
    { path: "/history", label: "Historial", icon: "📅" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-600">
              🥗 YummyNutrition
            </Link>

            <div className="hidden md:flex gap-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive(link.path)
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-gray-600">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="text-sm bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-700 px-3 py-2 rounded-lg transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Links móviles */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                isActive(link.path)
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}