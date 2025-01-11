import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import App from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import { Toaster } from "react-hot-toast";
import EditorPage from "./pages/EditorPage.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/editor/:roomId" element={<EditorPage />} />
    </>
  )
);

createRoot(document.getElementById("root")).render(
  <>
    <Toaster position="top-right" />
    <RouterProvider router={router} />
  </>
);
