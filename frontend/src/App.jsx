// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBarTicker from "@/components/TopBarTicker";
import GameStartPage from "@/pages/GameStartPage";
import AdminDashboard from "@/pages/AdminDashboard";   // NEW

export default function App() {
  return (
    <BrowserRouter>
      <TopBarTicker />
      <Routes>
        <Route path="/" element={<GameStartPage />} />
        <Route path="/g/:gameId" element={<GameStartPage />} />
        <Route path="/admin" element={<AdminDashboard />} />   {/* NEW */}
      </Routes>
    </BrowserRouter>
  );
}
