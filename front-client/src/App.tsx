import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./App.css";
import { AuthBootstrap } from "./app/AuthBootstrap";
import { AppErrorBoundary } from "./app/AppErrorBoundary";

function App() {
  return (
    <AppErrorBoundary>
      <AuthBootstrap>
        <RouterProvider router={router} />
      </AuthBootstrap>
    </AppErrorBoundary>
  );
}

export default App;
