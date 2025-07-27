import { fetchJson } from './fetchJson';

export type User = { id: string; name: string; companyId: string };

export async function fetchUser(id: string): Promise<User | null> {
  const [ok, error, data] = await fetchJson(
    `https://api.example.com/users/${id}`,
  );

  if (ok) return data as User;

  if (error.code === 'ABORTED') {
    return null;
  }

  if (error.code !== 'HTTP_ERROR') {
    throw new Error(`Failed to fetch user: ${error.code}`, {
      cause: error.cause,
    });
  }

  if (error.status === 404) {
    return null;
  }

  throw new Error(`HTTP error on fetching user: ${error.status}`);
}
