"use client";

import { useEffect } from "react";
import { setActiveProduct } from "@/app/actions/products";

export function RememberProduct({ id, version }: { id: string; version: string }) {
  useEffect(() => {
    void setActiveProduct(id, version);
  }, [id, version]);
  return null;
}
