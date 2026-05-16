export function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div
        aria-live="polite"
        className="flex flex-col items-center gap-3 text-gray-600"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200"
          style={{ borderTopColor: "var(--color-primario, #06B6D4)" }}
        />
        <p className="text-sm">Cargando tu espacio Cecilia…</p>
      </div>
    </main>
  );
}
