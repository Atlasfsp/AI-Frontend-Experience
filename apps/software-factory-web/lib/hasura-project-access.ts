export type ProjectReadAuthorization = 'allowed' | 'denied' | 'unavailable' | 'missing_token';

export function queryReadsEngineeringProjects(query: string | null | undefined): boolean {
  return typeof query === 'string' && /\bfluxcore_project_read_model\b/.test(query);
}

export async function authorizeEngineeringProjectRead(
  sdxApiUrl: string,
  accessToken: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<ProjectReadAuthorization> {
  if (!accessToken) return 'missing_token';
  try {
    const response = await fetcher(`${sdxApiUrl.replace(/\/$/, '')}/v1/projects/read-authorization`, {
      method: 'GET',
      cache: 'no-store',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (response.status === 401 || response.status === 403) return 'denied';
    if (!response.ok) return 'unavailable';
    const decision = await response.json() as { authorized?: unknown };
    return decision.authorized === true ? 'allowed' : 'denied';
  } catch {
    return 'unavailable';
  }
}
