import type { Role } from "../types/auth";

interface Props {
    roles: Role[];
    selectedRole: number | null;
    onSelect: (roleId: number) => void;
}

export default function RoleSelector({ roles, selectedRole, onSelect }: Props) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {roles.map((rol) => (
                <div
                    key={rol.id}
                    onClick={() => onSelect(rol.id)}
                    className={`cursor-pointer rounded-lg border p-3 text-center transition ${selectedRole === rol.id
                        ? "border-green-700 bg-green-50"
                        : "border-gray-300 hover:border-green-400"
                        }`}
                >
                    <div className="text-green-700 text-xl mb-1">
                        <i
                            className={
                                rol.nombre === "estudiante"
                                    ? "fas fa-user-graduate"
                                    : rol.nombre === "asesor"
                                        ? "fas fa-user-tie"
                                        : rol.nombre === "trabajador"
                                            ? "fas fa-user-hard-hat"
                                            : "fas fa-user-cog"
                            }
                        ></i>
                    </div>
                    <p className="font-medium">{rol.nombre}</p>
                </div>
            ))}
        </div>
    );
}
