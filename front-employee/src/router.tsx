import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./app/AppLayout";
import { ProtectedRoute } from "./components/custom/ProtectedRoute";
import { RouteErrorBoundary } from "./components/custom/RouteErrorBoundary";
import AuthCallbackPage from "./pages/AuthCallbackPage/AuthCallbackPage";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import MainPage from "./pages/MainPage/MainPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import UsersPage from "./pages/UsersPage/UsersPage";
import UserDetailPage from "./pages/UserDetailPage/UserDetailPage";
import AccountsPage from "./pages/AccountsPage/AccountsPage";
import AccountDetailPage from "./pages/AccountDetailPage/AccountDetailPage";
import TariffsPage from "./pages/TariffsPage/TariffsPage";
import LoansPage from "./pages/LoansPage/LoansPage";
import LoanDetailPage from "./pages/LoanDetailPage/LoanDetailPage";

export type RouteHandle = {
  breadcrumb?: string | ((params: Record<string, string>) => string);
};

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    element: <ProtectedRoute />,
    children: [
      {
        errorElement: <RouteErrorBoundary />,
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <MainPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
            handle: { breadcrumb: "Профиль" },
          },
          {
            path: "users",
            handle: { breadcrumb: "Пользователи" },
            children: [
              {
                index: true,
                element: <UsersPage />,
              },
              {
                path: ":userId",
                element: <UserDetailPage />,
                handle: { breadcrumb: "Детали" },
              },
            ],
          },
          {
            path: "accounts",
            handle: { breadcrumb: "Счета" },
            children: [
              {
                index: true,
                element: <AccountsPage />,
              },
              {
                path: ":accountId",
                element: <AccountDetailPage />,
                handle: { breadcrumb: "Детали" },
              },
            ],
          },
          {
            path: "tariffs",
            element: <TariffsPage />,
            handle: { breadcrumb: "Тарифы" },
          },
          {
            path: "loans",
            handle: { breadcrumb: "Кредиты" },
            children: [
              {
                index: true,
                element: <LoansPage />,
              },
              {
                path: ":loanId",
                element: <LoanDetailPage />,
                handle: { breadcrumb: "Детали" },
              },
            ],
          },
        ],
      },
    ],
  },

  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "auth/callback",
    element: <AuthCallbackPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "error/:code",
    element: <ErrorPage />,
  },
  {
    path: "*",
    element: <ErrorPage code={404} />,
  },
]);
