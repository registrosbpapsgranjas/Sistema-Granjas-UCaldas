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
    programas?: any[];
    programaInicial?: any;
    diagnosticoIdInicial?: number;
    loteIdInicial?: number;
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
    diagnosticoIdInicial,
    loteIdInicial,
}) => {
    const [programaSeleccionado, setProgramaSeleccionado] = useState<any>(null);

    const esProgramaFCC = (programa: any) => {
        if (!programa) return false;
        return programa.nombre?.toLowerCase().includes('frutales') ||
               programa.nombre?.toLowerCase().includes('clima cálido') ||
               programa.id === 1;
    };

    useEffect(() => {
        if (esEdicion && recomendacion?.lote_id) {
            const lote = lotes.find(l => l.id === recomendacion.lote_id);
            if (lote && lote.programa) {
                setProgramaSeleccionado(lote.programa);
            }
        } else if (programaInicial) {
            setProgramaSeleccionado(programaInicial);
        } else if (loteIdInicial && lotes.length > 0) {
            const lote = lotes.find((l: any) => l.id === loteIdInicial);
            if (lote?.programa_id) {
                const prog = programas.find((p: any) => p.id === lote.programa_id);
                if (prog) setProgramaSeleccionado(prog);
            }
        } else if (programas.length > 0 && !programaSeleccionado) {
            setProgramaSeleccionado(programas[0]);
        }
    }, [esEdicion, recomendacion, lotes, programaInicial, programas, loteIdInicial]);

    const recomendacionConPreFill = recomendacion
        ? recomendacion
        : (diagnosticoIdInicial || loteIdInicial)
            ? {
                diagnostico_id: diagnosticoIdInicial,
                lote_id: loteIdInicial,
              } as unknown as Recomendacion
            : undefined;

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

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                Nueva Recomendación
                {diagnosticoIdInicial && (
                    <span className="ml-2 text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                        Vinculada al Diagnóstico #{diagnosticoIdInicial}
                    </span>
                )}
            </h2>

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

            {programaSeleccionado ? (
                esProgramaFCC(programaSeleccionado) ? (
                    <RecomendacionFormFCC
                        recomendacion={recomendacionConPreFill}
                        onSubmit={onSubmit}
                        onCancel={onCancel}
                        lotes={lotes}
                        docentes={docentes}
                        currentUser={currentUser}
                        esEdicion={false}
                    />
                ) : (
                    <RecomendacionForm
                        recomendacion={recomendacionConPreFill}
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
