
/**
 * Tipos TypeScript para el módulo de Gestión de Expedientes Disciplinarios
 * Cumple con Circulares 781 y 782 de la Superintendencia de Educación
 */

/**
 * Estados del expediente según normativa Circular 782
 * NOTA: Unificado con EtapaProceso para mantener consistencia
 */
export type EstadoExpediente = EtapaProceso;

/**
 * Tipos de medidas disciplinarias según Circular 782
 * Artículo 10 - Tipos de medidas
 */
export type TipoMedida =
  | 'amonestacion_oral'
  | 'amonestacion_escrita'
  | 'compromiso_conductual'
  | 'servicio_comunitario'
  | 'suspension_1_5_dias'
  | 'suspension_mas_5_dias'
  | 'cancelacion_matricula';

/**
 * Tipos de documentos según normativa
 */
export type TipoDocumento =
  | 'acta'
  | 'resolucion'
  | 'carta'
  | 'constancia'
  | 'derivacion'
  | 'compromiso'
  | 'otro';

/**
 * Gravedad de la falta según Circular 782
 * Nota: Valores en mayúsculas para compatibilidad legacy
 */
export type GravedadFalta =
  | 'LEVE'
  | 'RELEVANTE'
  | 'GRAVE'
  | 'GRAVISIMA_EXPULSION';

/**
 * Tipo de falta según clasificación normativa
 */
export type TipoFalta =
  | 'conducta_contraria'
  | 'falta_grave'
  | 'falta_gravisima';

/**
 * Nivel de urgencia para derivaciones
 */
export type NivelUrgencia = 'baja' | 'media' | 'alta' | 'critica';

/**
 * Resultado de mediación GCC
 */
export type ResultadoMediacion =
  | 'acuerdo_total'
  | 'acuerdo_parcial'
  | 'sin_acuerdo'
  | 'no_conciliables';

/**
 * Información del alumno involucrado en el expediente
 */
export interface Alumno {
  /** ID único del estudiante */
  id: string;
  /** RUN sin punto ni guión */
  run: string;
  /** Nombre completo */
  nombreCompleto: string;
  /** Curso actual */
  curso: string;
  /** Nivel educativo (basica/media) */
  nivel: 'basica' | 'media';
  /** Año escolar */
  anioEscolar: number;
  /** Fecha de nacimiento */
  fechaNacimiento: string;
  /** Sexo M/F */
  sexo: 'M' | 'F';
  /** Indicador NEE */
  tieneNEE: boolean;
  /** Tipo NEE si aplica */
  tipoNEE?: string;
  /** Fecha de incorporación al establecimiento */
  fechaIncorporacion?: string;
  /** Estado actual */
  estado: 'activo' | 'retirado' | 'expulsado';
}

/**
 * Datos del apoderado
 */
export interface Apoderado {
  id: string;
  run: string;
  nombreCompleto: string;
  parentesco: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaRetiro?: string;
}

/**
 * Participante en el expediente (puede ser alumno, testigo, etc.)
 */
export interface Participante {
  /** ID único */
  id: string;
  /** Tipo de participante */
  tipo: 'alumno' | 'apoderado' | 'docente' | 'inspector' | 'otro';
  /** Referencia al sujeto */
  sujetoId: string;
  /** Nombre para display */
  nombre: string;
  /** Rol en el expediente */
  rol: 'involucrado' | 'denunciante' | 'testigo' | 'victima' | 'afecto';
  /** Curso si aplica */
  curso?: string;
  /** Datos de contacto */
  contacto?: string;
  /** Fecha de participación */
  fechaIncorporacion: string;
  /** Documento de consentimiento si aplica */
  consentimiento?: boolean;
}

/**
 * Hecho o conducta que origina el expediente
 */
export interface Hecho {
  /** ID único */
  id: string;
  /** Fecha y hora del hecho (ISO 8601) */
  fechaHecho: string;
  /** Lugar donde ocurrió */
  lugar: string;
  /** Tipo de falta según normativa */
  tipoFalta: TipoFalta;
  /** Gravedad de la falta */
  gravedad: GravedadFalta;
  /** Descripción detallada y objetiva */
  descripcion: string;
  /** Circunstancias del hecho */
  circunstancias?: string;
  /** Daños causados si aplica */
  danos?: string;
  /** Víctimas directamente involucradas */
  victimas?: string[];
  /** Testigos del hecho */
  testigos?: string[];
  /** Evidencias asociadas */
  evidenciasIds?: string[];
  /** Valoración inicial del instructor */
  valoracionInicial?: string;
  /** Normativa infringida */
  normasInfringidas?: string[];
}

