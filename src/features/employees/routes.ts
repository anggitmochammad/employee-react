export const employeeRoutes = {
  list: "/employees",
  create: "/employees/new",
  detail: (id: number) => `/employees/${id}`,
  edit: (id: number) => `/employees/${id}/edit`,
} as const;
