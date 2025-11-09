import React, { useState, useEffect } from "react";
import { Trash2, Pencil, Plus, AlertCircle, Wrench, Calendar, User, FileText, SortAsc, SortDesc, Filter, Mail, Clock } from 'lucide-react';
import axios from "axios";

const ToolsAndLicenses = () => {
  const [tools, setTools] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    responsible: "",
    responsibleEmail: "",
    acquisitionDate: "",
    expirationDate: "",
  });
  const [filteredTools, setFilteredTools] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [filterConfig, setFilterConfig] = useState({
    responsible: '',
    usagePeriod: 'all',
    expirationStatus: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = () => {
    setIsLoading(true);
    axios.get("/api/tools")
      .then((response) => {
        setTools(response.data);
        setFilteredTools(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao carregar ferramentas:", error);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let filtered = [...tools];

    if (filterConfig.responsible) {
      filtered = filtered.filter(tool => 
        tool.responsible.toLowerCase().includes(filterConfig.responsible.toLowerCase())
      );
    }

    if (filterConfig.expirationStatus !== 'all') {
      const today = new Date();
      if (filterConfig.expirationStatus === 'expired') {
        filtered = filtered.filter(tool => new Date(tool.expirationDate) < today);
      } else if (filterConfig.expirationStatus === 'warning') {
        filtered = filtered.filter(tool => {
          const expDate = new Date(tool.expirationDate);
          const diffTime = expDate - today;
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays <= 30 && diffDays > 0;
        });
      } else if (filterConfig.expirationStatus === 'active') {
        filtered = filtered.filter(tool => {
          const expDate = new Date(tool.expirationDate);
          const diffTime = expDate - today;
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays > 30;
        });
      }
    }

    if (filterConfig.usagePeriod !== 'all') {
      filtered.sort((a, b) => {
        const periodA = new Date(a.expirationDate) - new Date(a.acquisitionDate);
        const periodB = new Date(b.expirationDate) - new Date(b.acquisitionDate);
        return filterConfig.usagePeriod === 'longest' ? periodB - periodA : periodA - periodB;
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'acquisitionDate' || sortConfig.key === 'expirationDate') {
          return sortConfig.direction === 'asc' 
            ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
            : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
        }
        return sortConfig.direction === 'asc'
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key]);
      });
    }

    setFilteredTools(filtered);
  }, [tools, sortConfig, filterConfig]);

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const getExpirationStatus = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    if (diffDays <= 30 && diffDays > 7) {
      return 'notice';
    } else if (diffDays <= 7 && diffDays > 0) {
      return 'warning';
    } else if (diffDays <= 0) {
      return 'expired';
    }
    return 'active';
  };

  const getLastNotificationInfo = (tool) => {
    if (!tool.lastNotification) return "Nunca notificado";
    
    const lastNotif = new Date(tool.lastNotification);
    const today = new Date();
    const diffTime = Math.abs(today - lastNotif);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Notificado hoje";
    if (diffDays === 1) return "Notificado ontem";
    return `Notificado há ${diffDays} dias`;
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (new Date(formData.acquisitionDate) > new Date(formData.expirationDate)) {
      alert("A data de aquisição não pode ser posterior à data de expiração.");
      return;
    }
    
    if (!validateEmail(formData.responsibleEmail)) {
      alert("Por favor, insira um email válido.");
      return;
    }

    if (formData.id) {
      axios.put(`/api/tools/${formData.id}`, formData)
        .then(() => {
          setShowForm(false);
          setFormData({
            name: "",
            description: "",
            responsible: "",
            responsibleEmail: "",
            acquisitionDate: "",
            expirationDate: "",
          });
          fetchTools();
        })
        .catch((error) => console.error("Erro ao atualizar ferramenta:", error));
    } else {
      axios.post("/api/tools", formData)
        .then(() => {
          setShowForm(false);
          setFormData({
            name: "",
            description: "",
            responsible: "",
            responsibleEmail: "",
            acquisitionDate: "",
            expirationDate: "",
          });
          fetchTools();
        })
        .catch((error) => console.error("Erro ao adicionar ferramenta:", error));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza de que deseja excluir esta ferramenta?")) {
      axios.delete(`/api/tools/${id}`)
        .then(() => {
          fetchTools();
        })
        .catch((error) => console.error("Erro ao deletar ferramenta:", error));
    }
  };

  const handleEdit = (tool) => {
    setFormData({
      ...tool,
      acquisitionDate: new Date(tool.acquisitionDate).toISOString().split('T')[0],
      expirationDate: new Date(tool.expirationDate).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      {/* Header com efeito de glassmorphism */}
      <div className="relative mb-10 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600 opacity-5 rounded-3xl"></div>
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative flex justify-between items-center p-6 backdrop-blur-sm bg-white/70 rounded-3xl shadow-lg border border-white/20 mb-8 animate-fadeIn">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
              <Wrench className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
              Ferramentas e Licenças
            </h2>
          </div>
          <button
            className="group flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-indigo-200/50 transition-all duration-300 ease-out transform hover:-translate-y-1"
            onClick={() => setShowForm(!showForm)}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-0 group-hover:opacity-70 group-hover:blur-md transition-all duration-300"></span>
            <span className="relative flex items-center space-x-2">
              {showForm ? (
                <>
                  <Trash2 className="h-6 w-6" />
                  <span className="font-semibold">Cancelar</span>
                </>
              ) : (
                <>
                  <Plus className="h-6 w-6" />
                  <span className="font-semibold">Adicionar Ferramenta</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Formulário com animação de entrada/saída */}
      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl mb-8 border border-indigo-100 animate-slideDown">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
              {formData.id ? <Pencil className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              {formData.id ? "Editar Ferramenta" : "Nova Ferramenta"}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center space-x-3">
              <Pencil className="h-5 w-5 text-indigo-400" />
              <input
                type="text"
                name="name"
                placeholder="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200"
                required
              />
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-indigo-400" />
              <input
                type="text"
                name="description"
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200"
                required
              />
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-indigo-400" />
              <input
                type="text"
                name="responsible"
                placeholder="Responsável"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200"
                required
              />
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-indigo-400" />
              <input
                type="email"
                name="responsibleEmail"
                placeholder="Email do Responsável"
                value={formData.responsibleEmail}
                onChange={(e) => setFormData({ ...formData, responsibleEmail: e.target.value })}
                className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-indigo-400" />
                <input
                  type="date"
                  name="acquisitionDate"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200"
                  required
                />
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-indigo-400" />
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-green-200/50 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 group-hover:blur-sm transition-all duration-300"></span>
              <span className="relative flex items-center justify-center space-x-2">
                {formData.id ? (
                  <>
                    <Pencil className="h-5 w-5" />
                    <span className="font-semibold">Atualizar</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span className="font-semibold">Adicionar</span>
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* Seção de Filtros com design de cartão elevado */}
      <div className="bg-white p-6 rounded-3xl shadow-lg mb-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
            <Filter className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
              Filtrar por Responsável
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              <input
                type="text"
                className="w-full pl-10 p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-200"
                placeholder="Digite o nome do responsável"
                value={filterConfig.responsible}
                onChange={(e) => setFilterConfig(prev => ({
                  ...prev,
                  responsible: e.target.value
                }))}
              />
            </div>
          </div>
          
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
              Período de Uso
            </label>
            <select
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-200 appearance-none bg-white"
              value={filterConfig.usagePeriod}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                usagePeriod: e.target.value
              }))}
            >
              <option value="all">Todos</option>
              <option value="longest">Maior Período</option>
              <option value="shortest">Menor Período</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          
          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors">
              Status de Expiração
            </label>
            <select
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-indigo-200 appearance-none bg-white"
              value={filterConfig.expirationStatus}
              onChange={(e) => setFilterConfig(prev => ({
                ...prev,
                expirationStatus: e.target.value
              }))}
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="warning">Próximos de expirar</option>
              <option value="expired">Expirados</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de carregamento */}
      {isLoading ? (
        <div className="flex justify-center items-center p-16 bg-white rounded-3xl shadow-lg animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Carregando ferramentas...</p>
          </div>
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center bg-white p-16 rounded-3xl shadow-lg transform transition-all duration-300 hover:shadow-xl animate-fadeIn">
          <div className="p-6 bg-blue-50 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <Wrench className="h-20 w-20 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-4">Nenhuma ferramenta ou licença cadastrada</p>
          <p className="text-lg text-gray-600 mb-8">Adicione novas ferramentas ou licenças usando o botão acima</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-indigo-200/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Adicionar Agora</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-xl animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  {[
                    { key: 'name', label: 'Nome' },
                    { key: 'description', label: 'Descrição' },
                    { key: 'responsible', label: 'Responsável', sortable: true },
                    { key: 'responsibleEmail', label: 'Email' },
                    { key: 'acquisitionDate', label: 'Aquisição', sortable: true },
                    { key: 'expirationDate', label: 'Expiração', sortable: true },
                    { key: 'notificationStatus', label: 'Notificações' },
                    { key: 'actions', label: 'Ações', className: 'text-center' }
                  ].map(({ key, label, sortable = false, className }) => (
                    <th 
                      key={key} 
                      className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className || ''}`}
                    >
                      {sortable ? (
                        <button 
                          className="flex items-center space-x-2 hover:text-indigo-600 transition-colors group"
                          onClick={() => handleSort(key)}
                        >
                          <span className="group-hover:font-bold transition-all">{label}</span>
                          {sortConfig.key === key ? (
                            sortConfig.direction === 'asc' 
                              ? <SortAsc className="h-4 w-4 text-indigo-500" /> 
                              : <SortDesc className="h-4 w-4 text-indigo-500" />
                          ) : (
                            <span className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <SortAsc className="h-4 w-4 text-gray-400" />
                            </span>
                          )}
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTools.map((tool, index) => {
                  const expirationStatus = getExpirationStatus(tool.expirationDate);
                  return (
                    <tr 
                      key={tool.id} 
                      className={`hover:bg-blue-50 transition-all duration-200 animate-fadeIn ${
                        expirationStatus === 'expired' 
                          ? 'bg-red-50 text-red-800 hover:bg-red-100' 
                          : expirationStatus === 'warning' 
                          ? 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100' 
                          : expirationStatus === 'notice'
                          ? 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                          : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tool.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tool.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tool.responsible}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tool.responsibleEmail}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(tool.acquisitionDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span>{formatDate(tool.expirationDate)}</span>
                          {expirationStatus === 'notice' && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              Expira em breve
                            </span>
                          )}
                          {expirationStatus === 'warning' && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full animate-pulse">
                              &lt; 7 dias!
                            </span>
                          )}
                          {expirationStatus === 'expired' && (
                            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Expirado!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-indigo-400" />
                          <span>{getLastNotificationInfo(tool)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-3">
                          {(expirationStatus === 'warning' || expirationStatus === 'notice') && (
                            <div className="relative group" title="Notificações automáticas ativadas">
                              <Mail className="h-5 w-5 text-blue-500" />
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full group-hover:animate-ping"></div>
                              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                          <button
                            onClick={() => handleEdit(tool)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 p-2 rounded-full hover:bg-blue-50 transform hover:scale-110"
                            title="Editar"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tool.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 p-2 rounded-full hover:bg-red-50 transform hover:scale-110"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <div className="p-1 bg-blue-100 rounded-full mr-2">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <span>
                Notificações automáticas são enviadas quando uma ferramenta ou licença está a 30/15 dias ou menos de uma semana de expirar.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsAndLicenses;
