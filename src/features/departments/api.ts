import { apiRequest } from "../../api/client";
import type { Department } from "../../types/employee";

export function getDepartments(signal?: AbortSignal, search = "") {
  const query = search ? `?${new URLSearchParams({ search })}` : "";
  return apiRequest<Department[]>(`/api/departments${query}`, { signal });
}

export function createDepartment(name: string) {
  return apiRequest<Department>("/api/departments", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateDepartment(id: number, name: string) {
  return apiRequest<Department>(`/api/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteDepartment(id: number) {
  return apiRequest<void>(`/api/departments/${id}`, { method: "DELETE" });
}
