# Guía de Contribución - Centro de Mediación GCC

## Bienvenida

¡Gracias por contribuir al módulo de Centro de Mediación GCC! Esta guía te ayudará a entender cómo contribuir de manera efectiva.

---

## Tabla de Contenidos

1. [Flujo de Trabajo](#flujo-de-trabajo)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Estándares de Código](#estándares-de-código)
4. [Testing](#testing)
5. [Proceso de PR](#proceso-de-pr)
6. [Commit Messages](#commit-messages)
7. [Documentación](#documentación)
8. [Troubleshooting](#troubleshooting)

---

## Flujo de Trabajo

### 1. Preparar Rama

```bash
# Sincronizar main
git checkout main
git pull origin main

# Crear rama descriptiva
git checkout -b feature/nombre-descriptivo
# o fix/nombre-corto
# o docs/tema
```

**Convención de Ramas:**
- `feature/*` - Nuevas funcionalidades
- `fix/*` - Correcciones de bugs
- `docs/*` - Cambios de documentación
- `refactor/*` - Refactorización de código
- `perf/*` - Mejoras de performance

### 2. Implementar Cambios

```bash
# Editar archivos
# Asegúrate de mantener los estándares de código

# Revisar cambios locales
git status
git diff
```

### 3. Testear Localmente

```bash
# Tests unitarios
npm test -- src/features/mediacion/components/MiComponente.test.tsx

# Tests de integración
npm test -- src/features/mediacion/CentroMediacionGCC.integration.test.tsx

# Suite completa
npm test -- --run src/features/mediacion

# Coverage
npm test -- --coverage src/features/mediacion
```

### 4. Commit y Push

```bash
# Revisar cambios finales
git diff

# Commitear (ver sección Commit Messages)
git commit -m "feat: descripción"

# Push a rama remota
git push origin feature/nombre-descriptivo
```

### 5. Crear Pull Request

Ver sección [Proceso de PR](#proceso-de-pr)

---

## Configuración del Entorno

### Requisitos Previos

```
Node.js 20.x
npm 10.x
VS Code (recomendado)
```

### Setup Inicial

```bash
# Clonar repositorio
git clone https://github.com/tu-org/SGCE.git
cd SGCE

# Instalar dependencias
npm install

# Verificar build
npm run build

# Ejecutar tests
npm test -- --run

# Iniciar dev server
npm run dev
```

### VS Code Extensions (Recomendadas)

- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Vitest** - Runner de tests (permite debug en editor)
- **TypeScript Vue Plugin** - Soporte TypeScript
- **Tailwind CSS IntelliSense** - Autocompletado Tailwind

### Configuración VS Code (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.formatOnSave": true
  }
}
```

---

## Estándares de Código

### TypeScript

**Siempre usar strict mode:**
```typescript
// ✅ Bueno - tipos explícitos
interface MiProps {
  id: string;
  nombre: string;
  callback: (valor: string) => void;
}

// ❌ Evitar - tipos implícitos
function miFunc(props) {
  return props.id;
}
```

**Interfaces y Types:**
```typescript
// ✅ Interfaces para props y objetos
interface CompromisosProps {
  compromisos: Compromiso[];
  onAdd: (c: Compromiso) => void;
}

// ✅ Types para union types y aliases
type MediacionEstado = 'PROCESO' | 'LOGRADO' | 'NO_ACUERDO';

// ❌ No mezclar indiscriminadamente
```

### React Components

**Estructura recomendada:**
```typescript
import { FC, useCallback, useMemo } from 'react';

interface MiComponenteProps {
  data: string;
  onApply: (val: string) => void;
}

// Named export
export const MiComponente: FC<MiComponenteProps> = React.memo(
  ({ data, onApply }) => {
    // Hooks al inicio
    const handleClick = useCallback(() => {
      onApply(data);
    }, [data, onApply]);

    const isValid = useMemo(
      () => data.length > 0,
      [data]
    );

    // Render
    return (
      <button onClick={handleClick} disabled={!isValid}>
        {data}
      </button>
    );
  }
);

MiComponente.displayName = 'MiComponente';
```

**Reglas:**
- ✅ Memoizar todos los componentes (React.memo)
- ✅ Usar useCallback para callbacks
- ✅ Usar useMemo para cálculos costosos
- ✅ Agregar displayName para debugging
- ✅ Usar arrow functions para componentes
- ❌ No usar FC<Props> inline (exportar siempre)

### Nombres de Variables

```typescript
// ✅ Bueno
const isMediacionActiva = estado === 'PROCESO';
const handleToggleCompromiso = () => {};
const formatearFecha = (d: Date) => {};
const onSubmit = () => {};

// ❌ Evitar
const activa = estado === 'PROCESO';
const toggle = () => {};
const fmt = ().;
const submit = () => {};
```

### Comentarios

```typescript
// ✅ Comentarios útiles
// Validar plazo fatal antes de permitir derivación (Circular 782)
const puedeDerivarse = verificarPlazo(expediente);

// ❌ Comentarios obvios
// sumar uno
count = count + 1;
```

### Imports

```typescript
// ✅ Bueno - orden: externas, internas, tipos
import React, { FC, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { GccCompromisos } from '@/features/mediacion/components';
import type { Mediacion } from '@/types';

// ❌ Evitar - desorganizado
import type { Mediacion } from '@/types';
import { GccCompromisos } from '@/features';
import React from 'react';
import { supabase } from '@/config';
```

---

## Testing

### Por Qué Testear

- **Confianza:** Cambios sin romper funcionalidad existente
- **Documentación:** Tests actúan como ejemplos de uso
- **Refactorización:** Segura gracias a tests
- **Calidad:** Reducir bugs en producción

### Objetivos de Cobertura

| Nivel | Cobertura | Mínimo |
|---|---|---|
| **Unit Tests** | 85% | 80% |
| **Integration Tests** | 80% | 70% |
| **Overall** | 82% | 75% |

### Escribir Unit Tests

**Patrón AAA (Arrange-Act-Assert):**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GccCompromisos } from './GccCompromisos';

describe('GccCompromisos', () => {
  // ✅ Bueno
  it('should add new compromise when button clicked', () => {
    // Arrange (preparar)
    const handleAdd = vi.fn();
    render(
      <GccCompromisos
        compromisos={[]}
        onAgregarCompromiso={handleAdd}
        {...otherProps}
      />
    );

    // Act (actuar)
    const button = screen.getByRole('button', { name: /agregar/i });
    button.click();

    // Assert (afirmar)
    expect(handleAdd).toHaveBeenCalledOnce();
  });

  // ❌ Evitar - demasiado genérico
  it('works', () => {
    expect(true).toBe(true);
  });
});
```

### Escribir Integration Tests

```typescript
describe('Flujo GCC Completo', () => {
  it('should complete mediation flow: derivation -> compromise -> closure', async () => {
    // Arrange
    const expediente = createMockExpediente();
    const mockCreateDerivacion = vi.fn();

    // Act
    await createDerivacion(expediente);
    const mediacion = await queryMediacion(expediente.id);
    await addCompromiso(mediacion.id, mockCompromiso);
    await closeMediacion(mediacion.id, 'LOGRADO');

    // Assert
    expect(mockCreateDerivacion).toHaveBeenCalled();
    expect(mediacion.estado).toBe('LOGRADO');
  });
});
```

### Mocks y Fixtures

**Usar fixtures en `__mocks__/`:**
```typescript
// src/features/mediacion/__mocks__/fixtures.ts
export const mockExpediente = {
  id: 'exp-001',
  estudianteNombre: 'Juan García',
  plazoFatal: '2025-03-01',
  // ...
};

export const mockMediacion = {
  id: 'med-001',
  estado: 'PROCESO',
  compromisos: [],
};
```

**Usar en tests:**
```typescript
import { mockExpediente } from '../__mocks__/fixtures';

it('should process expediente', () => {
  expect(mockExpediente.estudianteNombre).toBe('Juan García');
});
```

### Debugging Tests

```bash
# Ejecutar test en modo watch
npm test -- --watch src/features/mediacion/components/GccCompromisos.test.tsx

# Con debug info
npm test -- --reporter=verbose src/features/mediacion

# Coverage detallado
npm test -- --coverage --coverage-reporter=html src/features/mediacion
# Abre coverage/index.html en navegador
```

**En el código:**
```typescript
import { screen, debug } from '@testing-library/react';

it('should render button', () => {
  render(<MiComponente />);
  
  // Ver todo el DOM
  debug();
  
  // Ver elemento específico
  const button = screen.getByRole('button');
  debug(button);
});
```

### Test Checklist

Antes de commitear tests:
- ✅ Todos los tests pasan
- ✅ Cobertura ≥ 80%
- ✅ Sin console warnings/errors
- ✅ Sin mocks sin limpiar (cleanup)
- ✅ Sin hardcoded timeouts innecesarios
- ✅ Mensajes de error descriptivos
- ✅ Comentarios donde sea complejo

---

## Proceso de PR

### 1. Crear Pull Request en GitHub

**Usar template si existe:**
```markdown
## Descripción
Qué cambio haces y por qué

## Tipo de cambio
- [ ] Bug fix (non-breaking)
- [ ] Nueva feature (non-breaking)
- [ ] Breaking change
- [ ] Documentación

## Testing
- [ ] Tests añadidos/actualizados
- [ ] Tests passing localmente
- [ ] Coverage ≥ 80%

## Checklist
- [ ] Código sigue estándares
- [ ] Documentación actualizada
- [ ] Sin console logs de debug
- [ ] Sin cambios innecesarios
```

### 2. PR Title Convection

```
feat: agregar validación de plazo fatal
fix: corregir cálculo de compromisos completados
docs: actualizar guía de API
refactor: optimizar renders en GccCompromisos
perf: implementar lazy loading en componentes
```

### 3. Descripción Detallada

```markdown
## Qué cambio
- Agregué validación de plazo fatal en GCC derivation
- Nuevo componente GccPlazoValidator
- 2 nuevos tests

## Por qué
- Circular 782 requiere validación de plazos
- Reducir bugs de derivaciones inválidas

## Cómo testear
npm test -- --run src/features/mediacion
npm run build

## Links relacionados
Closes #123
Relacionado con #456
```

### 4. Responder a Reviews

**Mantener profesionalismo:**
```
✅ Buenas respuestas:
"Buen punto, actualicé el código para usar useMemo aquí"
"Agregué el test que solicitaste"

❌ Evitar:
"no importa"
"ya está bien así"
"¿por qué?"
```

### 5. Merge

Una vez aprobado:
```bash
# Asegurarse que está actualizada
git pull origin main
git rebase origin/main

# Resolver conflictos si hay
git add .
git rebase --continue

# Push
git push origin feature/nombre

# En GitHub: Click "Merge Pull Request"
```

---

## Commit Messages

**Formato Convencional:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Solo documentación
- `style:` - Cambios que no afectan lógica (spacing, semicolons)
- `refactor:` - Cambio que no corrige bugs ni agrega features
- `perf:` - Mejora de performance
- `test:` - Agregando tests
- `chore:` - Cambios en build, dependencias, etc.

### Scope
- mediacion
- gcc
- components
- hooks
- types
- tests

### Subject
- Imperativo: "agregar" no "agregado"
- Minúsculas
- Sin punto al final
- ≤ 50 caracteres

### Ejemplos

```bash
# ✅ Bueno
git commit -m "feat(gcc): agregar validación de plazo fatal

En la derivación a GCC, validar que el plazo fatal sea vigente
según Circular 782. Esto previene derivaciones inválidas.

Closes #456"

# ❌ Evitar
git commit -m "Fixed stuff"
git commit -m "feat: lots of changes to many files lol"
```

---

## Documentación

### Cuándo Documentar

Siempre que:
- [ ] Crées componentes nuevos
- [ ] Cambies props de un componente
- [ ] Agregues funcionalidades
- [ ] Corrijas comportamientos complejos

### Dónde Documentar

```
/docs/API_DOCUMENTATION.md     → Componentes, hooks, RPC
/docs/TESTING_GUIDE.md          → Patrones de testing
/CONTRIBUTING.md                → Esta guía
/src/features/*/README.md       → Descripción del módulo
En el código (JSDoc)            → Funciones complejas
```

### Formato JSDoc

```typescript
/**
 * Genera acta de mediación con datos del proceso
 *
 * @param mediacionId - ID de la mediación
 * @param template - Template HTML del acta
 * @returns Promise<string> - Contenido del acta firmada
 * @throws {Error} Si la mediación no existe
 *
 * @example
 * const acta = await generarActa('med-001', template);
 */
export async function generarActa(
  mediacionId: string,
  template: string
): Promise<string> {
  // ...
}
```

---

## Troubleshooting

### Tests No Pasan

```bash
# Limpiar cache
rm -rf node_modules/.vite

# Reinstalar dependencias
npm install

# Ejecutar específico con verbose
npm test -- --reporter=verbose src/mi-test.test.tsx
```

### Build Fails

```bash
# Revisar errores específicos
npm run build 2>&1 | head -50

# Limpiar todo
rm -rf node_modules dist
npm install
npm run build
```

### TypeScript Errors

```bash
# Ejecutar type check
npx tsc --noEmit

# En VS Code: Reload Window
# Cmd+Shift+P → "Developer: Reload Window"
```

### Performance Issues

```bash
# Analizar bundle
npm run build -- --analyze

# Ver tiempos de build
npm run build -- --reporter=verbose

# Profiling de tests
npm test -- --reporter=verbose
```

---

## Code Review Checklist

Para reviewers:

- ✅ Código sigue estándares
- ✅ Tests adecuados y bien escritos
- ✅ Documentación actualizada
- ✅ No hay performance regressions
- ✅ Manejo de errores completo
- ✅ Sin hardcoded values
- ✅ Accesibilidad considerada
- ✅ Circular 782 compliance (si aplica)
- ✅ Tipos TypeScript correctos
- ✅ Componentes memoizados donde corresponda

---

## Recursos Útiles

### Documentación Tecnológica
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Docs](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Documentación del Proyecto
- [API Documentation](./API_DOCUMENTATION.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Architecture Overview](./ARQUITECTURA.md) (TODO)

### Herramientas Útiles
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [ESLint Playground](https://eslint.org/play)
- [Regex101](https://regex101.com/)

---

## Preguntas Frecuentes

### ¿Cuántos tests debo escribir?
Mínimo para cada archivo nuevo:
- 1 test de render
- 1 test de interacción principal
- 1 test de manejo de errores
- Total: ≥ 80% cobertura

### ¿Debo hacer un test para cada prop?
No necesariamente. Testea:
- Comportamiento visible para el usuario
- Casos edge y errores
- Props que cambien el comportamiento

### ¿Puedo usar console.log?
No en producción. Usar para debugging temporal:
```typescript
// Temporal para debugging
console.log('debug:', valor);

// En PR, remover antes de mergear
```

### ¿Qué pasa si falla un test remotamente?
Verificar:
1. Hay conexión a Supabase (o mocks?)
2. Datos de test son válidos
3. No hay race conditions
4. Revisar logs en GitHub Actions

---

## Contacto y Soporte

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** tech-team@institución.edu

---

**Última actualización:** 18 de febrero de 2026
**Versión:** 1.0.0

¡Gracias por contribuir! 🎉
