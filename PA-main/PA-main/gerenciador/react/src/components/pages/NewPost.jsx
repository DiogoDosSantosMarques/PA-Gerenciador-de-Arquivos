import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, File, FileText, Trash2, Check, Loader2, Tag, X,
  FileImage, FileVideo, FileAudio, AlertCircle
} from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Fecha o modal ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target) && !loading) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, loading]);

  // Busca as categorias na API
  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/categories');
        setCategories(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setMessage({ 
          type: 'error', 
          text: 'Não foi possível carregar as categorias' 
        });
        setIsLoading(false);
      }
    }
    
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Reset do formulário ao fechar
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setCaption('');
      setCategoryId('');
      setMessage({ type: '', text: '' });
      setUploadProgress(0);
    }
  }, [isOpen]);

  const submit = async (event) => {
    event.preventDefault();

    //Verifica autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'Você precisa de autenticação para fazer isso' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', caption);
    formData.append('categoryId', categoryId);

    setLoading(true);
    setUploadProgress(0);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setMessage({ type: 'success', text: 'Arquivo enviado com sucesso!' });
      setFile(null);
      setCaption('');
      setCategoryId('');
      setUploadProgress(100);
      
      // Notifica o componente pai sobre o sucesso
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Erro ao fazer Upload.' });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
      }, 1500);
    }
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categorySelected = (event) => {
    const selectedCategoryId = event.target.value;
    setCategoryId(selectedCategoryId);
  };

  // Função para determinar o ícone baseado no tipo MIME do arquivo
  const getFileIcon = (file) => {
    if (!file) return File;
    
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return FileImage;
    if (type.includes('video')) return FileVideo;
    if (type.includes('audio')) return FileAudio;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('xlsx') || type.includes('xls')) return FileText;
    if (type.includes('zip') || type.includes('compressed') || type.includes('archive')) return File;
    if (type.includes('text') || type.includes('document') || type.includes('doc')) return FileText;
    
    return File;
  };

  // Função para obter a cor do ícone baseada no tipo
  const getIconColor = (file) => {
    if (!file) return 'text-gray-400';
    
    const type = file.type.toLowerCase();
    
    if (type.includes('pdf')) return 'text-red-500';
    if (type.includes('image')) return 'text-blue-500';
    if (type.includes('video')) return 'text-purple-500';
    if (type.includes('audio')) return 'text-green-500';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'text-emerald-500';
    if (type.includes('zip') || type.includes('compressed')) return 'text-amber-500';
    if (type.includes('text') || type.includes('document')) return 'text-indigo-500';
    
    return 'text-gray-500';
  };

  const FileIconComponent = file ? getFileIcon(file) : File;
  const iconColorClass = getIconColor(file);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform transition-all duration-500 animate-slideUp"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Upload de arquivos</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-gray-100 transform hover:rotate-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={submit} className="space-y-6">
          <p className="text-sm text-gray-600">Compartilhe seus documentos facilmente</p>

          {message.text && (
            <div
              className={`p-4 text-sm rounded-xl flex items-start space-x-3 animate-slideDown ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-indigo-700 font-medium">
                <span>Enviando arquivo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              id="file"
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="file"
              className={`
                flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
                ${dragging 
                  ? 'border-indigo-500 bg-indigo-50 shadow-inner' 
                  : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-start w-full animate-fadeIn">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mr-4 shadow-sm">
                    <FileIconComponent className={`h-10 w-10 ${iconColorClass}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {file.type || 'Tipo desconhecido'} | {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="mt-3 flex">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          clearFile();
                        }} 
                        className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg flex items-center hover:bg-red-100 transition-colors shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 py-6 animate-fadeIn">
                  <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full shadow-inner">
                    <Upload className="h-10 w-10 text-indigo-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-medium text-gray-700">
                      Arraste e solte o arquivo aqui
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      ou <span className="text-indigo-500 font-medium">selecione um arquivo</span> do seu computador
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-indigo-50 rounded-lg text-xs text-gray-500 flex flex-wrap justify-center gap-2">
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm">PDF</span>
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm">DOC</span>
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm">XLS</span>
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm">IMAGENS</span>
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm">ÁUDIO</span>
                    <span className="px-2 py-1 bg-white rounded-md shadow-sm">VÍDEO</span>
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-1.5 group">
            <label className="text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
              <FileText className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              Descrição
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              type="text"
              placeholder="Descrição do arquivo (opcional)"
              className="w-full p-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200 group-hover:border-indigo-200"
            />
          </div>

          <div className="space-y-1.5 group">
            <label className="text-sm font-medium text-gray-700 flex items-center group-hover:text-indigo-600 transition-colors">
              <Tag className="w-4 h-4 mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              Categoria
            </label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={categorySelected}
                required
                className="w-full p-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-200 group-hover:border-indigo-200 appearance-none text-gray-700"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`
              group relative w-full p-3.5 rounded-xl text-white font-medium transition-all duration-300
              ${loading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-200/50 transform hover:-translate-y-1'
              } flex items-center justify-center space-x-2
            `}
            disabled={loading || !file || !categoryId}
          >
            <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 group-hover:blur-sm transition-all duration-300 rounded-xl"></span>
            <span className="relative flex items-center justify-center">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Fazer Upload</span>
                </>
              )}
            </span>
          </button>
        </form>
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-indigo-800 font-medium">Carregando categorias...</p>
            </div>
          </div>
        )}
      </div>
      
      
    </div>
  );
}
