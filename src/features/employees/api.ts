import { apiRequest, apiRequestBlob } from "../../api/client";
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeListResponse,
  UpdateEmployeeInput,
} from "../../types/employee";

export type EmployeeFilters = {
  search?: string;
  departmentId?: number;
  status?: boolean;
};

export type EmployeeListParams = EmployeeFilters & {
  page?: number;
  limit?: number;
};

function appendEmployeeFilters(query: URLSearchParams, filters: EmployeeFilters) {
  if (filters.search) query.set("search", filters.search);
  if (filters.departmentId)
    query.set("departmentId", String(filters.departmentId));
  if (filters.status !== undefined)
    query.set("status", String(filters.status));
}

export function getEmployees(
  params: EmployeeListParams = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 15));
  appendEmployeeFilters(query, params);
  return apiRequest<EmployeeListResponse>(
    `/api/employees?${query.toString()}` as `/api/${string}`,
    { signal },
  );
}

export function getEmployee(id: number, signal?: AbortSignal) {
  return apiRequest<Employee>(`/api/employees/${id}`, { signal });
}

export function exportEmployees(filters: EmployeeFilters = {}) {
  const query = new URLSearchParams();
  appendEmployeeFilters(query, filters);
  return apiRequestBlob(
    `/api/employees/export${query.size ? `?${query.toString()}` : ""}`,
  );
}

export function createEmployee(input: CreateEmployeeInput) {
  return apiRequest<Employee>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEmployee(id: number, input: UpdateEmployeeInput) {
  return apiRequest<Employee>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEmployee(id: number) {
  return apiRequest<void>(`/api/employees/${id}`, { method: "DELETE" });
}
