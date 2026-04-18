// src/components/Recomendaciones/RecomendacionFormSelector.tsx
import React, { useState, useEffect } from 'react';
import RecomendacionForm from './RecomendacionesForm';
import RecomendacionFormFCC from './RecomendacionFormFCC';
import type { Recomendacion } from '../../types/recomendacionTypes';

interface RecomendacionFormSelectorProps {
    recomendacion?: Recomendacion;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    currentUser: any;
    esEdicion?: boolean;
    programas?: any[];         // Lista de programas disponibles para seleccionar
    programaInicial?: any;     // Programa pre-seleccionado (para edición)
}

const RecomendacionFormSelector: React.FC<RecomendacionFormSelectorProps> = ({
    recomendacion,
    onSubmit,
    onCancel,
    lotes,
    docentes,
    currentUser,
    esEdicion = false,
    programas = [],
    programaInicial,
}) => {
    // Estado para el programa seleccionado (solo en creación)
    const [programaSeleccionado, setProgramaSeleccionado] = useState<any>(null);

    // Determinar si es el programa FCC (Frutales de Clima Cálido)
    const esProgramaFCC = (programa: any) => {
        if (!programa) return false;
        // Puedes ajustar la condición según tu lógica (nombre, tipo, id)
        return programa.nombre?.toLowerCase().includes('frutales') ||
               programa.nombre?.toLowerCase().includes('clima cálido') ||
               programa.id === 1; // Cambia por el ID real del programa FCC
    };

    // Al montar, si hay programaInicial o si es edición, seleccionar el programa adecuado
    useEffect(() => {
        if (esEdicion && recomendacion?.lote_id) {
            // En modo edición, obtenemos el programa del lote seleccionado
            const lote = lotes.find(l => l.id === recomendacion.lote_id);
            if (lote && lote.programa) {
                setProgramaSeleccionado(lote.programa);
            }
        } else if (programaInicial) {
            setProgramaSeleccionado(programaInicial);
        } else if (programas.length > 0 && !programaSeleccionado) {
            // Opcional: seleccionar el primer programa por defecto
            setProgramaSeleccionado(programas[0]);
        }
    }, [esEdicion, recomendacion, lotes, programaInicial, programas]);

    // Si es edición y ya tenemos programa, mostrar el formulario directamente
    if (esEdicion && programaSeleccionado) {
        return esProgramaFCC(programaSeleccionado) ? (
            <RecomendacionFormFCC
                recomendacion={recomendacion}
                onSubmit={onSubmit}
                onCancel={onCancel}
                lotes={lotes}
                docentes={docentes}
                currentUser={currentUser}
                esEdicion={esEdicion}
            />
        ) : (
            <RecomendacionForm
                recomendacion={recomendacion}
                onSubmit={onSubmit}
                onCancel={onCancel}
                lotes={lotes}
                docentes={docentes}
                currentUser={currentUser}
                esEdicion={esEdicion}
            />
        );
    }

    // En creación: mostrar selector de programa y luego el formulario correspondiente
    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                Nueva Recomendación
            </h2>

            {/* Selector de programa */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programa *
                </label>
                <select
                    value={programaSeleccionado?.id || ''}
                    onChange={(e) => {
                        const id = parseInt(e.target.value);
                        const programa = programas.find(p => p.id === id);
                        setProgramaSeleccionado(programa || null);
                    }}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                >
                    <option value="">Seleccionar programa</option>
                    {programas.map(prog => (
                        <option key={prog.id} value={prog.id}>
                            {prog.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {/* Renderizar el formulario correspondiente si hay programa seleccionado */}
            {programaSeleccionado ? (
                esProgramaFCC(programaSeleccionado) ? (
                    <RecomendacionFormFCC
                        recomendacion={recomendacion}
                        onSubmit={onSubmit}
                        onCancel={onCancel}
                        lotes={lotes}
                        docentes={docentes}
                        currentUser={currentUser}
                        esEdicion={false}
                    />
                ) : (
                    <RecomendacionForm
                        recomendacion={recomendacion}
                        onSubmit={onSubmit}
                        onCancel={onCancel}
                        lotes={lotes}
                        docentes={docentes}
                        currentUser={currentUser}
                        esEdicion={false}
                    />
                )
            ) : (
                <div className="text-center text-gray-500 py-8">
                    <i className="fas fa-info-circle text-4xl mb-2"></i>
                    <p>Selecciona un programa para continuar</p>
                </div>
            )}
        </div>
    );
};

export default RecomendacionFormSelector;