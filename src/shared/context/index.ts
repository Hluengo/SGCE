// Context Layer
// Provides React contexts for global state management

// Re-export from providers
export * from './providers';

// Tenant Context (Multi-Tenancy)
export { TenantProvider, useTenant } from './TenantContext';
export * from './TenantProvider';
export * from './TenantRouteGuard';
export type { Establecimiento, TenantContextType } from './TenantContext';

// Convivencia exports aligned with active app provider
export { useConvivencia, ConvivenciaProvider } from './ConvivenciaContext';

// Additional provider exports (new architecture)
export { ExpedientesProvider, UIProvider } from './providers';
