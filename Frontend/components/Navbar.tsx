
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Pathwise
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-all neon-glow"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link>
                <Link 
                  to="/register" 
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-all neon-glow"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-white/5"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              <Link to="/pricing" className="block text-gray-400 py-2">Pricing</Link>
              {user ? (
                <Link to="/dashboard" className="block w-full text-center py-3 rounded-xl bg-purple-600 text-white">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="block text-gray-400 py-2">Login</Link>
                  <Link to="/register" className="block w-full text-center py-3 rounded-xl bg-purple-600 text-white">Join Pathwise</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Help helper for AnimatePresence
import { AnimatePresence } from 'framer-motion';

export default Navbar;
