import React, { useMemo, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Download, PlusCircle, Keyboard } from 'lucide-react';
import { supabase } from '@/shared/lib/supabaseClient';
import { useTenant } from '@/shared/context/TenantContext';

interface EstudianteCSV {
  rut: string;
  nombre_completo: string;
  curso: string;
  programa_pie?: boolean;
  alerta_nee?: boolean;
  errores?: string[];
  validado?: boolean;
}

type ImportMode = 'csv' | 'manual';

const normalizeRut = (rut: string) => rut.replace(/[^0-9kK]/g, '').toUpperCase();

export const ImportarEstudiantes: React.FC = () => {
  const { tenantId } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>('csv');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteCSV[]>([]);
  const [erroresGlobales, setErroresGlobales] = useState<string[]>([]);
  const [importadosExitosos, setImportadosExitosos] = useState(0);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [manualForm, setManualForm] = useState<EstudianteCSV>({
    rut: '',
    nombre_completo: '',
    curso: '',
    programa_pie: false,
    alerta_nee: false,
  });

  const validarRUT = (rut: string): { valido: boolean; mensaje: string } => {
    if (!rut) return { valido: false, mensaje: 'RUT vacio' };

    const rutLimpio = normalizeRut(rut);
    if (rutLimpio.length < 2) return { valido: false, mensaje: 'RUT muy corto' };

    const numero = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero[i], 10) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : String(11 - resto);
    if (dv !== dvCalculado) return { valido: false, mensaje: `RUT invalido (DV esperado: ${dvCalculado})` };

    return { valido: true, mensaje: '' };
  };

  const validarRegistro = (estudiante: EstudianteCSV): EstudianteCSV => {
    const errores: string[] = [];

    if (!estudiante.rut) {
      errores.push('RUT requerido');
    } else {
      const validacionRUT = validarRUT(estudiante.rut);
      if (!validacionRUT.valido) errores.push(validacionRUT.mensaje);
    }

    if (!estudiante.nombre_completo?.trim()) errores.push('Nombre requerido');
    if (!estudiante.curso?.trim()) errores.push('Curso requerido');

    return {
      ...estudiante,
      rut: normalizeRut(estudiante.rut),
      nombre_completo: estudiante.nombre_completo?.trim() || '',
      curso: estudiante.curso?.trim() || '',
      errores,
      validado: errores.length === 0,
    };
  };

  const splitCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        out.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    out.push(current.trim());

    return out.map((v) => v.replace(/^"|"$/g, '').trim());
  };

  const parsearCSV = (contenido: string): EstudianteCSV[] => {
    const lineas = contenido
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((linea) => linea.trim());

    if (lineas.length < 2) return [];

    const encabezados = splitCsvLine(lineas[0]).map((h) => h.toLowerCase());
    const resultados: EstudianteCSV[] = [];

    for (let i = 1; i < lineas.length; i++) {
      const valores = splitCsvLine(lineas[i]);
      const estudiante: EstudianteCSV = {
        rut: '',
        nombre_completo: '',
        curso: '',
        programa_pie: false,
        alerta_nee: false,
      };

      encabezados.forEach((encabezado, index) => {
        const valor = valores[index] || '';
        switch (encabezado) {
          case 'rut':
          case 'run':
            estudiante.rut = valor;
            break;
          case 'nombre':
          case 'nombre_completo':
          case 'nombres':
            estudiante.nombre_completo = valor;
            break;
          case 'curso':
          case 'nivel':
          case 'grado':
            estudiante.curso = valor;
            break;
          case 'pie':
          case 'programa_pie':
            estudiante.programa_pie = ['si', 'yes', '1', 'true'].includes(valor.toLowerCase());
            break;
          case 'nee':
          case 'alerta_nee':
            estudiante.alerta_nee = ['si', 'yes', '1', 'true'].includes(valor.toLowerCase());
            break;
        }
      });

      resultados.push(validarRegistro(estudiante));
    }

    return validarDuplicadosLocales(resultados);
  };

  const validarDuplicadosLocales = (items: EstudianteCSV[]): EstudianteCSV[] => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const key = normalizeRut(item.rut);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return items.map((item) => {
      const key = normalizeRut(item.rut);
      const errores = [...(item.errores || [])];
      if (key && (counts.get(key) || 0) > 1 && !errores.includes('RUT duplicado en archivo/lote')) {
        errores.push('RUT duplicado en archivo/lote');
      }
      return { ...item, errores, validado: errores.length === 0 };
    });
  };

  const handleArchivo = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErroresGlobales(['El archivo debe ser un CSV']);
      return;
    }

    setArchivo(file);
    setErroresGlobales([]);
    setMostrarResultados(false);
    setImportadosExitosos(0);

    try {
      const contenido = await file.text();
      const parsed = parsearCSV(contenido);
      setEstudiantes(parsed);

      if (parsed.length === 0) setErroresGlobales(['No se encontraron estudiantes en el archivo']);
    } catch {
      setErroresGlobales(['Error al leer el archivo CSV']);
    }
  };

  const addManualRecord = () => {
    const validated = validarRegistro(manualForm);
    const next = validarDuplicadosLocales([...estudiantes, validated]);
    setEstudiantes(next);
    setMostrarResultados(false);
    setImportadosExitosos(0);
    setErroresGlobales([]);
    setManualForm({ rut: '', nombre_completo: '', curso: '', programa_pie: false, alerta_nee: false });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleArchivo(file);
  };

  const handleImportar = async () => {
    if (!tenantId || estudiantes.length === 0 || !supabase) return;

    const validos = estudiantes.filter((e) => e.validado);
    if (validos.length === 0) {
      setErroresGlobales(['No hay estudiantes validos para importar']);
      return;
    }

    setIsImporting(true);
    let exitosos = 0;
    const erroresImportacion: string[] = [];

    try {
      const ruts = Array.from(new Set(validos.map((v) => normalizeRut(v.rut)).filter(Boolean)));
      const { data: existentes, error: existingError } = await supabase
        .from('estudiantes')
        .select('rut')
        .in('rut', ruts);

      if (existingError) throw existingError;

      const existingSet = new Set((existentes || []).map((e) => normalizeRut(e.rut)));
      const aInsertar = validos.filter((v) => !existingSet.has(normalizeRut(v.rut)));
      const duplicados = validos.filter((v) => existingSet.has(normalizeRut(v.rut))).map((v) => v.rut);

      if (duplicados.length > 0) {
        erroresImportacion.push(`Se omitieron ${duplicados.length} estudiantes por RUT duplicado en base de datos.`);
      }

      const batchSize = 50;
      for (let i = 0; i < aInsertar.length; i += batchSize) {
        const lote = aInsertar.slice(i, i + batchSize).map((e) => ({
          establecimiento_id: tenantId,
          rut: normalizeRut(e.rut),
          nombre_completo: e.nombre_completo,
          curso: e.curso,
          programa_pie: e.programa_pie || false,
          alerta_nee: e.alerta_nee || false,
        }));

        const { error } = await supabase.from('estudiantes').insert(lote);

        if (error) {
          erroresImportacion.push(`Error en lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          exitosos += lote.length;
        }
      }

      setImportadosExitosos(exitosos);
      setMostrarResultados(true);
      setErroresGlobales(erroresImportacion);
    } catch {
      setErroresGlobales(['Error al importar estudiantes']);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDescargarPlantilla = () => {
    const plantilla = 'rut,nombre_completo,curso,programa_pie,alerta_nee\n12345678-9,Juan Perez,8A,no,no\n98765432-1,Maria Gonzalez,7B,si,no';
    const blob = new Blob([plantilla], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_estudiantes.csv';
    link.click();
  };

  const handleLimpiar = () => {
    setArchivo(null);
    setEstudiantes([]);
    setErroresGlobales([]);
    setImportadosExitosos(0);
    setMostrarResultados(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const estudiantesValidos = useMemo(() => estudiantes.filter((e) => e.validado), [estudiantes]);
  const estudiantesInvalidos = useMemo(() => estudiantes.filter((e) => !e.validado), [estudiantes]);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            Importar Estudiantes
          </h3>
          <p className="text-sm text-slate-400 mt-1">Carga CSV o agrega estudiantes manualmente.</p>
        </div>
        <button
          onClick={handleDescargarPlantilla}
          className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar Plantilla
        </button>
      </div>

      <div className="inline-flex rounded-lg bg-slate-900 p-1 mb-4 border border-slate-700">
        <button
          onClick={() => setMode('csv')}
          className={`px-3 py-1.5 rounded-md text-sm ${mode === 'csv' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          CSV
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`px-3 py-1.5 rounded-md text-sm ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          Manual
        </button>
      </div>

      {mode === 'csv' && !mostrarResultados && (
        <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-200">
          Para importacion masiva debes cargar un archivo <span className="font-bold">CSV (.csv)</span>.
        </div>
      )}

      {erroresGlobales.length > 0 && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          {erroresGlobales.map((error, i) => (
            <p key={i} className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}

      {mostrarResultados && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="font-medium text-green-400">Importacion completada</p>
              <p className="text-sm text-slate-300">{importadosExitosos} estudiantes importados correctamente</p>
            </div>
          </div>
        </div>
      )}

      {mode === 'csv' && !mostrarResultados && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && void handleArchivo(e.target.files[0])}
            className="hidden"
          />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
          <p className="text-slate-300 font-medium">
            {archivo ? archivo.name : 'Arrastra un archivo CSV o haz clic para seleccionar'}
          </p>
          <p className="text-sm text-slate-500 mt-1">Formato: rut, nombre_completo, curso, programa_pie, alerta_nee</p>
        </div>
      )}

      {mode === 'manual' && !mostrarResultados && (
        <div className="rounded-xl border border-slate-700 p-4 bg-slate-900/40 space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={manualForm.rut}
              onChange={(e) => setManualForm({ ...manualForm, rut: e.target.value })}
              placeholder="RUT"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            />
            <input
              value={manualForm.nombre_completo}
              onChange={(e) => setManualForm({ ...manualForm, nombre_completo: e.target.value })}
              placeholder="Nombre completo"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            />
            <input
              value={manualForm.curso}
              onChange={(e) => setManualForm({ ...manualForm, curso: e.target.value })}
              placeholder="Curso"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={manualForm.programa_pie || false}
                onChange={(e) => setManualForm({ ...manualForm, programa_pie: e.target.checked })}
              />
              PIE
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={manualForm.alerta_nee || false}
                onChange={(e) => setManualForm({ ...manualForm, alerta_nee: e.target.checked })}
              />
              Alerta NEE
            </label>
            <button
              onClick={addManualRecord}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            >
              <PlusCircle className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>
      )}

      {estudiantes.length > 0 && !mostrarResultados && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">{estudiantesValidos.length} validos / {estudiantesInvalidos.length} con errores</span>
            <button
              onClick={handleLimpiar}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          </div>

          <div className="border border-slate-700 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">RUT</th>
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Nombre</th>
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Curso</th>
                  <th className="px-3 py-2 text-left text-slate-400 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {estudiantes.slice(0, 100).map((est, i) => (
                  <tr key={i} className={est.validado ? 'bg-green-500/5' : 'bg-red-500/5'}>
                    <td className="px-3 py-2 text-slate-300 font-mono">{est.rut}</td>
                    <td className="px-3 py-2 text-white">{est.nombre_completo}</td>
                    <td className="px-3 py-2 text-slate-300">{est.curso}</td>
                    <td className="px-3 py-2">
                      {est.validado ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-4 h-4" /> Valido
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {est.errores?.[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => void handleImportar()}
              disabled={isImporting || estudiantesValidos.length === 0}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
                ${isImporting || estudiantesValidos.length === 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 text-white'}
              `}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar {estudiantesValidos.length} estudiantes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {mode === 'manual' && estudiantes.length === 0 && !mostrarResultados && (
        <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
          <Keyboard className="w-4 h-4" />
          Agrega estudiantes uno a uno y luego confirma la importacion.
        </div>
      )}
    </div>
  );
};

export default ImportarEstudiantes;