/**
 * Medida disciplinaria aplicada o propuesta
 */
export interface Medida {
  /** ID único */
  id: string;
  /** Tipo de medida */
  tipo: TipoMedida;
  /** Descripción detallada */
  descripcion: string;
  /** Fecha de aplicación */
  fechaAplicacion: string;
  /** Fecha de término si aplica */
  fechaTermino?: string;
  /** Responsable de ejecución */
  responsable: string;
  /** Estado de cumplimiento */
  estadoCumplimiento: 'pendiente' | 'en_ejecucion' | 'cumplida' | 'incumplida' | 'revisada';
  /** Evidencias de cumplimiento */
  evidencias?: string[];
  /** Observaciones */
  observaciones?: string;
  /** Fundamento normativo */
  fundamentoNormativo?: string;
  /** Plazo fatal de cumplimiento */
  plazoCumplimiento?: string;
}

/**
 * Documento asociado al expediente
 */
export interface Documento {
  /** ID único */
  id: string;
  /** Tipo de documento */
  tipo: TipoDocumento;
  /** Título descriptivo */
  titulo: string;
  /** Fecha del documento */
  fecha: string;
  /** URL del archivo en storage */
  urlArchivo: string;
  /** Nombre del archivo */
  nombreArchivo: string;
  /** Hash SHA-256 para integridad */
  hashIntegridad?: string;
  /** Tamaño en bytes */
  tamanho?: number;
  /** Usuario que subió el documento */
  subidoPor: string;
  /** Fecha de subida */
  fechaSubida: string;
  /** Es público o restringido */
  esPublico: boolean;
  /** Nivel de confidencialidad */
  nivelConfidencialidad: 'baja' | 'media' | 'alta';
  /** Observaciones */
  observaciones?: string;
}

/**
 * Derivación a Centro de Mediación GCC
 */
export interface DerivacionGCC {
  /** ID único */
  id: string;
  /** ID del expediente origen */
  expedienteId: string;
  /** Fecha de derivación */
  fechaDerivacion: string;
  /** Motivo de derivación */
  motivo: string;
  /** Objetivos de la mediación */
  objetivos?: string[];
  /** Mediador asignado */
  mediadorAsignado?: string;
  /** Fecha programada de mediación */
  fechaMediacion?: string;
  /** Estado de la derivación */
  estado: 'pendiente' | 'en_proceso' | 'concluida' | 'cancelada';
  /** Resultado de mediación */
  resultado?: ResultadoMediacion;
  /** Acuerdos alcanzados */
  acuerdos?: string[];
  /** Compromisos establecidos */
  compromisos?: string[];
  /** Fecha de cierre */
  fechaCierre?: string;
  /** Observaciones */
  observaciones?: string;
}

/**
 * Acción registrada en la bitácora
 */
