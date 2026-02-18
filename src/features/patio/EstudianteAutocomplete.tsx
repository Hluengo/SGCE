import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { EstudianteBadge } from '@/shared/components/EstudianteBadge';

/** Estudiante retornado por la búsqueda */
interface Estudiante {
  id: string;
  nombre_completo: string;
  rut: string;
  curso: string;
  programa_pie: boolean;
  alerta_nee: boolean;
}

/** Props para el componente */
interface EstudianteAutocompleteProps {
  value: string;
  onChange: (estudianteId: string | null, nombre: string, curso: string) => void;
  placeholder?: string;
  showBadge?: boolean;
  cursoFiltro?: string | null; // Si se proporciona, filtra por curso
  disabled?: boolean; // Deshabilitar input
}

export const EstudianteAutocomplete: React.FC<EstudianteAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Buscar estudiante por nombre o RUT...',
  showBadge = true,
  cursoFiltro = null,
  disabled = false
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Estudiante[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cerrar dropdown al hacer click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar estudiantes con debounce
  const searchEstudiantes = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    if (!supabase) return;

    setIsLoading(true);
    try {
      let queryBuilder = supabase
        .from('estudiantes')
        .select('id, nombre_completo, rut, curso, programa_pie, alerta_nee')
        .or(`nombre_completo.ilike.%${searchQuery}%,rut.ilike.%${searchQuery}%`);

      // Filtrar por curso si se proporciona
      if (cursoFiltro) {
        queryBuilder = queryBuilder.eq('curso', cursoFiltro);
      }

      const { data, error } = await queryBuilder.limit(10);

      if (error) {
        console.error('[EstudianteAutocomplete] Error:', error);
        return;
      }

      setResults(data || []);
      setIsOpen(true);
    } catch (err) {
      console.error('[EstudianteAutocomplete] Error inesperado:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cursoFiltro]);

  // Manejar cambio en input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedId(null);
    onChange(null, '', '');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchEstudiantes(newValue);
    }, 300);
  };

  // Seleccionar estudiante
  const handleSelect = (estudiante: Estudiante) => {
    const displayName = `${estudiante.nombre_completo} (${estudiante.curso})`;
    setQuery(displayName);
    setSelectedId(estudiante.id);
    setIsOpen(false);
    onChange(estudiante.id, displayName, estudiante.curso);
  };

  // Limpiar selección
  const handleClear = () => {
    setQuery('');
    setSelectedId(null);
    setResults([]);
    setIsOpen(false);
    onChange(null, '', '');
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto">
          {results.map((estudiante) => (
            <button
              key={estudiante.id}
              type="button"
              onClick={() => handleSelect(estudiante)}
              className={`w-full p-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
                selectedId === estudiante.id ? 'bg-amber-50' : ''
              }`}
            >
              {showBadge ? (
                <EstudianteBadge
                  nombre={estudiante.nombre_completo}
                  curso={estudiante.curso}
                  rut={estudiante.rut}
                  programaPie={estudiante.programa_pie}
                  alertaNee={estudiante.alerta_nee}
                  size="md"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {estudiante.nombre_completo}
                  </span>
                  <span className="text-slate-500">({estudiante.curso})</span>
                  {estudiante.programa_pie && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      PIE
                    </span>
                  )}
                  {estudiante.alerta_nee && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      NEE
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Sin resultados */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-center">
          <p className="text-sm text-slate-500">No se encontraron estudiantes</p>
          {cursoFiltro ? (
            <p className="text-xs text-slate-400 mt-1">No hay estudiantes en {cursoFiltro}</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Intente con otro nombre o RUT</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EstudianteAutocomplete;
