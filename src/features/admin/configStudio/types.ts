export type StudioScope = 'global' | 'tenant';

export interface TableColumnDraft {
  name: string;
  type: string;
  notNull?: boolean;
  unique?: boolean;
  defaultValue?: string;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface TableDraft {
  tableName: string;
  createIfMissing: boolean;
  enableRls: boolean;
  columns: TableColumnDraft[];
  indexes: Array<{ name: string; expression: string; unique?: boolean }>;
}

export interface PolicyDraft {
  tableName: string;
  policyName: string;
  command: 'select' | 'insert' | 'update' | 'delete' | 'all';
  usingExpr?: string;
  withCheckExpr?: string;
}

export interface TriggerDraft {
  tableName: string;
  triggerName: string;
  timing: 'before' | 'after';
  events: Array<'insert' | 'update' | 'delete'>;
  functionName: string;
}

export interface FunctionDraft {
  signature: string;
  bodySql: string;
}

export interface AuthSettingsDraft {
  passwordMinLength: number;
  requireMfaAdmins: boolean;
  sessionTimeoutMinutes: number;
  allowedProviders: string[];
}

export interface StorageBucketDraft {
  bucketName: string;
  isPublic: boolean;
  maxSizeMb: number;
  allowedMimeTypes: string[];
}

export interface EdgeFunctionDraft {
  functionName: string;
  routePath: string;
  enabled: boolean;
  version: string;
  envJson: string;
}

export interface ApiSettingsDraft {
  rateLimitPerMinute: number;
  customClaimsJson: string;
}

export interface ProjectPreferenceDraft {
  key: string;
  valueJson: string;
  description?: string;
}

export interface ConfigStudioState {
  tables: TableDraft[];
  policies: PolicyDraft[];
  triggers: TriggerDraft[];
  functions: FunctionDraft[];
  auth: AuthSettingsDraft;
  storage: StorageBucketDraft[];
  edgeFunctions: EdgeFunctionDraft[];
  api: ApiSettingsDraft;
  projectPreferences: ProjectPreferenceDraft[];
}

export interface GeneratedChangeset {
  module: string;
  title: string;
  summary: string;
  desiredState: ConfigStudioState;
  sql: string[];
  rollbackSql: string[];
  impactPreview: {
    tablesTouched: string[];
    policiesTouched: string[];
    triggersTouched: string[];
    functionsTouched: string[];
    warnings: string[];
  };
}