export interface Bitacora {
  /** ID único */
  id: string;
  /** Timestamp de la acción (ISO 8601) */
  timestamp: string;
  /** Tipo de acción */
  tipoAccion: string;
  /** Descripción de la acción */
  descripcion: string;
  /** Usuario que realizó la acción */
  usuarioId: string;
  /** Nombre del usuario para display */
  usuarioNombre: string;
  /** Rol del usuario */
  usuarioRol: string;
  /** Datos adicionales en JSON */
  datosAdicionales?: Record<string, unknown>;
  /** Es acción crítica para auditoría */
  esCritica: boolean;
  /** IP del usuario */
  ipUsuario?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Registro de auditoría
 */
export interface Auditoria {
  /** ID único */
  id: string;
  /** Timestamp del evento */
  timestamp: string;
  /** Tipo de operación */
  operacion: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  /** Tabla afectada */
  tabla: string;
  /** ID del registro afectado */
  registroId: string;
  /** Usuario que realizó la acción */
  usuarioId: string;
  /** Valores anteriores (para UPDATE/DELETE) */
  valoresAnteriores?: Record<string, unknown>;
  /** Valores nuevos (para INSERT/UPDATE) */
  valoresNuevos?: Record<string, unknown>;
  /** IP del usuario */
  ipUsuario: string;
  /** User agent */
  userAgent: string;
  /** Éxito de la operación */
  exito: boolean;
  /** Mensaje de error si aplica */
  mensajeError?: string;
}

/**
 * Filtros para búsqueda de expedientes
 */
export interface FiltroExpediente {
  /** Filtrar por estudiante */
  estudianteId?: string;
  /** Filtrar por curso */
  curso?: string;
  /** Filtrar por estado */
  estado?: EstadoExpediente[];
  /** Filtrar por fecha inicio */
  fechaInicioDesde?: string;
  /** Filtrar por fecha inicio */
  fechaInicioHasta?: string;
  /** Filtrar por tipo de falta */
  tipoFalta?: TipoFalta[];
  /** Filtrar por gravedad */
  gravedad?: GravedadFalta[];
  /** Filtrar por medida aplicada */
  medidaAplicada?: TipoMedida[];
  /** Filtrar por encargado */
  encargadoId?: string;
  /** Buscar en descripción */
  busqueda?: string;
  /** Solo expedientes con derivación GCC */
  conDerivacionGCC?: boolean;
  /** Plazo próximo a vencer (días) */
  plazoProximoVencer?: number;
}

/**
 * Datos institucionales para documentos
 */
export interface DatosInstitucionales {
  /** Nombre del establecimiento */
  nombre: string;
  /** RBD */
  rbd: string;
  /** Dirección */
  direccion: string;
  /** Teléfono */
  telefono: string;
  /** Email institucional */
  email: string;
  /** Nombre del sostenedor */
  nombreSostenedor: string;
  /** Nombre del director */
  nombreDirector: string;
  /** RUN del director */
  runDirector: string;
  /** Título profesional director */
  tituloDirector: string;
  /** Logo URL */
  logoUrl?: string;
}

/**
 * Plantilla de resolución ministerial
 */
export interface ResolucionData {
  /** Número de resolución */
  numeroResolucion: string;
  /** Fecha de resolución */
  fechaResolucion: string;
  /** Tipo de falta */
  tipoFalta: TipoFalta;
  /** Gravedad */
  gravedad: GravedadFalta;
  /** Medida aplicada */
  medidaAplicada: TipoMedida;
  /** Fundamentos de hecho */
  fundamentosHecho: string[];
  /** Fundamentos de derecho */
  fundamentosDerecho: string[];
  /** Considerandos */
  considerandos: string[];
  /** Vistos */
  vistos: string[];
  /** Resuelve */
  resuelve: string[];
  /** Plazo de reconsideración */
  plazoReconsideracion?: string;
  /** Fundamento proporcionalidad */
  proporcionalidad?: string;
}

/**
 * Datos para generación de carta de notificación
 */
export interface CartaNotificacionData {
  /** Tipo de carta */
  tipo: 'inicio' | 'citacion' | 'resolucion' | 'reconsideracion' | 'otro';
  /** Destinatario */
  destinatario: string;
  /** RUN destinatario */
  runDestinatario: string;
  /** Domicilio */
  domicilio: string;
  /** Fecha */
  fecha: string;
  /** Referencia (folio expediente) */
  referencia: string;
  /** Asunto */
  asunto: string;
  /** Cuerpo de la carta */
  cuerpo: string;
  /** Fundamento legal */
  fundamentoLegal?: string;
  /** Plazo si aplica */
  plazo?: string;
  /** Firman */
  firmaNombre: string;
  /** Cargo del firma */
  firmaCargo: string;
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  /** Campo por el cual ordenar */
  field: string;
  /** Dirección del orden */
  direction: 'asc' | 'desc';
}

/**
 * Configuración de exportación
 */
export interface ExportConfig {
  /** Formato de exportación */
  formato: 'pdf' | 'xlsx' | 'csv' | 'json';
  /** Incluir documentos adjuntos */
  incluirDocumentos: boolean;
  /** Incluir bitácora */
  incluirBitacora: boolean;
  /** Incluir auditoría */
  incluirAuditoria: boolean;
  /** Marcar como confidencial */
  esConfidencial: boolean;
}

/**
 * Resultado de operación CRUD
 */
export interface OperationResult<T> {
  /** Indica si fue exitosa */
  success: boolean;
  /** Datos resultantes si aplica */
  data?: T;
  /** Mensaje para el usuario */
  message?: string;
  /** Código de error si aplica */
  errorCode?: string;
  /** Lista de errores si aplica */
  errors?: string[];
}

/**
 * Resultado de paginación para listados
 */
export interface PaginatedResult<T> {
  /** Datos de la página */
  data: T[];
  /** Total de registros */
  total: number;
  /** Página actual */
  page: number;
  /** Elementos por página */
  pageSize: number;
  /** Total de páginas */
  totalPages: number;
  /** Hay más páginas */
  hasMore: boolean;
}

// ============================================
// TIPOS LEGACY (mantenidos para compatibilidad)
// ============================================

export type EtapaProceso = 
  | 'INICIO' 
  | 'NOTIFICADO' 
  | 'DESCARGOS' 
  | 'INVESTIGACION' 
  | 'RESOLUCION_PENDIENTE' 
  | 'RECONSIDERACION' 
  | 'CERRADO_SANCION' 
  | 'CERRADO_GCC';

export interface Hito {
  id: string;
  titulo: string;
  descripcion: string;
  fechaCumplimiento?: string;
  completado: boolean;
  requiereEvidencia: boolean;
  evidenciaUrl?: string;
  esObligatorioExpulsion?: boolean;
}

/**
 * Expediente completo con todos los campos
 */
export interface ExpedienteCompleto {
  /** ID único del expediente */
  id: string;
  /** Folio del expediente */
  folio: string;
  /** Alumno involucrado */
  alumno: Alumno;
  /** Apoderado */
  apoderado?: Apoderado;
  /** Hechos registrados */
  hechos: Hecho[];
  /** Participantes adicionales */
  participantes: Participante[];
  /** Medidas aplicadas */
  medidas: Medida[];
  /** Documentos asociados */
  documentos: Documento[];
  /** Derivación GCC si existe */
  derivacionGCC?: DerivacionGCC;
  /** Bitácora de acciones */
  bitacora: Bitacora[];
  /** Etapa actual del proceso */
  etapa: EtapaProceso;
  /** Fecha de creación */
  fechaCreacion: string;
  /** Usuario creador */
  creadoPor: string;
  /** Usuario responsable actual */
  responsableId: string;
  /** Observaciones generales */
  observaciones?: string;
  /** Es expediente de expulsión */
  esExpulsion: boolean;
  /** Tiene acciones previas registradas */
  tieneAccionesPrevias: boolean;
  /** Plazo fatal según normativa */
  plazoFatal: string;
  /** Plazo en días hábiles */
  plazoDiasHabiles: number;
}

/**
 * Expediente simplificado (legacy)
 */
export interface Expediente {
  id: string;
  dbId?: string;
  nnaNombre: string;
  nnaCurso?: string | null;
  nnaNombreB?: string | null;
  nnaCursoB?: string | null;
  etapa: EtapaProceso;
  gravedad: GravedadFalta;
  fechaInicio: string;
  plazoFatal: string;
  encargadoId: string;
  esProcesoExpulsion?: boolean;
  accionesPrevias: boolean; 
  hitos: Hito[];
  interactionType?: string | null;
  additionalData?: Record<string, unknown> | null;
}

export interface Estudiante {
  id: string;
  nombreCompleto: string;
  curso?: string | null;
}

export interface User {
  id: string;
  nombre: string;
  rol: 'DIRECTOR' | 'ENCARGADO_CONVIVENCIA' | 'PSICOLOGO' | 'ADMIN';
}
/**
 * Configuración de branding por tenant (establecimiento/colegio)
 * Almacena personalización visual: logos, colores, tipografías
 */
export interface TenantBrandingConfig {
  id: string;
  establecimiento_id: string;
  /** URL del logo institucional */
  logo_url: string | null;
  /** URL del favicon (icono de pestaña) */
  favicon_url: string | null;
  /** Color primario (hex) */
  color_primario: string;
  /** Color secundario (hex) */
  color_secundario: string;
  /** Color de acentos/botones (hex) */
  color_acento: string;
  /** Color del texto (hex) */
  color_texto: string;
  /** Color de fondo (hex) */
  color_fondo: string;
  /** Nombre público del establecimiento (mostrado en título y UI) */
  nombre_publico: string;
  /** Familia tipográfica para cuerpo de texto */
  tipografia_body: string;
  /** Familia tipográfica para títulos */
  tipografia_heading: string;
  /** Timestamp de creación */
  created_at?: string;
  /** Timestamp de última actualización */
  updated_at?: string;
}