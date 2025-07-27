import Result from 'try-to-result';

export type FetchError =
  | { code: 'NETWORK_ERROR'; cause: unknown }
  | { code: 'HTTP_ERROR'; status: number }
  | { code: 'PARSE_JSON_ERROR'; cause: unknown }
  | { code: 'ABORTED' };

export type FetchJsonResult = Result<unknown, FetchError>;

export async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<FetchJsonResult> {
  const [ok, error, res] = await Result.try(fetch(url, init));

  if (!ok) {
    // no response received
    return Result.error(
      (error as any)?.name === 'AbortError'
        ? { code: 'ABORTED' }
        : { code: 'NETWORK_ERROR', cause: error },
    );
  }

  if (!res.ok) {
    // handle HTTP errors
    return Result.error({ code: 'HTTP_ERROR', status: res.status });
  }

  const [okJson, jsonError, data] = await Result.try(res.json());

  if (!okJson) {
    // failed to parse JSON response
    return Result.error({ code: 'PARSE_JSON_ERROR', cause: jsonError });
  }

  return Result.ok(data as unknown);
}
