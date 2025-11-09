import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SinglePost from '../SinglePost'
import { FolderPlus, FileQuestion, Loader2, Filter, X, Search, RefreshCw } from 'lucide-react'
import UploadModal from './NewPost'  // Importamos o componente de modal

function App() {  
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)  // Estado para controlar o modal
  const [refreshing, setRefreshing] = useState(false)

  let navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  // Função para buscar dados
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [postsResponse, categoriesResponse] = await Promise.all([
        axios.get("/api/posts"),
        axios.get("/api/categories")
      ])

      //Garantir que todas campos obrigatórios estejam preenchidos
      const processedPosts = postsResponse.data.map(post => ({
        ...post,
        fileType: post.fileType || 'application/octet-stream',
        originalFileName: post.originalFileName || 'Unnamed File',
        caption: post.caption || ''
      }))

      setPosts(processedPosts)
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error("Erro ao carregar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  const editPostClicked = ({id}) => {
    navigate("/editPost/" + id)
  }

  const deletePostClicked = async ({ id }) => {
    try {
      await axios.delete(`/api/posts/${id}`)
      setPosts(posts.filter(post => post.id !== id))
    } catch (error) {
      console.error(error.response?.data || error.message)
      alert("Não foi possível deletar. verifique sua autenticação.")
    }
  }
  
  const downloadFile = async ({id}) => {
    try {
      const response = await axios.get(`/api/posts/${id}/download`)
      
      // Cria uma âncora para iniciar o download do arquivo.
      const a = document.createElement('a')
      a.href = response.data.url
      a.download = response.data.originalFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error(error)
      alert("Erro ao baixar arquivo")
    }
  }

  // Abre o modal de upload
  const openUploadModal = () => {
    setIsUploadModalOpen(true)
  }

  // Fecha o modal de upload
  const closeUploadModal = () => {
    setIsUploadModalOpen(false)
  }

  // Atualiza a lista após um upload bem-sucedido
  const handleUploadSuccess = () => {
    closeUploadModal()
    fetchData()  // Recarrega a lista de documentos
  }

  const postActions = {
    editPostClicked,
    deletePostClicked,
    downloadFile
  }

  // Documentos Filtrados
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.originalFileName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryFilter
      ? post.categoryId === Number(categoryFilter)
      : true;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6 animate-fadeIn">
          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-full shadow-xl">
            <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-8 py-4 rounded-xl shadow-lg">
            <p className="text-indigo-800 font-medium text-lg">Carregando documentos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Estilos para animações */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          
          @keyframes gradientBackground {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.8s ease-out forwards;
          }
          
          .animate-slideDown {
            animation: slideDown 0.5s ease-out forwards;
          }
          
          .animate-blob {
            animation: blob 7s infinite alternate;
          }
          
          .animate-gradientBackground {
            background-size: 300% 300%;
            animation: gradientBackground 15s ease infinite;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradientBackground pb-16">
        {/* Elementos decorativos de fundo */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Modal de Upload */}
        <UploadModal 
          isOpen={isUploadModalOpen} 
          onClose={closeUploadModal} 
          onSuccess={handleUploadSuccess} 
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 animate-fadeIn">
            <div className="mb-6 sm:mb-0">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 mb-3">
                Gerenciar documentos
              </h1>
              <p className="text-gray-600 text-lg">
                Organize e acesse seus arquivos facilmente
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2.5 bg-white text-indigo-600 font-medium rounded-xl hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 shadow-md border border-indigo-100"
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                onClick={openUploadModal}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FolderPlus className="w-5 h-5 mr-2" />
                Novo documento
              </button>
            </div>
          </div>

          {/* Search e filtro de categoria */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-slideDown" style={{ animationDelay: '0.2s' }}>
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder="Buscar por nome do arquivo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-3.5 pl-12 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-md hover:border-indigo-200 group-hover:border-indigo-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
              </div>
            </div>
            <div className="relative min-w-[220px] group">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-3.5 pl-12 border-2 border-gray-200 rounded-xl w-full appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-md hover:border-indigo-200 group-hover:border-indigo-200"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-100 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-28 h-28 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <FileQuestion className="w-14 h-14 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {categoryFilter 
                  ? `Sem documentos na categoria ${categories.find(c => c.id === Number(categoryFilter))?.name}` 
                  : 'Sem documentos registrados'}
              </h2>
              <p className="text-gray-600 mb-10 max-w-md mx-auto">
                {categoryFilter 
                  ? 'Selecione outra categoria ou adicione novos documentos' 
                  : 'Comece adicionando seu primeiro arquivo ao sistema.'}
              </p>
              <button
                onClick={openUploadModal}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FolderPlus className="w-6 h-6 mr-3" />
                Adicionar novo arquivo
              </button>
            </div>
          ) : (
            <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              {categoryFilter && (
                <div className="mb-8 bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl shadow-md">
                  <p className="text-indigo-800 font-medium flex items-center">
                    <Filter className="h-5 w-5 mr-2" />
                    Mostrando arquivos na categoria: <span className="font-bold ml-1">{categories.find(c => c.id === Number(categoryFilter))?.name}</span>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post, index) => (
                  <div 
                    key={`post-${post.id}`}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:border-indigo-200 transform hover:-translate-y-1 animate-fadeIn"
                    style={{ animationDelay: `${index * 100 + 400}ms` }}
                  >
                    <div className="p-6">
                      <SinglePost 
                        post={post} 
                        category={categories.find(c => c.id === post.categoryId)?.name} 
                        deletePostClicked={deletePostClicked} 
                        downloadFile={downloadFile}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App