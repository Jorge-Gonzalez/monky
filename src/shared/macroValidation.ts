export function validateCommand(cmd: string, prefixes: string[]): string | null {
  if (!cmd.trim()) return 'Command is required'
  if (!prefixes.some(prefix => cmd.startsWith(prefix))) {
    return `Command must start with one of: ${prefixes.join(', ')}`
  }
  return null
}

export function isCommandValid(cmd: string, prefixes: string[]): boolean {
  return cmd.trim() !== '' && prefixes.some(prefix => cmd.startsWith(prefix))
}
