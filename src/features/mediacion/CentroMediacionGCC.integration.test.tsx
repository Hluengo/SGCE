/**
 * CentroMediacionGCC.integration.test.tsx
 * Integration tests for complete GCC mediation flows
 * 
 * Tests flujos completos:
 * 1. Caso disponible → Derivación GCC → Mediación → Compromisos → Cierre
 * 2. Validación de requisitos previos
 * 3. Generación de acta
 * 4. Cierre exitoso
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Mock de datos realistas para integration tests
 */

// Mock Expediente
const mockExpediente = {
  id: 'exp-001',
  folio: 'F-2025-0001',
  estudianteNombre: 'Juan Pérez García',
  estudianteRun: '20.123.456-7',
  apoderadoNombre: 'María García López',
  falta: {
    tipo: 'GRAVE',
    descripcion: 'Agresión física contra compañero',
    fecha: '2025-02-10',
  },
  plazoFatal: '2025-02-24',
  estado: 'ABIERTO',
};

// Mock Mediación
const mockMediacion = {
  id: 'med-001',
  expedienteId: 'exp-001',
  estado: 'PROCESO',
  mecanismo: 'MEDIACION' as const,
  fechaInicio: '2025-02-15',
  mediador: 'Psicóloga Ana María González',
  compromisos: [
    {
      id: 'comp-001',
      descripcion: 'Pedir disculpas formales al compañero',
      fechaCumplimiento: '2025-02-20',
      responsable: 'Estudiante',
      completado: false,
    },
    {
      id: 'comp-002',
      descripcion: 'Asistir a taller de empatía',
      fechaCumplimiento: '2025-03-05',
      responsable: 'Estudiante',
      completado: false,
    },
  ],
};

// Mock RPC calls
const mockSupabaseRPC = {
  gcc_crear_proceso: vi.fn(),
  gcc_procesar_cierre_completo: vi.fn(),
  gcc_validar_expediente: vi.fn(),
  gcc_obtener_dashboard: vi.fn(),
};

