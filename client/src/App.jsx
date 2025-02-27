import React from "react";
import { Routes, Route, BrowserRouter, Outlet } from "react-router-dom";

import { Toaster } from "react-hot-toast";
import GamePage from "./components/GamePage";

function App() {
  return (
    <div className="min-h-screen bg-game-bg bg-center">
      <Toaster
        position="top-center"
        toastOptions={{

          duration: 5000, // Toast stays for 5 seconds
          success: {
            duration: 6000, // Success toast disappears in 3s
          },
          error: {
            duration: 8000, // Error toast disappears in 4s
          },
        }}
        reverseOrder={false}
        gutter={8} // Space between toasts
        containerStyle={{
          top: 50, // Adjust top spacing
        }}
      />
      <Outlet/>

    </div>
  );
}

export default App;
