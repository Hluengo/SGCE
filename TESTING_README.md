# Guía de Automatización de Testing - SGCE

## Suite de Testing Completa

### 🚀 Comandos Disponibles

```bash
# Tests unitarios (Vitest)
npm run test:run

# Tests E2E (Playwright)
npm run test:e2e:run

# Tests de Performance (Playwright + Lighthouse)
npm run test:performance

# Suite completa de regresión (unit + e2e + performance)
npm run test:regression

# Suite completa incluyendo linting, security y build
npm run test:full-suite
```

### 📊 Tests de Performance Incluidos

#### 1. Dashboard Performance
- Carga del dashboard principal (< 3s)
- Renderizado de interfaz GCC (< 2s)

#### 2. GCC Mediation Performance
- Agregar compromisos (< 500ms)
- Múltiples compromisos sin degradación
- Carga de lista de mediaciones (< 2.5s)

#### 3. Search & Navigation Performance
- Búsquedas (< 1s)
- Navegación entre páginas (< 3s por página)
- Interacciones rápidas (sin lag)
- Presión de memoria

### 🔧 Configuración de CI/CD

El workflow de GitHub Actions ejecuta automáticamente:

1. **Tests de Regresión**: Unit + E2E en paralelo
2. **Tests de Performance**: Lighthouse CI con métricas web vitals
3. **Build**: Verificación de compilación exitosa

### 📈 Métricas de Performance

#### Thresholds Configurados:
- **Performance**: > 80 puntos
- **Accesibilidad**: > 90 puntos
- **Best Practices**: > 90 puntos
- **SEO**: > 80 puntos

#### Métricas Personalizadas:
- Tiempo de carga de dashboard: < 3s
- Tiempo de operaciones GCC: < 500ms
- Tiempo de búsqueda: < 1s
- Navegación promedio: < 2s

### 🏃‍♂️ Ejecución Local

```bash
# Ejecutar performance tests
npm run test:performance

# Ver reportes de Playwright
npm run test:e2e:report

# Ejecutar Lighthouse localmente
npm run test:performance:ci
```

### 📋 Checklist de Calidad

- [ ] Tests unitarios pasan
- [ ] Tests E2E pasan
- [ ] Performance cumple thresholds
- [ ] Lighthouse score > 80
- [ ] Build exitoso
- [ ] Security audit limpio

### 🔄 Flujo de Desarrollo

1. **Desarrollo**: Escribe código + tests
2. **Local**: `npm run test:regression`
3. **Commit**: Push a rama
4. **CI**: Tests automáticos en GitHub
5. **Deploy**: Solo si todos pasan

### 📊 Monitoreo

- **GitHub Actions**: Resultados de CI
- **Lighthouse CI**: Reportes de performance
- **Playwright Report**: Detalles de E2E
- **Coverage**: Cobertura de código

¡Tu suite de testing está completamente automatizada! 🎉