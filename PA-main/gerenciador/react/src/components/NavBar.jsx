import React, { useState, useEffect } from 'react';
import { Disclosure } from '@headlessui/react';
import { Menu, LogOut, Home, FilePlus, Wrench, GraduationCap, X, User as UserIcon, Bell, Shield, ChevronRight } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile', {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        setUserName(response.data.name);
        setUserRole(response.data.role);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    fetchUserProfile();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    document.body.classList.add('fade-out');
    setTimeout(() => {
      localStorage.removeItem('token');
      navigate('/login');
    }, 300);
  };

  const navigation = [
    { 
      name: 'Home', 
      current: location.pathname === '/', 
      href: '/', 
      icon: Home,
      hoverColor: 'hover:text-blue-400',
      bgColor: 'bg-blue-500',
      underlineColor: 'bg-blue-400',
      glowColor: 'from-blue-400/10 to-transparent'
    },
    { 
      name: 'Ferramentas e Licenças', 
      current: location.pathname === '/tools', 
      href: '/tools', 
      icon: Wrench,
      hoverColor: 'hover:text-yellow-400',
      bgColor: 'bg-yellow-500',
      underlineColor: 'bg-yellow-400',
      glowColor: 'from-yellow-400/10 to-transparent'
    },
    { 
      name: 'Treinamentos', 
      current: location.pathname === '/training', 
      href: '/training', 
      icon: GraduationCap,
      hoverColor: 'hover:text-purple-400',
      bgColor: 'bg-purple-500',
      underlineColor: 'bg-purple-400',
      glowColor: 'from-purple-400/10 to-transparent'
    }
  ];
  
  // Adicionar item de administração apenas para admins
  if (userRole === 'ADMIN') {
    navigation.push({
      name: 'Administração',
      current: location.pathname === '/admin',
      href: '/admin',
      icon: Shield,
      hoverColor: 'hover:text-red-400',
      bgColor: 'bg-red-500',
      underlineColor: 'bg-red-400',
      glowColor: 'from-red-400/10 to-transparent'
    });
  }

  return (
    <Disclosure as="nav" 
      className={classNames(
        'fixed w-full top-0 z-50 transition-all duration-500',
        scrolled 
          ? 'bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-lg shadow-xl shadow-gray-900/10' 
          : 'bg-gradient-to-r from-gray-900 to-gray-800'
      )}
    >
      {({ open }) => (
        <>
          {/* Efeito de brilho decorativo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-[150px] -left-[100px] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-[150px] -right-[100px] w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="relative flex items-center justify-between h-16">
              {/* Botão Mobile */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button 
                  className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-300 active:scale-95"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <X className="block h-6 w-6 text-white transform transition-transform duration-300" />
                  ) : (
                    <Menu className="block h-6 w-6 text-white transform transition-transform duration-300" />
                  )}
                </Disclosure.Button>
              </div>

              {/* Nome da aplicação */}
              <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
              
                {/* Desktop */}
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex space-x-2">
                    {navigation.map((item) => {
                      const IconComponent = item.icon;
                      const isHovered = hoveredItem === item.name;
                      
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onMouseEnter={() => setHoveredItem(item.name)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={classNames(
                            'px-4 py-2 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all duration-300 relative group backdrop-blur-sm',
                            item.current 
                              ? 'bg-white/15 text-white shadow-lg' 
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                          )}
                        >
                          {/* Efeito de brilho no hover - posicionado atrás do conteúdo */}
                          {isHovered && (
                            <div 
                              className={classNames(
                                'absolute inset-0 rounded-xl bg-gradient-to-r opacity-100 transition-opacity duration-300',
                                item.glowColor
                              )}
                            />
                          )}
                          
                          <div className={classNames(
                            'p-1.5 rounded-lg transition-all duration-300 relative z-10',
                            item.current ? item.bgColor : 'bg-gray-700/50',
                            isHovered ? 'scale-110' : 'scale-100'
                          )}>
                            <IconComponent 
                              className={classNames(
                                'h-4 w-4 transition-all duration-300',
                                item.current ? 'text-white' : 'text-gray-300'
                              )}
                            />
                          </div>
                          
                          <span className="relative z-10">{item.name}</span>
                          
                          {/* Animação da Underline */}
                          <div 
                            className={classNames(
                              'absolute bottom-0 left-4 right-4 h-0.5 transition-all duration-300 rounded-full',
                              item.underlineColor,
                              isHovered || item.current ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Info do usuário e Logout */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                  <div className="flex items-center space-x-4">
                    {/* Card do usuário melhorado */}
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <div className="relative">
                        <div className={`p-2 ${
                          userRole === 'ADMIN' 
                            ? 'bg-gradient-to-br from-red-500 to-red-600' 
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                        } rounded-xl shadow-lg`}>
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        {/* Indicador online */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-white font-semibold tracking-wide">
                          {userName || 'Usuário'}
                        </span>
                        {userRole && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            userRole === 'ADMIN' 
                              ? 'bg-red-100/90 text-red-800 shadow-sm' 
                              : 'bg-indigo-100/90 text-indigo-800 shadow-sm'
                          }`}>
                            {userRole === 'ADMIN' ? 'Admin' : 'Usuário'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Botão de logout melhorado */}
                    <button
                      onClick={handleLogout}
                      className="group relative flex items-center px-4 py-2.5 rounded-2xl text-gray-200 hover:text-white bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-500/20 hover:border-red-400/40 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 rounded-2xl transition-all duration-300"></div>
                      <div className="relative flex items-center">
                        <div className="p-1.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl mr-3 shadow-lg group-hover:shadow-red-500/25">
                          <LogOut className="h-4 w-4 text-white transform transition-all duration-300 group-hover:translate-x-0.5 group-hover:rotate-3" />
                        </div>
                        <span className="text-sm font-semibold tracking-wide">Logout</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Panel Melhorado */}
            <Disclosure.Panel className="sm:hidden">
              <div className="px-4 pt-4 pb-6 space-y-3 backdrop-blur-md bg-gradient-to-b from-black/20 to-black/10">
                {navigation.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.href}
                      className={classNames(
                        'group w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl text-base font-semibold',
                        'transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]',
                        'border backdrop-blur-sm shadow-lg hover:shadow-xl',
                        item.current 
                          ? 'bg-gradient-to-r from-white/20 to-white/10 text-white border-white/30 shadow-white/10' 
                          : 'text-gray-300 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:text-white border-white/10 hover:border-white/20'
                      )}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animation: 'slideInUp 0.4s ease-out forwards'
                      }}
                    >
                      <div className="relative">
                        <div className={classNames(
                          'p-2.5 rounded-xl transition-all duration-300 shadow-lg',
                          item.current 
                            ? `${item.bgColor} shadow-lg` 
                            : 'bg-gray-700/60 group-hover:bg-gray-600/70'
                        )}>
                          <IconComponent className={classNames(
                            'h-5 w-5 transition-all duration-300',
                            item.current ? 'text-white' : 'text-gray-300 group-hover:text-white'
                          )} />
                        </div>
                        {/* Pulse effect para item ativo */}
                        {item.current && (
                          <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                        )}
                      </div>
                      
                      <span className="flex-1 tracking-wide">{item.name}</span>
                      
                      {/* Indicador melhorado para item atual */}
                      {item.current && (
                        <div className="relative">
                          <span className="w-2 h-2 rounded-full bg-white shadow-lg"></span>
                          <span className="absolute inset-0 w-2 h-2 rounded-full bg-white animate-ping opacity-75"></span>
                        </div>
                      )}
                      
                      {/* Chevron para navegação */}
                      {!item.current && (
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      )}
                    </Disclosure.Button>
                  );
                })}
                
                {/* Divisor elegante */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                </div>
                
                {/* Botão de logout para mobile melhorado */}
                <button
                  onClick={handleLogout}
                  className="group w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl text-base font-semibold text-gray-300 hover:text-white bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-500/20 hover:border-red-400/40 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-red-500/20"
                >
                  <div className="relative">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:shadow-red-500/30">
                      <LogOut className="h-5 w-5 text-white transform transition-all duration-300 group-hover:translate-x-1 group-hover:rotate-6" />
                    </div>
                    {/* Efeito de warning pulse */}
                    <div className="absolute inset-0 rounded-xl bg-red-500/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
                  </div>
                  <span className="flex-1 tracking-wide">Logout</span>
                  
                  {/* Ícone de confirmação visual */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  </div>
                </button>
              </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}