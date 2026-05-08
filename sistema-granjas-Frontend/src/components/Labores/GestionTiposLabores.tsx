import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import tipoLaborService from '../../services/tipoLaboresService';

const GestionTiposLabores: React.FC = () => {
    const [tipos, setTipos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);

    const emptyForm = { nombre: '', descripcion: '' };
    const [form, setForm] = useState(emptyForm);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => { cargar(); }, []);

    const cargar = async () => {
        setLoading(true);
        try {
            const data = await tipoLaborService.obtenerTiposLabor();
            setTipos(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Error al cargar tipos de labor');
        } finally {
            setLoading(false);
        }
    };

    const abrirCrear = () => {
        setEditandoId(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const abrirEditar = (tipo: any) => {
        setEditandoId(tipo.id);
        setForm({ nombre: tipo.nombre || '', descripcion: tipo.descripcion || '' });
        setShowForm(true);
    };

    const cancelar = () => {
        setShowForm(false);
        setEditandoId(null);
        setForm(emptyForm);
    };

    const guardar = async () => {
        if (!form.nombre.trim() || form.nombre.trim().length < 3) {
            toast.error('El nombre debe tener al menos 3 caracteres');
            return;
        }
        setGuardando(true);
        try {
            if (editandoId) {
                const actualizado = await tipoLaborService.crearTipoLabor({ ...form });
                setTipos(prev => prev.map(t => t.id === editandoId ? actualizado : t));
                await cargar();
                toast.success('Tipo de labor actualizado');
            } else {
                await tipoLaborService.crearTipoLabor({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || undefined });
                toast.success('Tipo de labor creado');
                await cargar();
            }
            cancelar();
        } catch (e: any) {
            toast.error(e.message || 'Error al guardar');
        } finally {
            setGuardando(false);
        }
    };

    const guardarEdicion = async () => {
        if (!form.nombre.trim() || form.nombre.trim().length < 3) {
            toast.error('El nombre debe tener al menos 3 caracteres');
            return;
        }
        if (!editandoId) return;
        setGuardando(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tipos-labor/${editandoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || undefined }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Error ${res.status}`);
            }
            toast.success('Tipo de labor actualizado');
            await cargar();
            cancelar();
        } catch (e: any) {
            toast.error(e.message || 'Error al actualizar');
        } finally {
            setGuardando(false);
        }
    };

    const eliminar = async (id: number, nombre: string) => {
        if (!confirm(`¿Eliminar el tipo de labor "${nombre}"? Las labores asociadas quedarán sin tipo.`)) return;
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/tipos-labor/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || `Error ${res.status}`);
            }
            setTipos(prev => prev.filter(t => t.id !== id));
            toast.success('Tipo de labor eliminado');
        } catch (e: any) {
            toast.error(e.message || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Tipos de Labor</h2>
                    <p className="text-sm text-gray-500">Categorías disponibles para clasificar las labores del sistema.</p>
                </div>
                <button onClick={abrirCrear}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                    <i className="fas fa-plus"></i> Nuevo Tipo
                </button>
            </div>

            {/* Formulario inline */}
            {showForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-800 mb-4 text-sm">
                        {editandoId ? 'Editar tipo de labor' : 'Nuevo tipo de labor'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input type="text" value={form.nombre}
                                onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Ej: Fumigación, Poda, Riego..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <input type="text" value={form.descripcion}
                                onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Descripción opcional..." />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4 justify-end">
                        <button onClick={cancelar} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onClick={editandoId ? guardarEdicion : guardar} disabled={guardando}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                            {guardando ? 'Guardando...' : (editandoId ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="text-gray-500 text-sm">Cargando...</span>
                </div>
            ) : tipos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <i className="fas fa-tags text-3xl text-gray-300 block mb-3"></i>
                    <p className="text-gray-500 font-medium">No hay tipos de labor registrados</p>
                    <p className="text-gray-400 text-sm mt-1">Crea el primer tipo haciendo clic en "Nuevo Tipo"</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tipos.map(tipo => (
                                <tr key={tipo.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3 text-sm font-mono text-gray-400">#{tipo.id}</td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                                            <i className="fas fa-tag text-blue-500 text-xs"></i>
                                            {tipo.nombre}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-gray-500">{tipo.descripcion || <span className="italic text-gray-300">Sin descripción</span>}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => abrirEditar(tipo)}
                                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors" title="Editar">
                                                <i className="fas fa-edit text-xs"></i>
                                            </button>
                                            <button onClick={() => eliminar(tipo.id, tipo.nombre)}
                                                className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors" title="Eliminar">
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                        {tipos.length} tipo(s) de labor registrado(s)
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionTiposLabores;
