import React from "react";

interface EagleIconProps {
  className?: string;
  size?: number | string;
  detailed?: boolean;
}

/**
 * Águia Oficial Vyra Club
 * Símbolo de força, visão tática e alta performance.
 */
export const EagleIcon: React.FC<EagleIconProps> = ({
  className = "w-5 h-5",
  size,
  detailed = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  if (detailed) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={style}
      >
        <defs>
          <linearGradient id="eagleGoldFire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="35%" stopColor="#FF6A2A" />
            <stop offset="70%" stopColor="#E65100" />
            <stop offset="100%" stopColor="#B33900" />
          </linearGradient>
          <linearGradient id="eagleBeak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFA000" />
          </linearGradient>
        </defs>

        {/* Halo Glow */}
        <circle cx="50" cy="50" r="46" stroke="url(#eagleGoldFire)" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.4" />

        {/* Asas da Águia (Asa Esquerda) */}
        <path
          d="M50 35 C42 27 24 12 4 10 C14 22 22 30 30 40 C18 31 10 30 8 31 C14 39 26 50 38 54 C26 51 14 51 11 53 C18 60 34 65 48 61 Z"
          fill="url(#eagleGoldFire)"
        />
        {/* Detalhe pena esquerda */}
        <path
          d="M40 43 C30 35 15 25 7 19 C15 26 25 35 36 45 Z"
          fill="#FFE0B2"
          opacity="0.8"
        />

        {/* Asas da Águia (Asa Direita) */}
        <path
          d="M50 35 C58 27 76 12 96 10 C86 22 78 30 70 40 C82 31 90 30 92 31 C86 39 74 50 62 54 C74 51 86 51 89 53 C82 60 66 65 52 61 Z"
          fill="url(#eagleGoldFire)"
        />
        {/* Detalhe pena direita */}
        <path
          d="M60 43 C70 35 85 25 93 19 C85 26 75 35 64 45 Z"
          fill="#FFE0B2"
          opacity="0.8"
        />

        {/* Cabeça e Penacho Superior da Águia */}
        <path
          d="M50 20 C54 23 57 28 55 34 C54 37 51 40 50 42 C49 40 46 37 45 34 C43 28 46 23 50 20 Z"
          fill="url(#eagleGoldFire)"
        />
        {/* Penacho da Coroa da Águia */}
        <polygon points="50,15 52,24 48,24" fill="url(#eagleBeak)" />
        {/* Bico Afiado */}
        <polygon points="46,31 41,33 46,36" fill="url(#eagleBeak)" />
        {/* Olho Focado */}
        <circle cx="47" cy="31" r="1" fill="#0A0A0A" />

        {/* Cauda em Tridente Aerodinâmica */}
        <polygon points="50,60 54,88 50,96 46,88" fill="url(#eagleGoldFire)" />
        <polygon points="44,65 42,84 46,78" fill="#E65100" />
        <polygon points="56,65 58,84 54,78" fill="#E65100" />
      </svg>
    );
  }

  // Versão 24x24 simplificada e ultranítida para botões e navegação
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Silhueta da Águia Vyra: Asas abertas, cabeça de águia e cauda estilizada */}
      <path
        d="M12 2.5 L13 5 C15 5.5 17 6.8 22 4 C19.5 8 18 10 16 12 C18.5 11 21 11.5 21.5 12.5 C19 14.5 16.5 15.5 13.5 15.5 L14 21.5 L12 23 L10 21.5 L10.5 15.5 C7.5 15.5 5 14.5 2.5 12.5 C3 11.5 5.5 11 8 12 C6 10 4.5 8 2 4 C7 6.8 9 5.5 11 5 L12 2.5 Z"
        fill="currentColor"
      />
      {/* Bico e detalhes */}
      <path
        d="M12 6 C12.8 6 13.3 6.8 13 7.8 C12.7 8.5 12 9 12 9 C12 9 11.3 8.5 11 7.8 C10.7 6.8 11.2 6 12 6 Z"
        fill="#0A0A0A"
        opacity="0.35"
      />
    </svg>
  );
};
