import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Shield, UserPlus, UserMinus, User, Search, AlertCircle, CheckCircle, RefreshCw, Tag, Plus, Trash2 } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [catMessage, setCatMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/users');
      
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setError('Não foi possível carregar a lista de usuários. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    setCatMessage(null);
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCatMessage({ type: 'error', text: 'Não foi possível carregar categorias.' });
    } finally {
      setLoadingCategories(false);
    }
  };

  const createCategory = async () => {
    if (!catName.trim()) {
      setCatMessage({ type: 'error', text: 'Informe um nome para a categoria.' });
      return;
    }
    setCatMessage(null);
    try {
      const res = await api.post('/categories', { name: catName.trim() });
      setCategories((prev) => [...prev, res.data]);
      setCatName('');
      setCatMessage({ type: 'success', text: 'Categoria criada com sucesso.' });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      const msg = error.response?.data?.error || 'Não foi possível criar a categoria.';
      setCatMessage({ type: 'error', text: msg });
    }
  };

  const deleteCategory = async (id) => {
    const confirmDelete = window.confirm('Deseja remover esta categoria? Certifique-se de que não está em uso.');
    if (!confirmDelete) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setCatMessage({ type: 'success', text: 'Categoria removida.' });
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      const msg = error.response?.data?.error || 'Não foi possível remover a categoria.';
      setCatMessage({ type: 'error', text: msg });
    }
  };

  const promoteUser = async (userId) => {
    setActionInProgress(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.patch(`/users/${userId}/promote`, {});
      
      setSuccess('Usuário promovido a administrador com sucesso!');
      fetchUsers(); // Atualiza a lista de usuários
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      setError('Não foi possível promover o usuário. Verifique suas permissões.');
    } finally {
      setActionInProgress(false);
    }
  };

  const demoteUser = async (userId) => {
    setActionInProgress(true);
    setError(null);
    setSuccess(null);
    
    try {
      await api.patch(`/users/${userId}/demote`, {});
      
      setSuccess('Usuário rebaixado para usuário comum com sucesso!');
      fetchUsers(); // Atualiza a lista de usuários
    } catch (error) {
      console.error('Erro ao rebaixar usuário:', error);
      setError('Não foi possível rebaixar o usuário. Verifique suas permissões ou se está tentando rebaixar a si mesmo.');
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel de Administração</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Gerencie os usuários do sistema, promovendo-os a administradores ou rebaixando-os para usuários comuns.
          </p>
        </div>

        {/* Barra de pesquisa */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Buscar usuários por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Lista de usuários */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Usuários do Sistema</h2>
              <button 
                onClick={fetchUsers}
                disabled={loading || actionInProgress}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'Nenhum usuário encontrado com os termos de busca.' : 'Nenhum usuário cadastrado no sistema.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <li key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${user.role === 'ADMIN' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                        <User className={`h-5 w-5 ${user.role === 'ADMIN' ? 'text-indigo-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                      </span>
                      
                      {user.role === 'ADMIN' ? (
                        <button
                          onClick={() => demoteUser(user.id)}
                          disabled={actionInProgress}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <UserMinus className="h-4 w-4 mr-2 text-red-500" />
                          Rebaixar
                        </button>
                      ) : (
                        <button
                          onClick={() => promoteUser(user.id)}
                          disabled={actionInProgress}
                          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Promover
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Gerenciamento de categorias */}
        <div className="mt-10 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
            <Tag className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-medium text-gray-900">Categorias</h2>
          </div>

          <div className="p-6 space-y-4">
            {catMessage && (
              <div className={`p-3 rounded-md text-sm ${catMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {catMessage.text}
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={createCategory}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" /> Criar
              </button>
              <button
                onClick={fetchCategories}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingCategories ? 'animate-spin' : ''}`} /> Atualizar
              </button>
            </div>

            {loadingCategories ? (
              <p className="text-sm text-gray-500">Carregando categorias...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma categoria cadastrada.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {categories.map((cat) => (
                  <li key={cat.id} className="py-3 flex items-center justify-between">
                    <span className="text-gray-800">{cat.name}</span>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Remover categoria"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
