export function CountryFlag({ code, label }: { code: string; label?: string }) {
  return <svg className="reach-flag" viewBox="0 0 4 3" role={label ? "img" : undefined} aria-label={label} aria-hidden={!label}>
    <use href={`/images/community/country-flags.svg#${code}`} />
  </svg>;
}