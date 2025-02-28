import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import Home, { HowToPlay } from './components/Home.jsx'
import GamePage from './components/GamePage.jsx'
import HumanGamePage from './components/Human.jsx'
import RookGamePage from './components/Rook.jsx'
import BishopGamePage from "./components/Bishop";
const router=createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App/>} >
      <Route path="/" element={<Home/>} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/game/human/:roomId" element={<HumanGamePage />} />
        <Route path="/game/rook/:roomId" element={<RookGamePage />} />
        <Route path="/game/bishop/:roomId" element={<BishopGamePage />} />
        <Route path='/rules' element={<HowToPlay/>}/>
    </Route>
    )
)
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
