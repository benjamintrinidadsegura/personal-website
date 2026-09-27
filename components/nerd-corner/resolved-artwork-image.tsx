"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type ResolvedArtworkImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className: string;
  children: ReactNode;
};

export function ResolvedArtworkImage({ src, alt, sizes, className, children }: ResolvedArtworkImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return children;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
