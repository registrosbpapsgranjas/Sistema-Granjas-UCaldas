from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user, require_any_role
from app.export import ExportService

router = APIRouter(prefix="/export", tags=["Exportación"])

# ========================== BACKUP COMPLETO ==========================
@router.get("/backup/excel")
async def export_backup_excel(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente"]))
):
    try:
        return ExportService(db, usuario).export_todo_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== GRANJAS ==========================
@router.get("/granjas/excel")
async def export_granjas(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    try:
        return ExportService(db, usuario).export_granjas_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== LOTES ==========================
@router.get("/lotes/excel")
async def export_lotes(
    detallado: bool = Query(False),
    lote_id: int = Query(None),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    try:
        return ExportService(db, usuario).export_lotes_excel(
            detallado=detallado,
            lote_id=lote_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== DIAGNÓSTICOS ==========================
@router.get("/diagnosticos/excel")
async def export_diagnosticos(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    try:
        return ExportService(db, usuario).export_diagnosticos_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== RECOMENDACIONES ==========================
@router.get("/recomendaciones/excel")
async def export_recomendaciones(
    estado: str = Query(None),
    tipo: str = Query(None),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    try:
        filtros = {}
        if estado:
            filtros["estado"] = estado
        if tipo:
            filtros["tipo"] = tipo

        return ExportService(db, usuario).export_recomendaciones_excel(**filtros)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== LABORES ==========================
@router.get("/labores/excel")
async def export_labores(
    estado: str = Query(None),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    try:
        filtros = {}
        if estado:
            filtros["estado"] = estado

        return ExportService(db, usuario).export_labores_excel(**filtros)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== INVENTARIO COMPLETO ==========================
@router.get("/inventario/excel")
async def export_inventario(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    try:
        return ExportService(db, usuario).export_inventario_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== USUARIOS ==========================
@router.get("/usuarios/excel")
async def export_usuarios(
    rol: str = Query(None),
    activo: bool = Query(None),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin"]))
):
    try:
        filtros = {}
        if rol:
            filtros["rol"] = rol
        if activo is not None:
            filtros["activo"] = activo

        return ExportService(db, usuario).export_usuarios_excel(**filtros)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== PROGRAMAS ==========================
@router.get("/programas/excel")
async def export_programas(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente"]))
):
    try:
        return ExportService(db, usuario).export_programas_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== CULTIVOS ==========================
@router.get("/cultivos/excel")
async def export_cultivos(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    try:
        return ExportService(db, usuario).export_cultivos_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== PLANTAS ==========================
@router.get("/plantas/excel")
async def export_plantas(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    try:
        return ExportService(db, usuario).export_plantas_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== MOVIMIENTOS ==========================
@router.get("/movimientos/excel")
async def export_movimientos(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente"]))
):
    try:
        return ExportService(db, usuario).export_movimientos_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================== RESUMEN / ESTADÍSTICAS ==========================
@router.get("/resumen/excel")
async def export_resumen(
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "docente"]))
):
    try:
        return ExportService(db, usuario).export_resumen_excel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
