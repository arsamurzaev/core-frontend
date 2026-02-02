import axios from 'axios';

export default async function Home() {
  try {
    const { data } = await axios.get('http://localhost:4000/catalog/current', {
      headers: { 'x-forwarded-host': 'lumen.myctlg.ru' },
    });

    return (
      <main>
        <code>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </code>
      </main>
    );
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Request failed';

    return (
      <main>
        <code>
          <pre>{JSON.stringify({ error: message }, null, 2)}</pre>
        </code>
      </main>
    );
  }
}