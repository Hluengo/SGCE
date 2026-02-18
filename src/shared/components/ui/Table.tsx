import React from 'react';

/**
 * Definición de columna para la tabla
 * @template T - Tipo de datos de las filas
 */
interface Column<T> {
  /**
   * Clave para acceder al valor en el objeto de datos
   */
  key: keyof T | string;

  /**
   * Encabezado de la columna
   */
  header: string;

  /**
   * Función para renderizar contenido personalizado
   * Sobrescribe el valor de 'key'
   */
  render?: (item: T) => React.ReactNode;

  /**
   * Clases CSS adicionales para esta columna
   */
  className?: string;
}

interface TableProps<T> {
  /**
   * Datos a mostrar en la tabla
   * @required
   */
  data: T[];

  /**
   * Definición de columnas
   * @required
   */
  columns: Column<T>[];

  /**
   * Callback al hacer click en una fila
   */
  onRowClick?: (item: T) => void;

  /**
   * Mensaje cuando no hay datos
   * @default 'No hay datos'
   */
  emptyMessage?: string;
}

/**
 * Componente Table - Tabla de datos genérica y reutilizable
 *
 * Características:
 * - Renderizado genérico basado en tipos
 * - Columnas personalizables con render函数
 * - Soporte para click en filas
 * - Mensaje de vacío configurable
 *
 * @example
 * ```tsx
 * interface Estudiante {
 *   id: number;
 *   nombre: string;
 *   curso: string;
 * }
 *
 * const columnas: Column<Estudiante>[] = [
 *   { key: 'id', header: 'ID' },
 *   { key: 'nombre', header: 'Nombre' },
 *   { key: 'curso', header: 'Curso' },
 *   {
 *     key: 'acciones',
 *     header: 'Acciones',
 *     render: (est) => <button>Ver</button>
 *   }
 * ];
 *
 * <Table data={estudiantes} columns={columnas} onRowClick={(e) => console.log(e)} />
 * ```
 */
const Table = <T extends Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No hay datos',
}: TableProps<T>) => {
  if (data.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-slate-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-5 font-black ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((item, rowIdx) => (
            <tr
              key={rowIdx}
              className={`
                hover:bg-blue-50/40 transition-all group
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col, colIdx) => (
                <td key={colIdx} className={`px-4 py-6 ${col.className || ''}`}>
                  {col.render 
                    ? col.render(item) 
                    : String(item[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
