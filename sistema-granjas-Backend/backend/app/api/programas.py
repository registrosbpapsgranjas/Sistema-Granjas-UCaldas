from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.schemas.programa_schema import (
    ProgramaCreate, ProgramaResponse, ProgramaUpdate,
    AsignacionUsuarioPrograma, AsignacionGranjaPrograma
)
from app.schemas.usuario_schema import UsuarioResponse
from app.schemas.granja_schema import GranjaResponse
from app.schemas.lote_schema import LoteResponse  # IMPORTANTE: Importar LoteResponse
from app.CRUD.programas import (
    get_programas, get_programa,
    create_programa, update_programa, delete_programa,
    asignar_usuario_programa, desasignar_usuario_programa, listar_usuarios_programa,
    asignar_granja_programa, desasignar_granja_programa, listar_granjas_programa,
    get_programas_por_granja, get_programas_con_relaciones
)
from app.CRUD.lotes import get_lotes_por_programa  # Importar la función de lotes

router = APIRouter(prefix="/programas", tags=["Programas"])

# Endpoints básicos
@router.get("/", response_model=List[ProgramaResponse])
def listar_programas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    incluir_inactivos: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "talento_humano", "jefe_talento_humano", "trabajador"]))
):
    """Listar programas. Docentes y asesores solo ven sus propios programas."""
    rol = current_user.rol.nombre
    if rol in ["docente", "asesor"]:
        programas_usuario = current_user.programas
        if not incluir_inactivos:
            return [p for p in programas_usuario if p.activo]
        return list(programas_usuario)
    return get_programas(db, skip=skip, limit=limit, solo_activos=not incluir_inactivos)

@router.get("/{programa_id}", response_model=ProgramaResponse)
def obtener_programa(
    programa_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "talento_humano", "jefe_talento_humano", "trabajador"]))
):
    """Obtener un programa por su ID"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return programa

@router.post("/", response_model=ProgramaResponse, status_code=201)
def crear_programa(
    data: ProgramaCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Crear un nuevo programa"""
    return create_programa(db, data)

@router.put("/{programa_id}", response_model=ProgramaResponse)
def actualizar_programa(
    programa_id: int, 
    data: ProgramaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Actualizar un programa existente"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return update_programa(db, programa, data)

@router.delete("/{programa_id}")
def eliminar_programa(
    programa_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Eliminar (desactivar) un programa"""
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return delete_programa(db, programa)

# === ENDPOINTS PARA ASIGNACIÓN DE USUARIOS ===
@router.post("/{programa_id}/usuarios")
def asignar_usuario(
    programa_id: int,
    data: AsignacionUsuarioPrograma,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Asignar un usuario a un programa"""
    try:
        asignar_usuario_programa(db, programa_id, data.usuario_id)
        return {"message": "Usuario asignado correctamente"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{programa_id}/usuarios/{usuario_id}")
def desasignar_usuario(
    programa_id: int,
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Desasignar un usuario de un programa"""
    try:
        return desasignar_usuario_programa(db, programa_id, usuario_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{programa_id}/usuarios", response_model=List[UsuarioResponse])
def listar_usuarios(
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    """Listar todos los usuarios asignados a un programa"""
    try:
        return listar_usuarios_programa(db, programa_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# === ENDPOINTS PARA ASIGNACIÓN DE GRANJAS ===
@router.post("/{programa_id}/granjas")
def asignar_granja(
    programa_id: int,
    data: AsignacionGranjaPrograma,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Asignar una granja a un programa"""
    try:
        asignar_granja_programa(db, programa_id, data.granja_id)
        return {"message": "Granja asignada correctamente"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{programa_id}/granjas/{granja_id}")
def desasignar_granja(
    programa_id: int,
    granja_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin"]))
):
    """Desasignar una granja de un programa"""
    try:
        return desasignar_granja_programa(db, programa_id, granja_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{programa_id}/granjas", response_model=List[GranjaResponse])
def listar_granjas(
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "talento_humano", "trabajador"]))
):
    """Listar todas las granjas asignadas a un programa"""
    try:
        return listar_granjas_programa(db, programa_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# === NUEVO ENDPOINT: LOTES POR PROGRAMA ===
@router.get("/{programa_id}/lotes", response_model=List[LoteResponse])
def listar_lotes_por_programa(
    programa_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "talento_humano", "trabajador"]))
):
    """Listar todos los lotes asignados a un programa específico"""
    # Verificar que el programa existe
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    
    # Obtener lotes del programa
    return get_lotes_por_programa(db, programa_id, skip=skip, limit=limit)

# === ENDPOINTS ADICIONALES ===
@router.get("/{programa_id}/relaciones")
def obtener_relaciones_completas(
    programa_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    """Obtener todas las relaciones de un programa (usuarios y granjas)"""
    try:
        return get_programas_con_relaciones(db, programa_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/por-granja/{granja_id}", response_model=List[ProgramaResponse])
def listar_programas_por_granja(
    granja_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "talento_humano", "trabajador"]))
):
    """Listar todos los programas asignados a una granja específica"""
    try:
        return get_programas_por_granja(db, granja_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))