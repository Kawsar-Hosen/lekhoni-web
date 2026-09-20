"use client";

import Image from "next/image";
import { useState } from "react";

export default function CoverImg({
  src,
  alt,
  width,
  height,
  sizes,
  priority,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={`cover-wrap${loaded ? " done" : ""}`}>
      {!loaded && <span className="cover-sketch" aria-hidden="true" />}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? undefined : "lazy"}
        priority={priority}
        sizes={sizes}
        onLoad={() => setLoaded(true)}
      />
    </span>
  );
}
