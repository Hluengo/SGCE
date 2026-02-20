
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useConvivencia } from '@/shared/context/ConvivenciaContext';
import { withRetry } from '@/shared/utils/retry';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Scale, 
  Gavel,
  Loader2,
  FileText,
  ClipboardList
} from 'lucide-react';

// Tipos de asistente
type ModoAsistente = 'normativo' | 'redactor_neutral';

const MODOS_ASISTENTE: { id: ModoAsistente; label: string; descripcion: string; icono: React.ElementType }[] = [
  { id: 'normativo', label: 'ConsultorÃ­a', descripcion: 'AsesorÃ­a en Circulares 781/782', icono: Scale },
  { id: 'redactor_neutral', label: 'Redactor Neutral', descripcion: 'Redacta hechos sin juicios de valor', icono: FileText },
];

const AssistantLauncher: React.FC<{
  modoActivo: ModoAsistente;
  onOpen: () => void;
}> = ({ modoActivo, onOpen }) => (
  <button
    onClick={onOpen}
    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-400 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-[60] group"
  >
    {modoActivo === 'redactor_neutral' ? (
      <FileText className="w-6 h-6" />
    ) : (
      <Bot className="w-6 h-6" />
    )}
    <div className="absolute right-16 px-3 py-1 bg-slate-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
      {modoActivo === 'redactor_neutral' ? 'Redactor Neutral' : 'ConsultorÃ­a IA Normativa'}
    </div>
  </button>
);

