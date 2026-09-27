import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { Suppliers } from "./pages/Suppliers";
import { Sales } from "./pages/Sales";
import { Customers } from "./pages/Customers";
import { Payments } from "./pages/Payments";
import { Expenses } from "./pages/Expenses";
import { UsersPage } from "./pages/Users";
import { store } from "./app/store";

function Protected({ children }: { children: React.ReactNode }) {
  return store.getState().auth.token ? children : <Navigate to="/login" />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/", element: <Protected><Layout /></Protected>, children: [
    { index: true, element: <Dashboard /> },
    { path: "suppliers", element: <Suppliers /> },
    { path: "sales", element: <Sales /> },
    { path: "customers", element: <Customers /> },
    { path: "payments", element: <Payments /> },
    { path: "expenses", element: <Expenses /> },
    { path: "users", element: <UsersPage /> },
    { path: "profile", element: <Profile /> },
  ] },
]);
