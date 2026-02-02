"use client";
import React, { PropsWithChildren } from "react";
import { ComposeChildren } from "../lib/react";
import ReactQueryProvider from "./react-query-provider";

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <ComposeChildren>
      <ReactQueryProvider />
      {children}
    </ComposeChildren>
  );
};
