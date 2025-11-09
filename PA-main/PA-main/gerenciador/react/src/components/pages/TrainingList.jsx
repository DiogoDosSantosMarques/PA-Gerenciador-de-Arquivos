import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, BookOpen, Link as LinkIcon, Maximize2, X, Download, File, FileVideo, FileAudio, FileImage } from 'lucide-react';

const TrainingList = () => {
  const [trainings, setTrainings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedTraining, setSelectedTraining] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/trainings'),
      axios.get('/api/categories')
    ]).then(([trainingsResponse, categoriesResponse]) => {
      setTrainings(trainingsResponse.data);
      setCategories(categoriesResponse.data);
      setLoading(false);
    }).catch((error) => {
      console.error('Error fetching data:', error);
      setLoading(false);
    });
  }, []);

  const getFileIcon = (type) => {
    const fileIcons = {
      'image': FileImage,
      'video': FileVideo,
      'audio': FileAudio,
      'application/pdf': File,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': File,
      'application/vnd.ms-excel': File,
      'application/zip': File,
      'application/x-zip-compressed': File,
      'default': File
    };

    const iconComponent = Object.entries(fileIcons).find(([key]) => 
      type.includes(key)
    )?.[1] || fileIcons.default;

    return iconComponent;
  };

  const downloadFile = async (training) => {
    try {
      const response = await axios.get(`/api/trainings/${training.id}/download`);
      const { url, originalFileName } = response.data;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch = training.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = categoryFilter
      ? training.categoryId === Number(categoryFilter)
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-8">
        <BookOpen className="w-10 h-10 mr-4 text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-800">Lista de Treinamentos</h2>
      </div>

      <div className="mb-8 flex space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Buscar por título"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando treinamentos...</p>
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">Nenhum treinamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTrainings.map((training) => {
            const FileIconComponent = getFileIcon(training.fileType || 'default');
            
            return (
              <div
                key={training.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex"
              >
                {training.imageUrl ? (
                  <div 
                    className="w-48 flex-shrink-0 cursor-pointer group relative"
                    onClick={() => setSelectedTraining(training)}
                  >
                    <img 
                      src={training.imageUrl} 
                      alt={training.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="w-48 bg-gray-100 flex items-center justify-center cursor-pointer group relative"
                    onClick={() => setSelectedTraining(training)}
                  >
                    <FileIconComponent className="w-16 h-16 text-gray-500" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-200" />
                    </div>
                  </div>
                )}
                
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {training.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{training.description}</p>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <Filter className="w-4 h-4 mr-2" />
                      Categoria: {categories.find((c) => c.id === training.categoryId)?.name}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <div>
                      {training.trainingLinks && training.trainingLinks.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Links de Referência
                          </h4>
                          <ul className="space-y-2">
                            {training.trainingLinks.map((link, index) => (
                              <li key={index}>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors flex items-center"
                                >
                                  <LinkIcon className="w-4 h-4 mr-2" />
                                  {link.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => downloadFile(training)}
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                      title="Download arquivo"
                    >
                      <Download className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview completo */}
      {selectedTraining && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTraining(null)}
        >
          <div 
            className="relative max-w-sm w-full bg-white rounded-lg p-4" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTraining(null)}
              className="absolute -right-2 -top-2 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all duration-200"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="flex flex-col items-center">
              {selectedTraining.imageUrl ? (
                <img 
                  src={selectedTraining.imageUrl} 
                  alt={selectedTraining.title} 
                  className="max-w-full max-h-64 object-contain mb-4"
                />
              ) : (
                <FileIconComponent className="w-24 h-24 text-gray-500 mb-4" />
              )}
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {selectedTraining.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {selectedTraining.description}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Tipo de arquivo: {selectedTraining.fileType || 'Não definido'}
              </p>
              <button
                onClick={() => downloadFile(selectedTraining)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Baixar arquivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingList;