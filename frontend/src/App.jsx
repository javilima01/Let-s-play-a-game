import { BrowserRouter, Routes, Route } from "react-router-dom";
import TopBarTicker from "@/components/TopBarTicker";
import GameStartPage from "@/pages/GameStartPage";
export default function App() {
  return (
    <BrowserRouter>
      <TopBarTicker />
      <Routes>
        <Route path="/" element={<GameStartPage />} />
      </Routes>
    </BrowserRouter>
  );
}
