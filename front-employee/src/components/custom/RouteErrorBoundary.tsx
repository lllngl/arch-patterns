import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import ErrorPage from "@/pages/ErrorPage/ErrorPage";

export function RouteErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <ErrorPage code={error.status} />;
  }

  return <ErrorPage code={500} />;
}
