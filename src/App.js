import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import MapComponent from "./components/map.component";
import LoginPage from "./Pages/LoginPage";

// Dummy authentication check (replace with actual logic)
const isAuthenticated = () => {
  return localStorage.getItem("user") !== null; // Replace with proper auth check
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />
        {/* Protected Map Route */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <div className="App">
                <h1>React Google Maps - DrawingManager</h1>
                <MapComponent />
              </div>
            </ProtectedRoute>
          }
        />
        {/* Default Route */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
