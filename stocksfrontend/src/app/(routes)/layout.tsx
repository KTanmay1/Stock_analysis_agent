import React from "react";
import PageLayout from "@/components/PageLayout";

/**
 * This is the shared layout for all routes in the (routes) group.
 * By applying PageLayout here, we avoid duplicate layouts in each route.
 */
export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageLayout>{children}</PageLayout>;
} 