import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Usar o token como dependência para forçar a revalidação quando mudar
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Resetar estados quando o token mudar
    setIsLoading(true);
    setIsAuthenticated(null);
    setUserRole(null);
    
    if (token) {
      axios
        .get('/api/authenticated', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(response => {
          setIsAuthenticated(response.data.isAuthenticated);
          setUserRole(response.data.role);
          setIsLoading(false);
        })
        .catch(() => {
          // Em caso de erro, limpar o token e redirecionar para login
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setIsLoading(false);
        });
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [token]); // Adicionar token como dependência para revalidar quando mudar

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Verificar se a rota é apenas para admin
  if (adminOnly && userRole !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;
