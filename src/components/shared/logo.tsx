// Isotipo del Policlínico San Damián (Manual de Identidad Corporativa,
// sección B01 — Símbolo de la marca): dos pilares en "H" con una cabeza
// circular y una barra central, en los azules corporativos oficiales.
// variant="light" es la versión para fondos oscuros (paneles brand-800/900).
export function Logo({
  className,
  variant = "color",
}: {
  className?: string;
  variant?: "color" | "light";
}) {
  const pilarIzq = variant === "light" ? "#F5F5F5" : "#0043D1";
  const pilarDer = variant === "light" ? "#F5F5F5" : "#102353";
  const cabeza = variant === "light" ? "#8BABEF" : "#8BABEF";
  const barra = variant === "light" ? "#0043D1" : "#0043D1";

  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="10" height="36" rx="5" fill={pilarIzq} />
      <rect x="32" y="6" width="10" height="36" rx="5" fill={pilarDer} />
      <circle cx="24" cy="14" r="6" fill={cabeza} />
      <rect x="6" y="20" width="36" height="10" rx="5" fill={barra} />
    </svg>
  );
}
