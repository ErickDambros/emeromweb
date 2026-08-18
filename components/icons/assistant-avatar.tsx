import type { SVGProps } from "react"

/**
 * Avatar SVG oficial do Assistente Virtual RADAR / EMERON
 * Representa um assistente digital inteligente, moderno e acessível.
 */
export function AssistantAvatarIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="asstGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Círculo de Fundo */}
      <circle cx="18" cy="18" r="17" fill="url(#asstGrad)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" />

      {/* Antena com pulso de sinal */}
      <line x1="18" y1="6" x2="18" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="5.5" r="2" fill="#38bdf8" />

      {/* Cabeça do Robô / Visor Frame */}
      <rect x="8" y="10" width="20" height="14" rx="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.2" />

      {/* Visor Interno */}
      <rect x="10.5" y="12.5" width="15" height="9" rx="2.5" fill="#1e293b" />

      {/* Olhos Digitais Iluminados */}
      <circle cx="14" cy="16.5" r="1.7" fill="url(#visorGrad)" />
      <circle cx="22" cy="16.5" r="1.7" fill="url(#visorGrad)" />
      {/* Sorriso / Linha de Comunicação */}
      <path d="M15.5 19.2c1 .8 4 .8 5 0" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />

      {/* Corpo / Ombros */}
      <path d="M11 28c0-3 3-5 7-5s7 2 7 5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

      {/* Brilho / Estrela de Inteligência */}
      <path d="M29 7.5l.6 1.3L31 9.4l-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.3z" fill="#facc15" />
    </svg>
  )
}
