"use client";

import { useState } from "react";

export type FallbackImageProps = {
  src: string | null;
  fallback: string | null;
  className?: string;
  loading?: "lazy" | "eager";
};

export function FallbackImage({ src, fallback, className, loading = "lazy" }: FallbackImageProps) {
  const [failed, setFailed] = useState(false);
  const url = failed || !src ? fallback : src;
  if (!url) return null;

  return (
    <img
      key={url}
      src={url}
      alt=""
      loading={loading}
      decoding="async"
      onError={() => {
        if (!failed && fallback) setFailed(true);
      }}
      className={className}
    />
  );
}
