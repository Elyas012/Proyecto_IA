import { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onAuthClick?: () => void;
}

export function Navbar({ onAuthClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 bg-clip-text text-transparent mb-4">FocusLearn</span>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#inicio" className="text-gray-700 hover:text-cyan-600 transition-colors">
              Inicio
            </a>
            <a href="#acerca" className="text-gray-700 hover:text-cyan-600 transition-colors">
              Acerca del sistema
            </a>
            <a href="#contacto" className="text-gray-700 hover:text-cyan-600 transition-colors">
              Contacto
            </a>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={onAuthClick}>
              Iniciar sesión
            </Button>
            <Button onClick={onAuthClick}>
              Registro
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-md p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              Inicio
            </a>
            <a
              href="#acerca"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              Acerca del sistema
            </a>
            <a
              href="#contacto"
              onClick={closeMenu}
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              Contacto
            </a>
            <div className="pt-4 space-y-2">
              <Button variant="ghost" className="w-full" onClick={() => { closeMenu(); onAuthClick?.(); }}>
                Iniciar sesión
              </Button>
              <Button className="w-full" onClick={() => { closeMenu(); onAuthClick?.(); }}>
                Registro
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
