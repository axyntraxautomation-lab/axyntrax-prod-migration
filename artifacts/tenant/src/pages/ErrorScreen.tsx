export function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-base font-semibold text-red-700">No se pudo cargar tu espacio</h1>
        <p className="mt-2 text-sm text-gray-700">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
