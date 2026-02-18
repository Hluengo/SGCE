import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface AssistantHeaderButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Botón de Asistente IA para headers de modal/wizard.
 * Mantiene el mismo look & feel que el botón del Wizard de Expedientes.
 */
const AssistantHeaderButton: React.FC<AssistantHeaderButtonProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg shadow-blue-500/30 ${className}`}
      title="Asistente IA Normativo"
    >
      <Bot className="w-4 h-4" />
      <span className="hidden md:inline">Asistente IA</span>
      <Sparkles className="w-3 h-3" />
    </button>
  );
};

export default AssistantHeaderButton;
