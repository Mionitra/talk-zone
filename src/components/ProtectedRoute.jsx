import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setLoading(false);
        return;
      }

      const token = await user.getIdTokenResult();
      setIsAdmin(token.claims.admin === true);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (!isAdmin) return <Navigate to="/login" />;

  return children;
}