const ModoSelector: React.FC<{
  modoActivo: ModoAsistente;
  onChange: (modo: ModoAsistente) => void;
}> = ({ modoActivo, onChange }) => (
  <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
    <div className="flex gap-2">
      {MODOS_ASISTENTE.map((modo) => (
        <button
          key={modo.id}
          onClick={() => onChange(modo.id)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            modoActivo === modo.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <modo.icono className="w-3.5 h-3.5" />
            <span>{modo.label}</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const LegalAssistant: React.FC = () => {
  const { isAssistantOpen, setIsAssistantOpen, expedienteSeleccionado } = useConvivencia();
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'ai'; text: string }[]>([
    { id: crypto.randomUUID(), role: 'ai', text: 'Hola, soy tu Asistente Experto en Normativa Escolar. ¿En qué puedo ayudarte hoy respecto a las Circulares 781 y 782?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modoActivo, setModoActivo] = useState<ModoAsistente>('normativo');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Mensaje inicial segÃºn modo (recibe el modo como argumento para evitar lecturas de estado desactualizado)
  const getMensajeInicial = (modo: ModoAsistente): string => {
    if (modo === 'redactor_neutral') {
      return 'Hola, soy el Redactor Neutral. Proporciona una descripciÃ³n subjetiva o detallada de los hechos y la transformaré en un relato objetivo, sin juicios de valor.';
    }
    return 'Hola, soy tu Asistente Experto en Normativa Escolar. ¿En qué puedo ayudarte hoy respecto a las Circulares 781 y 782?';
  };

  // Cambiar modo y reiniciar mensajes
  const cambiarModo = (nuevoModo: ModoAsistente) => {
    setModoActivo(nuevoModo);
    setMessages([{ id: crypto.randomUUID(), role: 'ai', text: getMensajeInicial(nuevoModo) }]);
  };

  // System instruction segÃºn el modo activo
  const getSystemInstruction = (): string => {
    const contextPrompt = expedienteSeleccionado 
      ? `Contexto del caso actual: Expediente ${expedienteSeleccionado.id}, Estudiante ${expedienteSeleccionado.nnaNombre}, Estado: ${expedienteSeleccionado.etapa}, Gravedad: ${expedienteSeleccionado.gravedad}, Es proceso de expulsiÃ³n: ${expedienteSeleccionado.esProcesoExpulsion ? 'SÃ' : 'NO'}.`
      : 'No hay un expediente seleccionado actualmente.';

    if (modoActivo === 'redactor_neutral') {
      return `ActÃºa como un REDACTOR NEUTRAL de hechos para expedientes de convivencia escolar. 
Tu Ãºnico objetivo es TRANSFORMAR descripciones subjetivas en hechos objetivos y verificables.

REGLAS OBLIGATORIAS:
1. NUNCA agregues interpretaciones, opiniones o juicios de valor.
2. NUNCA uses adjetivos que impliquen valoraciÃ³n moral (ej: "agresivo", "malintencionado", "problemÃ¡tico", "manipulador", "rebelde", "desobediente").
3. USA SOLO verbos en tiempo pasado y descripciones observables: "indicÃ³", "manifestÃ³", "seÃ±alÃ³", "se observaron", "se constatÃ³", "declarÃ³".
4. Incluye elementos verificables: quién, qué, cuÃ¡ndo, dÃ³nde, cÃ³mo.
5. Si la descripciÃ³n contiene opiniones, reescrÃ­belas como hechos reportados: "El profesor X indicÃ³ que..." en lugar de "El estudiante es conflictivo".
6. Mantén el anonimato de los involucrados excepto cuando sea necesario para el proceso.
7. Formato de salida: texto plano, redactado en tercera persona, formal y objetivo.
8. Estructura sugerida: "Hechos constatados:", "Testimonios:", "Evidencias:".

Ejemplo de transformaciÃ³n:
- SUBJETIVO: "El estudiante agresor gritÃ³ obscenidades con actitud desafiante y manipulada"
- NEUTRAL: "Se constatÃ³ que el estudiante formulÃ³ expresiones verbales en voz elevada. El profesor A seÃ±alÃ³ que dichas expresiones fueron dirigidas hacia el estudiante B. No se constatÃ³ daÃ±o fÃ­sico visible."

Contexto actual: ${contextPrompt}`;
    }

    // Modo normativo por defecto
    return `ActÃºa como un Senior Legal Counsel experto en la normativa de educaciÃ³n chilena, especÃ­ficamente en las Circulares 781 y 782 de la Superintendencia de EducaciÃ³n. 
Tu objetivo es guiar a los Encargados de Convivencia para asegurar el CUMPLIMIENTO DEL DEBIDO PROCESO. 

Reglas:
1. Siempre cita o referencia la importancia de la gradualidad de las medidas.
2. Si se menciona expulsiÃ³n, recuerda el hito obligatorio de consulta al Consejo de Profesores.
3. Mantén un tono profesional, preventivo y resolutivo.
4. No des consejos fuera de la normativa chilena de educaciÃ³n.
5. Si hay un expediente en contexto, Ãºsalo para dar consejos especÃ­ficos.

Contexto actual de la plataforma: ${contextPrompt}`;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input;
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      if (!navigator.onLine) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'ai', text: 'EstÃ¡s en modo offline. Revisa tu conexiÃ³n e intenta nuevamente.' }
        ]);
        return;
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
      if (!apiKey) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'ai', text: 'No hay API Key configurada para el asistente legal. Configura VITE_GEMINI_API_KEY en `.env.local`.' }
        ]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const response = await withRetry(
        () =>
          ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userMessage,
            config: {
              systemInstruction: getSystemInstruction(),
            },
          }),
        { retries: 2, baseDelayMs: 600 }
      );

      const aiText = response?.text || "Lo siento, tuve un problema analizando la normativa. Por favor, intenta de nuevo.";
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', text: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      
      // Analizar el tipo de error para dar un mensaje mÃ¡s especÃ­fico
      let mensajeError = "Error de conexiÃ³n con el motor de IA. Verifica tu suscripciÃ³n o conexiÃ³n.";
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Error 503 - Servicio no disponible
        if (errorMessage.includes('503') || errorMessage.includes('service unavailable') || errorMessage.includes('unavailable')) {
          mensajeError = "El servicio de IA estÃ¡ temporalmente no disponible (503). Por favor, espera unos minutos e intenta nuevamente. El sistema reintentarÃ¡ automÃ¡ticamente.";
        }
        // Error 429 - Rate limit / demasiadas solicitudes
        else if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          mensajeError = "Has excedido el lÃ­mite de solicitudes. Por favor, espera un momento e intenta nuevamente.";
        }
        // Error 400 - Solicitud invÃ¡lida
        else if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
          mensajeError = "La solicitud no fue procesada correctamente. Por favor, reformula tu pregunta e intenta de nuevo.";
        }
        // Error de red
        else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
          mensajeError = "Error de conexiÃ³n de red. Verifica tu conexiÃ³n a internet e intenta nuevamente.";
        }
        // Error de API key
        else if (errorMessage.includes('api key') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
          mensajeError = "Error de autenticaciÃ³n con el servicio de IA. Verifica que la API Key esté correctamente configurada.";
        }
        // Error de cuota
        else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
          mensajeError = "Has alcanzado el lÃ­mite de uso del servicio de IA. Considera upgrading tu plan o esperar al siguiente perÃ­odo de facturaciÃ³n.";
        }
      }
      
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'ai', text: mensajeError }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isAssistantOpen) return <AssistantLauncher modoActivo={modoActivo} onOpen={() => setIsAssistantOpen(true)} />;

  return (
    <div className="fixed bottom-4 right-4 left-4 z-50 flex h-5/6 w-auto flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom-8 duration-300 md:bottom-6 md:right-6 md:left-auto md:h-3/4 md:w-96">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            {modoActivo === 'redactor_neutral' ? <FileText className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-sm font-bold leading-none">
              {modoActivo === 'redactor_neutral' ? 'Redactor Neutral' : 'Asistente Normativo'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 uppercase font-black tracking-tighter">
              {modoActivo === 'redactor_neutral' ? 'Objetividad y Neutralidad' : 'AI-Powered Compliance'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsAssistantOpen(false)}
          className="p-1 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ModoSelector modoActivo={modoActivo} onChange={cambiarModo} />

      {/* Case Context Warning */}
      {expedienteSeleccionado && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center space-x-2 shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-blue-700 uppercase">Auditando: {expedienteSeleccionado.id}</span>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-md p-3 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-100' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
            }`}>
              {m.text.split('\n').map((line) => <p key={line} className="mb-1">{line}</p>)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
              <span className="text-xs text-slate-400 font-medium italic">
                {modoActivo === 'redactor_neutral' ? 'Transformando a formato neutral...' : 'Analizando Circulares...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="p-2 px-4 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 shrink-0 bg-white">
        {modoActivo === 'redactor_neutral' ? (
          [
            { label: 'Transformar descripciÃ³n', icon: ClipboardList },
            { label: 'Hacer objetivo', icon: FileText },
            { label: 'Quitar subjetividad', icon: FileText },
          ].map(p => (
            <button 
              key={p.label}
              onClick={() => setInput(p.label)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <p.icon className="w-3 h-3" />
              <span>{p.label}</span>
            </button>
          ))
        ) : (
          [
            { label: 'Auditar caso', icon: Gavel },
            { label: 'Plazos 781', icon: Scale },
            { label: 'Aula Segura', icon: ShieldAlert },
          ].map(p => (
            <button 
              key={p.label}
              onClick={() => setInput(p.label)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <p.icon className="w-3 h-3" />
              <span>{p.label}</span>
            </button>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="relative">
          <textarea
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder={modoActivo === 'redactor_neutral' ? 'Pega aquÃ­ la descripciÃ³n subjetiva...' : 'Consulta legal...'}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              input.trim() && !isTyping ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-center text-slate-400 mt-2 font-medium">
          {modoActivo === 'redactor_neutral' 
            ? 'La IA transforma descripciones subjetivas en hechos objetivos. Verifica siempre el resultado.' 
            : 'La IA puede cometer errores. Valide siempre con su equipo jurÃ­dico.'}
        </p>
      </div>
    </div>
  );
};

export default LegalAssistant;

