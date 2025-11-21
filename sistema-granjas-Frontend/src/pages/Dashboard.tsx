/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { addPending, getAllPending } from '../services/indexedDB';
import { syncPendingData } from '../services/sync';
import Navbar from '../components/Navbar';
import { getUserData } from '../api/auth';

export default function Dashboard() {
    const user = getUserData();
    const [nombre, setNombre] = useState('');
    const [ubicacion, setUbicacion] = useState('');
    const [pendientes, setPendientes] = useState<any[]>([]);
    const [showPendientes, setShowPendientes] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            tipo: 'granja',
            data: {
                nombre,
                ubicacion,
                fecha: new Date().toISOString(),
                usuario: user?.email
            }
        };

        if (!navigator.onLine) {
            await addPending(data);
            alert('📦 Datos guardados localmente (sin conexión)');
            setNombre('');
            setUbicacion('');
            return;
        }

        alert('🌐 Datos enviados al servidor');
        setNombre('');
        setUbicacion('');
    };

    const verPendientes = async () => {
        const pendientesData = await getAllPending();
        setPendientes(pendientesData);
        setShowPendientes(true);
    };

    const sincronizarDatos = async () => {
        if (navigator.onLine) {
            await syncPendingData();
            alert('Sincronización completada');
            setPendientes([]);
            setShowPendientes(false);
        } else {
            alert('No hay conexión a internet para sincronizar');
        }
    };

    return (
        <div className="min-h-screen bg-green-50">
            <Navbar />

            <div className="container mx-auto p-6 pt-20">
                {/* Header del Dashboard */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-green-800 mb-2">
                        🌱 Sistema de Gestión Agrícola
                    </h1>
                    <p className="text-green-600">
                        Bienvenido, <strong>{user?.nombre}</strong> ({user?.rol})
                    </p>
                </div>

                {/* Formulario */}
                <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-green-800 mb-4">
                        Registrar Nueva Granja
                    </h2>

                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de la granja
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Granja Montelindo"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ubicación
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Vía al Magdalena"
                                value={ubicacion}
                                onChange={(e) => setUbicacion(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition font-medium"
                        >
                            {navigator.onLine ? '🌐 Guardar en Servidor' : '📦 Guardar Localmente'}
                        </button>
                    </form>

                    {/* Botones de Acción */}
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={verPendientes}
                            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
                        >
                            📥 Ver Pendientes
                        </button>

                        {navigator.onLine && (
                            <button
                                onClick={sincronizarDatos}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                                🔄 Sincronizar
                            </button>
                        )}
                    </div>

                    {/* Estado de Conexión */}
                    <div className="mt-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${navigator.onLine
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {navigator.onLine ? '🟢 En línea' : '🔴 Sin conexión'}
                        </span>
                    </div>
                </div>

                {/* Modal de Datos Pendientes */}
                {showPendientes && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-800">
                                        Datos Pendientes
                                    </h3>
                                    <button
                                        onClick={() => setShowPendientes(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {pendientes.length === 0 ? (
                                    <p className="text-gray-600 text-center py-4">
                                        No hay datos pendientes
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {pendientes.map((item, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                <p className="font-medium">{item.data.nombre}</p>
                                                <p className="text-sm text-gray-600">{item.data.ubicacion}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowPendientes(false)}
                                        className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}