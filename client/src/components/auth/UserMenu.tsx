import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleTriggerClick = () => {
    if (isAuthenticated) {
      setIsOpen(!isOpen);
    } else {
      navigate('/login');
    }
  };

  // Not authenticated - show login button
  if (!isAuthenticated) {
    return (
      <button
        onClick={handleTriggerClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-sm font-mono">Ingresar</span>
      </button>
    );
  }

  // Authenticated - show user menu with dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleTriggerClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-sm font-mono max-w-[120px] truncate">
          {user?.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#141417] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Opciones de usuario
          </button>
          <div className="border-t border-white/10" />
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
