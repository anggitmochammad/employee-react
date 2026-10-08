import { apiRequest } from "../../api/client";
import type {
  CreateEmployeeInput,
  Employee,
  EmployeeListResponse,
  UpdateEmployeeInput,
} from "../../types/employee";

export type EmployeeListParams = {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
  status?: boolean;
};

export function getEmployees(
  params: EmployeeListParams = {},
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  if (params.search) query.set("search", params.search);
  if (params.departmentId)
    query.set("departmentId", String(params.departmentId));
  if (params.status !== undefined) query.set("status", String(params.status));
  return apiRequest<EmployeeListResponse>(
    `/api/employees?${query.toString()}` as `/api/${string}`,
    { signal },
  );
}

export function getEmployee(id: number, signal?: AbortSignal) {
  return apiRequest<Employee>(`/api/employees/${id}`, { signal });
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
