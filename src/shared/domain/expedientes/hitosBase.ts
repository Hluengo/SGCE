import type { Hito } from '@/types';

export const hitosBase = (esExpulsion: boolean): Hito[] => {
  const hitos: Hito[] = [
    {
      id: 'h1',
      titulo: 'Inicio de Proceso',
      descripcion: 'Registro de la denuncia y apertura de folio.',
      completado: true,
      fechaCumplimiento: new Date().toISOString().split('T')[0],
      requiereEvidencia: true,
    },
    {
      id: 'h2',
      titulo: 'Notificación a Apoderados',
      descripcion: 'Comunicación oficial del inicio del proceso (Plazo 24h).',
      completado: false,
      requiereEvidencia: true,
    },
    {
      id: 'h3',
      titulo: 'Periodo de Descargos',
      descripcion: 'Recepción de la versión del estudiante y su familia.',
      completado: false,
      requiereEvidencia: true,
    },
    {
      id: 'h4',
      titulo: 'Investigación y Entrevistas',
      descripcion: 'Recopilación de pruebas y testimonios.',
      completado: false,
      requiereEvidencia: true,
    },
  ];

  if (esExpulsion) {
    hitos.push({
      id: 'h-consejo',
      titulo: 'Consulta Consejo Profesores',
      descripcion: 'Hito obligatorio para medidas de expulsión según Ley Aula Segura.',
      completado: false,
      requiereEvidencia: true,
      esObligatorioExpulsion: true,
    });
  }

  hitos.push(
    {
      id: 'h5',
      titulo: 'Resolución del Director',
      descripcion: 'Determinación de la medida formativa o disciplinaria.',
      completado: false,
      requiereEvidencia: true,
    },
    {
      id: 'h6',
      titulo: 'Plazo de Reconsideración',
      descripcion: 'Periodo para apelación ante la entidad sostenedora (15 días hábiles).',
      completado: false,
      requiereEvidencia: false,
    }
  );

  return hitos;
};
