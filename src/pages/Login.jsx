import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useState } from "react";
import { Mail, Lock, LogIn, Shield, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation vers /admin (à gérer avec votre router)
      window.location.href = "/admin";
    } catch (err) {
      console.error("Erreur de connexion:", err);
      
      // Messages d'erreur en français
      switch (err.code) {
        case "auth/invalid-email":
          setError("Adresse email invalide");
          break;
        case "auth/user-not-found":
          setError("Aucun compte trouvé avec cet email");
          break;
        case "auth/wrong-password":
          setError("Mot de passe incorrect");
          break;
        case "auth/too-many-requests":
          setError("Trop de tentatives. Réessayez plus tard");
          break;
        case "auth/invalid-credential":
          setError("Identifiants invalides");
          break;
        default:
          setError("Erreur de connexion. Veuillez réessayer");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Connexion Admin</h1>
          <p className="text-gray-500">Accédez à votre espace d'administration</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email && password) {
                      login(e);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-black border border-gray-800 rounded-lg pl-12 pr-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email && password) {
                      login(e);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-black border border-gray-800 rounded-lg pl-12 pr-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={login}
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-medium py-3 rounded-lg transition-all disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se connecter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Accès réservé aux administrateurs uniquement
        </p>
      </div>
    </div>
  );
}