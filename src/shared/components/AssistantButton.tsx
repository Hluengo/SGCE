/**
 * AssistantButton.tsx - Botón flotante para abrir el Asistente Legal
 * 
 * Este componente puede ser añadido a cualquier modal para proporcionar
 * acceso rápido al Asistente Legal de IA.
 * 
 * Uso:
 * <AssistantButton />
 * <AssistantButton position="top-right" />
 * <AssistantButton mode="normativo" />  // Abre en modo consultoría
 * <AssistantButton mode="redactor_neutral" />  // Abre en modo redactor neutral
 */

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { useAssistant } from '@/shared/context/providers/UIContext';

type Position = 'bottom-right' | 'top-right' | 'top-left' | 'bottom-left';
type Mode = 'normativo' | 'redactor_neutral';

interface AssistantButtonProps {
  position?: Position;
  mode?: Mode;
  className?: string;
  showLabel?: boolean;
}

const POSITION_CLASSES: Record<Position, string> = {
  'bottom-right': 'bottom-6 right-6',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-left': 'bottom-6 left-6',
};

export const AssistantButton: React.FC<AssistantButtonProps> = ({
  position = 'bottom-right',
  className = '',
  showLabel = false,
}) => {
  const { setIsAssistantOpen } = useAssistant();

  const handleClick = () => {
    setIsAssistantOpen(true);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed ${POSITION_CLASSES[position]}
        bg-gradient-to-r from-blue-600 to-indigo-600 
        text-white rounded-full 
        shadow-xl shadow-blue-500/30
        hover:shadow-2xl hover:shadow-blue-500/40
        hover:scale-105 active:scale-95
        transition-all duration-200
        flex items-center gap-2
        ${showLabel ? 'px-4 py-2' : 'w-12 h-12'}
        ${className}
      `}
      title="Asistente Legal IA"
    >
      <Bot className="w-5 h-5 flex-shrink-0" />
      {showLabel && (
        <span className="text-sm font-bold whitespace-nowrap">
          Asistente IA
        </span>
      )}
      <Sparkles className="w-3 h-3 opacity-70" />
    </button>
  );
};

export default AssistantButton;
