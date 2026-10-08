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
  user: { id: number; name: string; email: string };
};

export type AuditLogListResponse = {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function getAuditLogs(page: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(page), limit: "15" });
  return apiRequest<AuditLogListResponse>(`/api/audit-logs?${query}`, { signal });
}
