export function toggleMesaCaptainId(
  currentCapitanId: string | undefined,
  personaId: string
): string | undefined {
  return currentCapitanId === personaId ? undefined : personaId;
}

export function clearMesaCaptainIfPerson(
  currentCapitanId: string | undefined,
  personaId: string
): string | undefined {
  return currentCapitanId === personaId ? undefined : currentCapitanId;
}
