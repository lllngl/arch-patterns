import { Fragment } from "react";
import { NavLink, useMatches } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { RouteHandle } from "@/router";

type Crumb = {
  label: string;
  to: string;
};

export function AppBreadcrumbs() {
  const matches = useMatches();

  const crumbs: Crumb[] = matches
    .filter((match) => {
      const handle = match.handle as RouteHandle | undefined;
      return handle?.breadcrumb != null;
    })
    .map((match) => {
      const handle = match.handle as RouteHandle;

      const label =
        typeof handle.breadcrumb === "function"
          ? handle.breadcrumb(match.params as Record<string, string>)
          : handle.breadcrumb!;

      return {
        label,
        to: match.pathname,
      };
    });

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={crumb.to}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <NavLink to={crumb.to}>{crumb.label}</NavLink>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
