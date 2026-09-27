import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import type { CashDeposit, CustomerPayment, Expense, SaleEntry, SupplierEntry, User, Vehicle } from "../lib/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = createApi({
  reducerPath: "api",
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Supplier", "Sale", "Expense", "User", "Report", "Payment", "Vehicle", "PartyName"],
  endpoints: (build) => ({
    login: build.mutation<{ token: string; user: User }, { email: string; password: string }>({ query: (body) => ({ url: "auth/login", method: "POST", body }) }),
    changePassword: build.mutation<{ message: string }, { oldPassword: string; newPassword: string }>({ query: (body) => ({ url: "auth/change-password", method: "POST", body }) }),
    dashboard: build.query<any, string>({ query: (q) => `reports/dashboard${q}`, providesTags: ["Report"] }),
    customerHistory: build.query<{ data: any[] }, string>({ query: (q) => `reports/customer-history${q}`, providesTags: ["Report"] }),
    partyLedger: build.query<{ data: any[] }, string>({ query: (q) => `reports/party-ledger${q}`, providesTags: ["Report", "Payment", "Sale", "Supplier"] }),
    payments: build.query<{ data: CustomerPayment[]; cards: Record<string, { count: number; total: number }> }, string>({ query: (q) => `payments${q}`, providesTags: ["Payment"] }),
    createPayment: build.mutation<any, Partial<CustomerPayment>>({ query: (body) => ({ url: "payments", method: "POST", body }), invalidatesTags: ["Payment", "Report"] }),
    outstanding: build.query<{ data: any[] }, string>({ query: (q) => `payments/outstanding${q}`, providesTags: ["Payment", "Sale"] }),
    cashDeposits: build.query<{ data: CashDeposit[]; cards: Record<string, { count: number; total: number }> }, string>({ query: (q) => `payments/cash-deposits${q}`, providesTags: ["Payment"] }),
    supplierPayments: build.query<{ data: any[]; cards: Record<string, { count: number; total: number }> }, string>({ query: (q) => `payments/suppliers${q}`, providesTags: ["Payment"] }),
    createSupplierPayment: build.mutation<any, any>({ query: (body) => ({ url: "payments/suppliers", method: "POST", body }), invalidatesTags: ["Payment", "Supplier", "Report"] }),
    updateSupplierPayment: build.mutation<any, { id: string; body: any }>({ query: ({ id, body }) => ({ url: `payments/suppliers/${id}`, method: "PATCH", body }), invalidatesTags: ["Payment", "Supplier", "Report"] }),
    deleteSupplierPayment: build.mutation<any, string>({ query: (id) => ({ url: `payments/suppliers/${id}`, method: "DELETE" }), invalidatesTags: ["Payment", "Supplier", "Report"] }),
    supplierOutstanding: build.query<{ data: any[] }, void>({ query: () => "payments/supplier-outstanding", providesTags: ["Payment", "Supplier"] }),
    partyNames: build.query<{ data: any[] }, string>({ query: (q) => `party-names${q}`, providesTags: ["PartyName"] }),
    createPartyName: build.mutation<any, { name: string; type: "customer" | "supplier" }>({ query: (body) => ({ url: "party-names", method: "POST", body }), invalidatesTags: ["PartyName"] }),
    createCashDeposit: build.mutation<any, Partial<CashDeposit>>({ query: (body) => ({ url: "payments/cash-deposits", method: "POST", body }), invalidatesTags: ["Payment", "Report"] }),
    suppliers: build.query<{ data: SupplierEntry[]; total: number }, string>({ query: (q) => `suppliers${q}`, providesTags: ["Supplier"] }),
    supplierHistory: build.query<{ data: any[] }, void>({ query: () => "suppliers/history", providesTags: ["Supplier"] }),
    createSupplier: build.mutation<any, Partial<SupplierEntry>>({ query: (body) => ({ url: "suppliers", method: "POST", body }), invalidatesTags: ["Supplier", "Report"] }),
    updateSupplier: build.mutation<any, { id: string; body: Partial<SupplierEntry> }>({ query: ({ id, body }) => ({ url: `suppliers/${id}`, method: "PATCH", body }), invalidatesTags: ["Supplier", "Report"] }),
    deleteSupplier: build.mutation<any, string>({ query: (id) => ({ url: `suppliers/${id}`, method: "DELETE" }), invalidatesTags: ["Supplier", "Report"] }),
    paySupplier: build.mutation<any, { id: string; status: string; method: string }>({ query: ({ id, ...body }) => ({ url: `suppliers/${id}/payment`, method: "PATCH", body }), invalidatesTags: ["Supplier", "Report"] }),
    sales: build.query<{ data: SaleEntry[]; total: number }, string>({ query: (q) => `sales${q}`, providesTags: ["Sale"] }),
    availableSuppliers: build.query<{ data: any[] }, string>({ query: (q) => `sales/available-suppliers${q}`, providesTags: ["Supplier", "Sale"] }),
    createSale: build.mutation<any, Partial<SaleEntry>>({ query: (body) => ({ url: "sales", method: "POST", body }), invalidatesTags: ["Sale", "Report"] }),
    updateSale: build.mutation<any, { id: string; body: Partial<SaleEntry> }>({ query: ({ id, body }) => ({ url: `sales/${id}`, method: "PATCH", body }), invalidatesTags: ["Sale", "Report"] }),
    deleteSale: build.mutation<any, string>({ query: (id) => ({ url: `sales/${id}`, method: "DELETE" }), invalidatesTags: ["Sale", "Report"] }),
    expenses: build.query<{ data: Expense[]; total: number }, string>({ query: (q) => `expenses${q}`, providesTags: ["Expense"] }),
    expenseHistory: build.query<{ data: any[] }, void>({ query: () => "expenses/history", providesTags: ["Expense"] }),
    createExpense: build.mutation<any, Partial<Expense>>({ query: (body) => ({ url: "expenses", method: "POST", body }), invalidatesTags: ["Expense", "Report"] }),
    updateExpense: build.mutation<any, { id: string; body: Partial<Expense> }>({ query: ({ id, body }) => ({ url: `expenses/${id}`, method: "PATCH", body }), invalidatesTags: ["Expense", "Report"] }),
    deleteExpense: build.mutation<any, string>({ query: (id) => ({ url: `expenses/${id}`, method: "DELETE" }), invalidatesTags: ["Expense", "Report"] }),
    users: build.query<{ data: User[] }, void>({ query: () => "users", providesTags: ["User"] }),
    createUser: build.mutation<any, any>({ query: (body) => ({ url: "users", method: "POST", body }), invalidatesTags: ["User"] }),
    updateUser: build.mutation<any, { id: string; body: Partial<User> }>({ query: ({ id, body }) => ({ url: `users/${id}`, method: "PATCH", body }), invalidatesTags: ["User"] }),
    vehicles: build.query<{ data: Vehicle[] }, void>({ query: () => "vehicles", providesTags: ["Vehicle"] }),
    createVehicle: build.mutation<any, Partial<Vehicle>>({ query: (body) => ({ url: "vehicles", method: "POST", body }), invalidatesTags: ["Vehicle"] }),
    updateVehicle: build.mutation<any, { id: string; body: Partial<Vehicle> }>({ query: ({ id, body }) => ({ url: `vehicles/${id}`, method: "PATCH", body }), invalidatesTags: ["Vehicle"] }),
    deleteVehicle: build.mutation<any, string>({ query: (id) => ({ url: `vehicles/${id}`, method: "DELETE" }), invalidatesTags: ["Vehicle"] }),
    updatePayment: build.mutation<any, { id: string; body: Partial<CustomerPayment> }>({ query: ({ id, body }) => ({ url: `payments/${id}`, method: "PATCH", body }), invalidatesTags: ["Payment", "Report"] }),
    deletePayment: build.mutation<any, string>({ query: (id) => ({ url: `payments/${id}`, method: "DELETE" }), invalidatesTags: ["Payment", "Report"] }),
    updateCashDeposit: build.mutation<any, { id: string; body: Partial<CashDeposit> }>({ query: ({ id, body }) => ({ url: `payments/cash-deposits/${id}`, method: "PATCH", body }), invalidatesTags: ["Payment"] }),
    deleteCashDeposit: build.mutation<any, string>({ query: (id) => ({ url: `payments/cash-deposits/${id}`, method: "DELETE" }), invalidatesTags: ["Payment"] }),
  }),
});

export const {
  useLoginMutation, useChangePasswordMutation, useDashboardQuery, useCustomerHistoryQuery, usePaymentsQuery,
  usePartyLedgerQuery,
  useSuppliersQuery, useSupplierHistoryQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation, usePaySupplierMutation,
  useSalesQuery, useCreateSaleMutation, useUpdateSaleMutation, useDeleteSaleMutation,
  useAvailableSuppliersQuery,
  useExpensesQuery, useExpenseHistoryQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation,
  useUsersQuery, useCreateUserMutation, useUpdateUserMutation,
  useCreatePaymentMutation, useUpdatePaymentMutation, useDeletePaymentMutation, useOutstandingQuery,
  useCashDepositsQuery, useCreateCashDepositMutation, useUpdateCashDepositMutation, useDeleteCashDepositMutation,
  useSupplierPaymentsQuery, useCreateSupplierPaymentMutation, useUpdateSupplierPaymentMutation, useDeleteSupplierPaymentMutation, useSupplierOutstandingQuery,
  usePartyNamesQuery, useCreatePartyNameMutation,
  useVehiclesQuery, useCreateVehicleMutation, useUpdateVehicleMutation, useDeleteVehicleMutation
} = api;
export { API_URL };
