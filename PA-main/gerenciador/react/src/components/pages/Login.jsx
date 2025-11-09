import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Lock, Shield, User, Award, Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  // Efeito para alternar automaticamente o destaque dos recursos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // Validações
    if (!email || !password) {
      setError('Todos os campos devem ser preenchidos.');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        email,
        password,
      });

      const { token } = response.data;

      localStorage.setItem('token', token);

      setSuccess('Login realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setError(
        error.response 
          ? error.response.data.error || 'Erro ao realizar o login. Verifique suas credenciais.'
          : 'Erro de conexão. Tente novamente mais tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    {
      icon: FileText,
      title: "Gerencie documentos com precisão",
      color: "from-blue-400 to-blue-600"
    },
    {
      icon: Shield,
      title: "Controle de licenças simplificado",
      color: "from-indigo-400 to-indigo-600"
    },
    {
      icon: Award,
      title: "Acompanhamento de treinamentos",
      color: "from-purple-400 to-purple-600"
    }
  ];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradientBackground">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="w-full max-w-5xl flex shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm animate-fadeIn m-4">
        {/* Sidebar informativo com design moderno */}
        <div className="w-0 md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 flex flex-col justify-center space-y-8 relative overflow-hidden">
          {/* Padrão decorativo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute rounded-full bg-white" 
                  style={{
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.3
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-8 tracking-tight">Sistema de Gestão Corporativa</h1>
            
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              const isActive = activeFeature === index;
              
              return (
                <div 
                  key={index} 
                  className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-500 ${
                    isActive ? 'bg-white/10 transform scale-105' : 'opacity-70'
                  }`}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <p className="text-xl font-medium">{feature.title}</p>
                </div>
              );
            })}
            
            <div className="mt-12 text-sm opacity-75 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              Seu sistema centralizado para gerenciamento eficiente de recursos corporativos
            </div>
          </div>
        </div>

        {/* Formulário de Login com design moderno */}
        <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-bl-full opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <LogIn className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Bem-vindo</h2>
            </div>
            
            <p className="text-gray-600 mb-8">Entre com suas credenciais para acessar o sistema</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="group">
                <label 
                  htmlFor="email" 
                  className="block text-gray-700 font-medium mb-2 group-hover:text-indigo-600 transition-colors"
                >
                  E-mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-200"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Digite seu e-mail"
                  />
                  <div className="absolute left-0 top-0 h-full flex items-center justify-center w-12 text-gray-400 group-hover:text-indigo-500 transition-colors">
                    <User className="h-5 w-5" />
                  </div>
                </div>
              </div>
              
              <div className="group">
                <label 
                  htmlFor="password" 
                  className="block text-gray-700 font-medium mb-2 group-hover:text-indigo-600 transition-colors"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-200"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                  />
                  <div className="absolute left-0 top-0 h-full flex items-center justify-center w-12 text-gray-400 group-hover:text-indigo-500 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 group-hover:blur-sm transition-all duration-300 rounded-xl"></span>
                  <span className="relative flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Entrando...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Entrar
                      </>
                    )}
                  </span>
                </button>
                <Link 
                  to="/register" 
                  className="text-indigo-600 hover:text-indigo-800 transition duration-300 font-medium text-center sm:text-right hover:underline"
                >
                  Não tem conta? Cadastre-se agora
                </Link>
              </div>
            </form>

            {error && (
              <div className="mt-6 text-red-600 text-sm border border-red-200 bg-red-50 p-4 rounded-xl flex items-start space-x-3 animate-slideDown">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mt-6 text-green-600 text-sm border border-green-200 bg-green-50 p-4 rounded-xl flex items-start space-x-3 animate-slideDown">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
