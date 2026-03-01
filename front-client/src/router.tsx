import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./app/AppLayout";
import { ProtectedRoute, PublicOnlyRoute } from "./auth/RouteGuards";
import { ErrorPage } from "./pages/ErrorPage/ErrorPage";
import { HistoryPage } from "./pages/HistoryPage/HistoryPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { LoansPage } from "./pages/LoansPage/LoansPage";
import { MainPage } from "./pages/MainPage/MainPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <MainPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
          },
          {
            path: "history",
            element: <HistoryPage />,
          },
          {
            path: "loans",
            element: <LoansPage />,
          },
          {
            path: "error/:code",
            element: <ErrorPage />,
          },
          {
            path: "*",
            element: <ErrorPage code={404} />,
          },
        ],
      },
    ],
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
]);