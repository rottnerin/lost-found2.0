import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, LogIn, LogOut, Menu, LayoutDashboard, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { signOut } from '../lib/auth';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <>
      <nav className="bg-black shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-1 flex items-center justify-center sm:justify-start">
              <a href="/" className="flex items-center">
                <img
                  src="https://visitors.aes.ac.in/images/aes.png"
                  alt="AES Logo"
                  className="h-8 w-auto object-contain mr-2"
                />
                <div className="flex items-center">
                  <span className="ml-2 text-base sm:text-xl font-bold text-white whitespace-nowrap">
                    Lost & Found
                  </span>
                </div>
              </a>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-yellow-600 focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              {user ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="flex items-center px-4 py-2 rounded-md text-white hover:bg-yellow-600 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5 mr-2" />
                      <span>Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/items/new')}
                    className="flex items-center px-4 py-2 rounded-md text-white hover:bg-yellow-600 transition-colors"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    <span>Report Item</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 rounded-md bg-white text-yellow-500 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center px-4 py-2 rounded-md bg-white text-yellow-500 hover:bg-gray-100 transition-colors"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  <span>Staff Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-yellow-600 pb-3 pt-2">
            <div className="flex flex-col space-y-2 px-4">
              {user ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center px-4 py-3 rounded-md text-white hover:bg-yellow-700 transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5 mr-3" />
                      <span className="text-base">Admin</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigate('/items/new');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-md text-white hover:bg-yellow-700 transition-colors"
                  >
                    <PlusCircle className="h-5 w-5 mr-3" />
                    <span className="text-base">Report Item</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-md bg-white text-yellow-500 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="text-base">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center px-4 py-3 rounded-md bg-white text-yellow-500 hover:bg-gray-100 transition-colors"
                >
                  <LogIn className="h-5 w-5 mr-3" />
                  <span className="text-base">Staff Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* High value items notice */}
      <div className="bg-gray-100 text-sm text-black-900 py-2 px-4 text-center border-b">
        Any high value items (phones, keys, etc) will need to be picked up at the security office.
      </div>
    </>
  );
};
