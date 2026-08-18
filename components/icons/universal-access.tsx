import type { SVGProps } from "react"

/**
 * Símbolo Universal de Acessibilidade e Inclusão (Padrão ONU / e-MAG / CNJ / W3C)
 * Substitui o ícone tradicional de cadeira de rodas por uma representação universal,
 * humana e inclusiva de todas as formas de acessibilidade.
 */
export function UniversalAccessIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Círculo que representa a universalidade e o ambiente inclusivo */}
      <circle cx="12" cy="12" r="10" />

      {/* Cabeça do indivíduo */}
      <circle cx="12" cy="6.8" r="1.3" fill="currentColor" stroke="none" />

      {/* Braços abertos em arco ascendente de alcance, dignidade e inclusão */}
      <path d="M5.5 9.5c2.5 1.5 4.5 2 6.5 2s4-0.5 6.5-2" />

      {/* Tronco */}
      <path d="M12 11.5v3.5" />

      {/* Pernas em postura estável e firme */}
      <path d="m8.5 19.5 3.5-4.5 3.5 4.5" />
    </svg>
  )
}
