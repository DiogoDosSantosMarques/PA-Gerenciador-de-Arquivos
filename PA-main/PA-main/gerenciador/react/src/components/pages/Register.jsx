import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, Lock, Shield, User, Award, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  //Validações
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // No minímo 8 characters, Um maísculo, um minúsculo, e um número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

  
    if (!name || !email || !password || !confirmPassword) {
      setError('Todos os campos devem ser preenchidos.');
      return;
    }

    if (name.trim().split(' ').length < 2) {
      setError('Por favor, insira seu nome completo.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!validatePassword(password)) {
      setError('A senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números.');
      return;
    }

    try {
      const response = await axios.post('/api/signup', {
        name: name.trim(),
        email,
        password,
      });

      setSuccess('Cadastro realizado com sucesso! Redirecionando para login...');
      
      // Redireciona para o login após sucesso
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(
        error.response 
          ? error.response.data.error || 'Erro ao realizar cadastro.'
          : 'Erro de conexão. Tente novamente mais tarde.'
      );
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (type) => {
    if (type === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-4xl flex shadow-2xl rounded-2xl overflow-hidden">
        {/* Informative Sidebar */}
        <div className="w-1/2 bg-green-600 text-white p-8 flex flex-col justify-center space-y-6">
          <div className="flex items-center space-x-4">
            <FileText className="w-12 h-12" />
            <p className="text-xl">Centralize seus documentos com segurança</p>
          </div>
          <div className="flex items-center space-x-4">
            <Shield className="w-12 h-12" />
            <p className="text-xl">Proteção avançada de informações</p>
          </div>
          <div className="flex items-center space-x-4">
            <Award className="w-12 h-12" />
            <p className="text-xl">Gestão completa de treinamentos</p>
          </div>
          <div className="mt-6 text-sm opacity-75">
            Sua plataforma de gestão corporativa inteligente
          </div>
        </div>

        {/* Registration Form */}
        <div className="w-1/2 bg-white p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="mr-3 text-green-600" /> Cadastro
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="name" 
                className="block text-gray-700 font-semibold mb-2"
              >
                Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Digite seu nome completo"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-gray-700 font-semibold mb-2"
              >
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Digite seu e-mail"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-gray-700 font-semibold mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crie uma senha forte"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, com maiúsculas, minúsculas e números
              </p>
            </div>

            <div>
              <label 
                htmlFor="confirm-password" 
                className="block text-gray-700 font-semibold mb-2"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repita a senha"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 transform hover:scale-105"
              >
                Cadastrar
              </button>
              <Link 
                to="/login" 
                className="text-sm text-green-600 hover:text-green-800 transition duration-300"
              >
                Já tem conta? Faça login
              </Link>
            </div>
          </form>

          {error && (
            <div className="mt-4 text-red-600 text-sm border border-red-400 bg-red-100 p-3 rounded-lg flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mt-4 text-green-600 text-sm border border-green-400 bg-green-100 p-3 rounded-lg flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;