import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Topic from "./pages/Topic";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topic/:id" element={<Topic />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
