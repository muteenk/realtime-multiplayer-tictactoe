/** User-facing message from thrown values (Error, string, or unknown). */
export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Something went wrong'
}
