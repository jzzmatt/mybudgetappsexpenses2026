import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12">
      <Card className="w-full p-8 sm:p-12">
        <p className="mb-3 text-sm font-semibold text-[#0063b1]">Budget App</p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
          Your expense management foundation is ready.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6b7280]">
          Supabase configuration and shared interface foundations are in place.
          Authentication will be added in the next approved phase.
        </p>
      </Card>
    </main>
  );
}
