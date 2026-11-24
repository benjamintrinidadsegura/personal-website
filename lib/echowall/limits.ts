export const echoMessageLimit = 500;
export function echoTextLength(value: string) {
  return Array.from(value.normalize("NFC").trim()).length;
}
