import { apiRequest } from "../../api/client";

export type AuditLog = {
  id: number;
  userId: number;
  action: "create" | "update" | "delete";
  entity: "department" | "employee";
  entityId: number;
  entityData: Record<string, unknown> | null;
  previousData: Record<string, unknown> | null;
  entityDataSource: "snapshot" | "current" | "unavailable";
  createdAt: string;
  user: AuditActor;
};

export type AuditActor = { id: number; name: string; email: string };

export type AuditLogFilters = {
  action?: AuditLog["action"];
  userId?: number;
  startDate?: string;
  endDate?: string;
  sortOrder?: "asc" | "desc";
};

export type AuditLogListResponse = {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function getAuditLogs(
  page: number,
  signal?: AbortSignal,
  filters: AuditLogFilters = {},
) {
  const query = new URLSearchParams({ page: String(page), limit: "15" });
  if (filters.action) query.set("action", filters.action);
  if (filters.userId) query.set("userId", String(filters.userId));
  if (filters.startDate) query.set("startDate", filters.startDate);
  if (filters.endDate) query.set("endDate", filters.endDate);
  if (filters.sortOrder) query.set("sortOrder", filters.sortOrder);
  return apiRequest<AuditLogListResponse>(`/api/audit-logs?${query}`, { signal });
}

export function getAuditActors(signal?: AbortSignal) {
  return apiRequest<AuditActor[]>("/api/audit-logs/users", { signal });
}
