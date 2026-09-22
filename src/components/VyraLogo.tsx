import React from "react";

interface VyraLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const VyraLogo: React.FC<VyraLogoProps> = ({
  className = "w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain drop-shadow-md",
  size,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/logo.png"
      alt="Vyra Training & Performance"
      className={className}
      style={style}
    />
  );
};

