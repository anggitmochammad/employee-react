export type Department = {
  id: number
  name: string
}

export type Employee = {
  id: number
  name: string
  email: string
  phone: string
  status: boolean
  departmentId: number
  department: Department
}

export type EmployeeListResponse = {
  data: Employee[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type CreateEmployeeInput = Pick<Employee, 'name' | 'email' | 'phone' | 'departmentId'> & {
  status?: boolean
}

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>
