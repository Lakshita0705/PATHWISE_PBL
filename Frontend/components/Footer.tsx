
import React from 'react';
import { Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="glass border-t border-white/5 py-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-6 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Pathwise™</span>
          </Link>
          <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
            Revolutionizing professional growth through neural-guided roadmaps and direct elite mentorship.
          </p>
          <p className="text-xs text-gray-500 italic max-w-sm">
            Based on the patented system titled:<br />
            “An AI-Enabled Skill Development and Mentorship Platform.”
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link to="/pricing" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
            <li><Link to="/roadmap" className="hover:text-purple-400 transition-colors">Roadmaps</Link></li>
            <li><Link to="/mentorship" className="hover:text-purple-400 transition-colors">Mentors</Link></li>
            <li><Link to="/login" className="hover:text-purple-400 transition-colors">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Support</h4>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-purple-400 transition-colors">Help Center</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-purple-400 transition-colors">API Reference</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
