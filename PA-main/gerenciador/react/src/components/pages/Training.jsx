import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Plus, FileText, BookOpen, Tag, Link as LinkIcon, X, File, List, CheckCircle, AlertCircle } from 'lucide-react';

const Training = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [trainingLinks, setTrainingLinks] = useState(['']);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'Você precisa estar autenticado para acessar esta página.' });
      return;
    }

    setIsLoading(true);
    axios.get('/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => {
        setCategories(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        setMessage({ 
          type: 'error', 
          text: 'Não foi possível carregar as categorias' 
        });
        setIsLoading(false);
      });
  }, []);

  const handleAddLink = () => {
    setTrainingLinks([...trainingLinks, '']);
  };

  const handleRemoveLink = (indexToRemove) => {
    setTrainingLinks(trainingLinks.filter((_, index) => index !== indexToRemove));
  };

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...trainingLinks];
    updatedLinks[index] = value;
    setTrainingLinks(updatedLinks);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      setMessage({ 
        type: 'error', 
        text: 'O arquivo deve ser menor que 50MB' 
      });
      event.target.value = null;
      return;
    }
    
    setFile(selectedFile);
    setMessage({ type: '', text: '' });
  };

  const clearFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'Você precisa estar autenticado para realizar esta ação.' });
      return;
    }

    if (!title || !description || !categoryId) {
      setMessage({ type: 'error', text: 'Título, descrição e categoria são obrigatórios.' });
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('categoryId', categoryId);
    
    trainingLinks.forEach((link, index) => {
      if (link.trim()) {
        formData.append(`links[${index}]`, link);
      }
    });

    if (file) {
      formData.append('file', file);
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post('/api/trainings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage({ type: 'success', text: 'Treinamento registrado com sucesso!' });
      
      setTitle('');
      setDescription('');
      setCategoryId('');
      setTrainingLinks(['']);
      setFile(null);
    } catch (error) {
      console.error('Erro ao registrar treinamento:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao registrar treinamento.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrainings = () => {
    navigate('/trainingList');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Background decorativo */}
      <div className="absolute top-20 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50 to-transparent -z-10"></div>
      <div className="absolute top-40 left-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden relative backdrop-blur-sm">
        {/* Cabeçalho com gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Registrar Treinamento</h2>
          </div>
          <button
            type="button"
            onClick={handleViewTrainings}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm h-10 px-4 py-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
          >
            <List className="w-4 h-4 mr-2" />
            Ver Treinamentos
          </button>
        </div>

        <div className="p-8">
          {message.text && (
            <div
              className={`
                p-4 mb-6 rounded-xl text-sm flex items-start space-x-3 animate-slideDown
                ${message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'}
              `}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center p-16 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Carregando categorias...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
                  <FileText className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-indigo-300"
                  placeholder="Digite o título do treinamento"
                  required
                />
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
                  <FileText className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[140px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-indigo-300"
                  placeholder="Descrição detalhada do treinamento"
                  required
                ></textarea>
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
                  <Tag className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  Categoria
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all duration-200 hover:border-indigo-300"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3 group">
                <label className="block text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
                  <LinkIcon className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  Links de Material
                </label>
                {trainingLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-indigo-300"
                      placeholder="https://"
                    />
                    {trainingLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-red-200 bg-red-50 hover:bg-red-100 h-11 w-11 p-0 transform hover:scale-105"
                      >
                        <X className="w-5 h-5 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:pointer-events-none disabled:opacity-50 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 h-10 px-4 transform hover:translate-x-1"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adicionar outro link
                </button>
              </div>

              <div className="space-y-2 group">
                <label className="block text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
                  <Upload className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                  Arquivo (opcional)
                </label>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <div className="relative group">
                    <input
                      type="file"
                      accept="*"
                      onChange={handleFileChange}
                      className="flex h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-indigo-600 hover:file:text-indigo-700 transition-all duration-200 hover:border-indigo-300 cursor-pointer"
                    />
                    <div className="absolute inset-0 rounded-xl border-2 border-dashed border-indigo-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                  </div>
                  {file && (
                    <div className="flex items-center space-x-3 mt-2 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-fadeIn">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <File className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button 
                        type="button"
                        onClick={clearFile} 
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    group relative w-full py-3 px-6 rounded-xl text-white font-semibold transition-all duration-300 
                    ${loading 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-1'}
                  `}
                >
                  <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 group-hover:blur-sm transition-all duration-300 rounded-xl"></span>
                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : 'Registrar Treinamento'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Training;