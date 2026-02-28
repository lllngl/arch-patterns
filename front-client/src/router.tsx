import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./app/AppLayout";
import { ErrorPage } from "./pages/ErrorPage/ErrorPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { MainPage } from "./pages/MainPage/MainPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";

export const router = createBrowserRouter([
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
    ],
  },
  {
    path: "login",
    element: <LoginPage />,
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