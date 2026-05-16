export type Company = {
  id: string; name: string; industry: string; master_key: string; email: string; created_at: string;
};
export type Worker = {
  id: string; company_id: string; role: string; assigned_modules: string[]; worker_key: string; email: string;
};
export type ModuleInfo = {
  id: string; name: string; version: string; download_url: string; active: boolean;
};
export type KPI = {
  id: string; metric: string; value: number; timestamp: string;
};
