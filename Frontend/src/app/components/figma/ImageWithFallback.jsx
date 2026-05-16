import { useState } from "react";

export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  className,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || ""}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
