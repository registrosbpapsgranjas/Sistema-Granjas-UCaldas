export default function Home() {
    const token = localStorage.getItem("token");

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-green-50">
            <h1 className="text-3xl font-bold text-green-700 mb-4">
                Bienvenido al Sistema de Granjas 🌾
            </h1>
            {token ? (
                <p className="text-gray-700">Tu sesión está activa ✅</p>
            ) : (
                <p className="text-red-600">No has iniciado sesión.</p>
            )}
            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/";
                }}
                className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
                Cerrar sesión
            </button>
        </div>
    );
}
