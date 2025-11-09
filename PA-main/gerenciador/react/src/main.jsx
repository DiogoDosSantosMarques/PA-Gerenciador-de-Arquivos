import React from 'react'
import ReactDOM from 'react-dom/client'

import Home from './components/pages/Home'
import NewPost from './components/pages/NewPost'
import Login from './components/pages/Login'
import Register from './components/pages/Register'
import ToolsAndLicenses from './components/pages/ToolsAndLicenses'
import Training from './components/pages/Training'
import TrainingList from './components/pages/TrainingList'
import AdminPanel from './components/pages/AdminPanel'

import axios from 'axios';

import Layout from './Layout'
import ProtectedRoute from './components/ProtectedRoute'

import './index.css'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // Pega o token do LocalStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Adiciona o token no cabeçalho
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="newPost"
            element={
              <ProtectedRoute>
                <NewPost />
              </ProtectedRoute>
            }
          />
          <Route
            path="tools"
            element={
              <ProtectedRoute>
                <ToolsAndLicenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="training"
            element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="trainingList"
            element={
              <ProtectedRoute>
                <TrainingList />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  </React.StrictMode>
);
