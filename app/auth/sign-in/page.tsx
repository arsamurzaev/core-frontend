import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignIn({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }

      continue;
    }

    if (value !== undefined) {
      query.set(key, value);
    }
  }

  const suffix = query.toString();

  redirect(suffix ? `/auth/login?${suffix}` : "/auth/login");
}
