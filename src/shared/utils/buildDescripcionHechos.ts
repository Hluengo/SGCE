/**
 * Construye la descripción de hechos de manera condicional basada en
 * si hay un estudiante B registrado o no.
 *
 * - Con estudiante B: "Actores involucrados: A) nombre y curso | B) nombre y curso" + hecho
 * - Sin estudiante B: Solo el hecho escrito sin estructura de actores
 *
 * @param actorANombre - Nombre del estudiante A (principal)
 * @param actorACurso - Curso del estudiante A
 * @param actorBNombre - Nombre del estudiante B (puede ser null o vacío)
 * @param actorBCurso - Curso del estudiante B (puede ser null o vacío)
 * @param descripcionHecho - Narrativa del hecho sin estructura
 * @returns Descripción formateada según si hay estudiante B o no
 */
export const buildDescripcionHechos = (
  actorANombre: string | null | undefined,
  actorACurso: string | null | undefined,
  actorBNombre: string | null | undefined,
  actorBCurso: string | null | undefined,
  descripcionHecho: string
): string => {
  // Verificar si hay datos válidos de estudiante B
  const tieneEstudianteB = actorBNombre && actorBNombre.trim().length > 0;

  if (tieneEstudianteB) {
    // Con estudiante B: incluir estructura de actores
    const actoresResumen = `Actores involucrados: A) ${actorANombre ?? 'Sin nombre'} (${actorACurso ?? 'Sin curso'}) | B) ${actorBNombre} (${actorBCurso ?? 'Sin curso'})`;
    return `${actoresResumen}\n${descripcionHecho}`;
  } else {
    // Sin estudiante B: solo el hecho
    return descripcionHecho;
  }
};

/**
 * Variante alternativa para casos donde tienes el objeto del estudiante B completo.
 * Useful when working with Estudiante objects directly.
 *
 * @param actorANombre - Nombre del estudiante A
 * @param actorACurso - Curso del estudiante A
 * @param actorB - Objeto del estudiante B (puede ser null)
 * @param descripcionHecho - Narrativa del hecho
 * @returns Descripción formateada
 */
export const buildDescripcionHechosFromObject = (
  actorANombre: string | null | undefined,
  actorACurso: string | null | undefined,
  actorB: { nombreCompleto: string; curso: string } | null | undefined,
  descripcionHecho: string
): string => {
  return buildDescripcionHechos(
    actorANombre,
    actorACurso,
    actorB?.nombreCompleto,
    actorB?.curso,
    descripcionHecho
  );
};