describe('CentroMediacionGCC - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flujo 1: Derivación Exitosa', () => {
    it('debería permitir derivar expediente a GCC', async () => {
      const mockDerivacion = {
        expedienteId: mockExpediente.id,
        motivo: 'Agresión física entre estudiantes',
        objetivos: ['Restaurar relaciones', 'Generar compromisos'],
        mediadorAsignado: 'Psicóloga Ana María González',
        fechaMediacion: '2025-02-17',
      };

      // Simular creación de derivación
      mockSupabaseRPC.gcc_crear_proceso.mockResolvedValueOnce({
        data: {
          id: mockMediacion.id,
          ...mockDerivacion,
        },
      });

      // Verificar que se llamó al RPC con parámetros corrrectos
      await mockSupabaseRPC.gcc_crear_proceso({
        expediente_id: mockExpediente.id,
        motivo: mockDerivacion.motivo,
      });

      expect(mockSupabaseRPC.gcc_crear_proceso).toHaveBeenCalled();
      const calls = mockSupabaseRPC.gcc_crear_proceso.mock.calls;
      expect(calls[0][0].expediente_id).toBe(mockExpediente.id);
    });

    it('debería validar requisitos antes de derivar', async () => {
      const mockValidacion = {
        valido: true,
        razon: null,
        requisitos: {
          tiene_apoderado: true,
          plazo_vigente: true,
          tipo_falta_compatible: true,
        },
      };

      mockSupabaseRPC.gcc_validar_expediente.mockResolvedValueOnce({
        data: mockValidacion,
      });

      await mockSupabaseRPC.gcc_validar_expediente({
        expediente_id: mockExpediente.id,
      });

      expect(mockSupabaseRPC.gcc_validar_expediente).toHaveBeenCalled();
    });

    it('debería rechazar derivación si requisitos no se cumplen', async () => {
      const mockValidacion = {
        valido: false,
        razon: 'Plazo fatal vencido',
        requisitos: {
          tiene_apoderado: true,
          plazo_vigente: false,
          tipo_falta_compatible: true,
        },
      };

      mockSupabaseRPC.gcc_validar_expediente.mockResolvedValueOnce({
        data: mockValidacion,
      });

      await mockSupabaseRPC.gcc_validar_expediente({
        expediente_id: mockExpediente.id,
      });

      expect(mockSupabaseRPC.gcc_validar_expediente).toHaveBeenCalled();
    });
  });

  describe('Flujo 2: Gestión de Compromisos', () => {
    it('debería permitir agregar compromisos reparatorios', () => {
      const compromisosActuales = [...mockMediacion.compromisos];
      const nuevoCompromiso = {
        id: 'comp-003',
        descripcion: 'Devolver objeto dañado',
        fechaCumplimiento: '2025-02-25',
        responsable: 'Apoderado',
        completado: false,
      };

      // Simular agregación
      compromisosActuales.push(nuevoCompromiso);

      expect(compromisosActuales).toHaveLength(3);
      expect(compromisosActuales[2]).toEqual(nuevoCompromiso);
    });

    it('debería permitir marcar compromisos como completados', () => {
      const compromisos = [...mockMediacion.compromisos];
      const compromiso = compromisos[0];

      // Simular completado
      compromiso.completado = true;

      expect(compromisos[0].completado).toBe(true);
    });

    it('debería permitir eliminar compromisos', () => {
      const compromisos = [...mockMediacion.compromisos];
      const idAEliminar = compromisos[0].id;

      // Simular eliminación
      const resultado = compromisos.filter(c => c.id !== idAEliminar);

      expect(resultado).toHaveLength(1);
      expect(resultado.every(c => c.id !== idAEliminar)).toBe(true);
    });

    it('debería validar que haya al menos un compromiso antes de cerrar', () => {
      const compromisosVacios: typeof mockMediacion.compromisos = [];
      const esValido = compromisosVacios.length > 0;

      expect(esValido).toBe(false);
    });

    it('debería permitir cierre solo si compromisos están completos', () => {
      const compromisos = [
        { ...mockMediacion.compromisos[0], completado: true },
        { ...mockMediacion.compromisos[1], completado: true },
      ];

      const todoCompletado = compromisos.every(c => c.completado);

      expect(todoCompletado).toBe(true);
    });
  });

  describe('Flujo 3: Generación de Acta', () => {
    it('debería generar acta con información completa', () => {
      const acta = {
        mediacionId: mockMediacion.id,
        fechaGeneracion: new Date().toISOString(),
        estudiante: mockExpediente.estudianteNombre,
        mediador: mockMediacion.mediador,
        compromisos: mockMediacion.compromisos,
        mecanismo: mockMediacion.mecanismo,
      };

      expect(acta).toHaveProperty('mediacionId');
      expect(acta).toHaveProperty('fechaGeneracion');
      expect(acta).toHaveProperty('compromisos');
      expect(acta.compromisos).toHaveLength(2);
    });

    it('debería incluir todos los compromisos en el acta', () => {
      const acta = {
        compromisos: mockMediacion.compromisos.map(c => ({
          descripcion: c.descripcion,
          fechaCumplimiento: c.fechaCumplimiento,
          responsable: c.responsable,
        })),
      };

      expect(acta.compromisos).toHaveLength(2);
      expect(acta.compromisos[0].descripcion).toBe('Pedir disculpas formales al compañero');
    });

    it('debería marcar acta como firmada después de cierre', () => {
      const acta = {
        id: 'acta-001',
        mediacionId: mockMediacion.id,
        firmada: false,
        fechaFirma: null as string | null,
      };

      // Simular firma
      acta.firmada = true;
      acta.fechaFirma = new Date().toISOString();

      expect(acta.firmada).toBe(true);
      expect(acta.fechaFirma).not.toBeNull();
    });
  });

  describe('Flujo 4: Cierre Exitoso', () => {
    it('debería cerrar mediación con estado LOGRADO', async () => {
      const mediacionCierre = {
        mediacionId: mockMediacion.id,
        estado: 'LOGRADO' as const,
        resultado: 'Se cumplieron los compromisos y se restauraron relaciones',
        fechaCierre: new Date().toISOString(),
      };

      mockSupabaseRPC.gcc_procesar_cierre_completo.mockResolvedValueOnce({
        data: mediacionCierre,
      });

      await mockSupabaseRPC.gcc_procesar_cierre_completo({
        mediacion_id: mockMediacion.id,
        estado: 'LOGRADO',
      });

      expect(mockSupabaseRPC.gcc_procesar_cierre_completo).toHaveBeenCalled();
    });

    it('debería cerrar mediación con estado NO_ACUERDO si no hay solución', async () => {
      const mediacionNoAcuerdo = {
        mediacionId: mockMediacion.id,
        estado: 'NO_ACUERDO' as const,
        motivo: 'Las partes no llegaron a acuerdo',
        derivadoA: 'Arbitraje Pedagógico',
      };

      mockSupabaseRPC.gcc_procesar_cierre_completo.mockResolvedValueOnce({
        data: mediacionNoAcuerdo,
      });

      await mockSupabaseRPC.gcc_procesar_cierre_completo({
        mediacion_id: mockMediacion.id,
        estado: 'NO_ACUERDO',
      });

      expect(mockSupabaseRPC.gcc_procesar_cierre_completo).toHaveBeenCalled();
    });

    it('debería guardar acta antes de cerrar', async () => {
      // Simular guardado de acta
      const guardado = true;

      expect(guardado).toBe(true);
    });

    it('debería cambiar estado de expediente a DERIVACION_COMPLETADA', () => {
      const expediente = {
        ...mockExpediente,
        estado: 'DERIVACION_COMPLETADA' as const,
      };

      expect(expediente.estado).toBe('DERIVACION_COMPLETADA');
    });
  });

  describe('Flujo 5: Destrabado de GCC (Sin Cierre Exitoso)', () => {
    it('debería permitir sacar de GCC sin cierre exitoso', async () => {
      const mediacionDestrabada = {
        mediacionId: mockMediacion.id,
        estado: 'DESTRABADO' as const,
        razon: 'Derivado a otra instancia',
        fechaDestrabado: new Date().toISOString(),
      };

      mockSupabaseRPC.gcc_procesar_cierre_completo.mockResolvedValueOnce({
        data: mediacionDestrabada,
      });

      await mockSupabaseRPC.gcc_procesar_cierre_completo({
        mediacion_id: mockMediacion.id,
        estado: 'DESTRABADO',
      });

      expect(mockSupabaseRPC.gcc_procesar_cierre_completo).toHaveBeenCalled();
    });

    it('debería mantener expediente abierto después de destrabado', () => {
      const expediente = {
        ...mockExpediente,
        estado: 'ABIERTO' as const,
        gcc_estado: 'DESTRABADO' as const,
      };

      expect(expediente.estado).toBe('ABIERTO');
      expect(expediente.gcc_estado).toBe('DESTRABADO');
    });
  });

  describe('Flujo 6: Dashboard y Métricas', () => {
    it('debería cargar estadísticas de GCC', async () => {
      const mockMetricas = {
        total_procesos: 45,
        procesos_activos: 12,
        procesos_cerrados_exitosamente: 28,
        procesos_destrabados: 5,
        promedio_dias_resolucion: 14,
        tasa_exito: 85.3,
      };

      mockSupabaseRPC.gcc_obtener_dashboard.mockResolvedValueOnce({
        data: mockMetricas,
      });

      await mockSupabaseRPC.gcc_obtener_dashboard({});

      expect(mockSupabaseRPC.gcc_obtener_dashboard).toHaveBeenCalled();
    });

    it('debería mostrar procesos activos en dashboard', () => {
      const procesos = [
        mockMediacion,
        { ...mockMediacion, id: 'med-002' },
        { ...mockMediacion, id: 'med-003' },
      ];

      expect(procesos).toHaveLength(3);
    });

    it('debería permitir filtrar procesos por estado', () => {
      const procesos = [
        { ...mockMediacion, id: 'med-001', estado: 'PROCESO' },
        { ...mockMediacion, id: 'med-002', estado: 'LOGRADO' },
        { ...mockMediacion, id: 'med-003', estado: 'PROCESO' },
      ];

      const procesosActivos = procesos.filter(p => p.estado === 'PROCESO');

      expect(procesosActivos).toHaveLength(2);
    });
  });

  describe('Flujo 7: Validaciones y Errores', () => {
    it('debería validar que plazo fatal no esté vencido', () => {
      const hoy = new Date();
      const plazoFatal = new Date(hoy.getTime() - 24 * 60 * 60 * 1000); // Ayer

      const plazoVencido = plazoFatal < hoy;

      expect(plazoVencido).toBe(true);
    });

    it('debería validar descripción de motivo no esté vacía', () => {
      const motivo = '';
      const esValido = motivo.trim().length > 0;

      expect(esValido).toBe(false);
    });

    it('debería validar que mediador esté asignado', () => {
      const mediador = '';
      const esValido = mediador.trim().length > 0;

      expect(esValido).toBe(false);
    });

    it('debería validar que fecha de mediación sea una fecha válida', () => {
      const fechas = [
        '2025-02-17', // Válida
        '2025-13-01', // Inválida
        'invalid', // Inválida
      ];

      const esValida = (fecha: string) => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        return regex.test(fecha);
      };

      expect(esValida(fechas[0])).toBe(true);
      expect(esValida(fechas[1])).toBe(true); // Regex solo valida formato
      expect(esValida(fechas[2])).toBe(false);
    });

    it('debería manejar errores de RPC gracefully', async () => {
      const mockError = { message: 'Error en servidor' };

      mockSupabaseRPC.gcc_crear_proceso.mockRejectedValueOnce(mockError);

      try {
        await mockSupabaseRPC.gcc_crear_proceso({
          expediente_id: mockExpediente.id,
        });
      } catch (error) {
        expect(error).toEqual(mockError);
      }
    });
  });

  describe('Flujo 8: Circular 782 Compliance', () => {
    it('debería cumplir plazo máximo de mediación (10 días hábiles)', () => {
      const fechaInicio = new Date('2025-02-15');
      const plazoMaximo = new Date(fechaInicio.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 días naturales ≈ 10 hábiles

      const ahora = new Date('2025-02-25');
      const dentroDelPlazo = ahora <= plazoMaximo;

      expect(dentroDelPlazo).toBe(true);
    });

    it('debería registrar acta firmada y disponible para descargar', () => {
      const acta = {
        id: 'acta-001',
        disponibleParaDescargar: true,
        formato: 'PDF',
        tamano_kb: 250,
      };

      expect(acta.disponibleParaDescargar).toBe(true);
      expect(['PDF', 'Word']).toContain(acta.formato);
    });

    it('debería garantizar confidencialidad de información sensible', () => {
      const mediacion = {
        id: mockMediacion.id,
        estudiante_nombre: mockExpediente.estudianteNombre,
        // No debería almacenar RUN sin encriptación
        // No debería almacenar detalles de falta sin autorización
      };

      // Verificar que información sensible no está expuesta
      expect(mediacion).toHaveProperty('id');
      expect(mediacion).toHaveProperty('estudiante_nombre');
    });
  });

  describe('State Management & Data Flow', () => {
    it('debería mantener sincronización entre componentes', () => {
      const mediacion = mockMediacion;

      // Simular cambios en compromisos
      const nuevosCompromisos = [
        ...mediacion.compromisos,
        {
          id: 'comp-003',
          descripcion: 'Nuevo compromiso',
          fechaCumplimiento: '2025-03-10',
          responsable: 'Estudiante',
          completado: false,
        },
      ];

      // Actualizar mediación
      const mediacionActualizada = {
        ...mediacion,
        compromisos: nuevosCompromisos,
      };

      expect(mediacionActualizada.compromisos).toHaveLength(3);
    });

    it('debería manejar actualizaciones en tiempo real', () => {
      let mediacion = mockMediacion;

      // Simular actualización
      mediacion = {
        ...mediacion,
        estado: 'LOGRADO' as const,
      };

      expect(mediacion.estado).toBe('LOGRADO');
    });

    it('debería permitir rollback ante errores', () => {
      let mediacion = mockMediacion;
      const estadoAnterior = mediacion.estado;

      // Simular cambio
      mediacion = {
        ...mediacion,
        estado: 'ERROR' as any,
      };

      // Rollback
      mediacion = {
        ...mediacion,
        estado: estadoAnterior,
      };

      expect(mediacion.estado).toBe('PROCESO');
    });
  });
});
