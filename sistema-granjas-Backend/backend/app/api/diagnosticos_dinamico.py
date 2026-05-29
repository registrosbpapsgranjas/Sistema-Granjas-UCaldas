from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD import diagnosticos_dinamico as crud
from app.schemas.diagnostico_dinamico_schema import (
    DiagnosticoTipoCreate, DiagnosticoTipoUpdate, DiagnosticoTipoResponse,
    DiagnosticoCampoCreate, DiagnosticoCampoUpdate, DiagnosticoCampoResponse,
    DiagnosticoTipoConCamposResponse,
    CampoRecomendacionCreate, CampoRecomendacionUpdate, CampoRecomendacionResponse,
    CampoLaborCreate, CampoLaborUpdate, CampoLaborResponse,
)
from app.db.models import Programa, Monitoreo

router = APIRouter(prefix="/diagnosticos-dinamico", tags=["Diagnósticos Dinámico"])
role_admin = Depends(require_any_role(["admin", "docente", "asesor", "jefe_talento_humano"]))
role_read = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "trabajador", "talento_humano", "jefe_talento_humano"]))


# ---------- Tipos de diagnóstico (por programa) ----------

@router.get("/programas/{programa_id}/tipos", response_model=List[DiagnosticoTipoResponse])
def listar_tipos(programa_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_tipos_por_programa(db, programa_id)


@router.get("/tipos/{tipo_id}", response_model=DiagnosticoTipoConCamposResponse)
def obtener_tipo(tipo_id: int, db: Session = Depends(get_db), _=role_read):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    campos = crud.get_campos_por_tipo(db, tipo_id)
    campos_rec = crud.get_campos_recomendacion_por_subtipo(db, tipo_id)
    return DiagnosticoTipoConCamposResponse(
        **{k: v for k, v in tipo.__dict__.items() if not k.startswith("_")},
        campos=campos,
        campos_recomendacion=campos_rec,
    )


@router.post("/tipos", response_model=DiagnosticoTipoResponse, status_code=201)
def crear_tipo(data: DiagnosticoTipoCreate, db: Session = Depends(get_db), _=role_admin):
    programa = db.query(Programa).filter(Programa.id == data.programa_id).first()
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    if data.monitoreo_id:
        monitoreo = db.query(Monitoreo).filter(Monitoreo.id == data.monitoreo_id).first()
        if not monitoreo:
            raise HTTPException(404, "Monitoreo no encontrado")
    return crud.create_tipo(db, data)


@router.put("/tipos/{tipo_id}", response_model=DiagnosticoTipoResponse)
def actualizar_tipo(tipo_id: int, data: DiagnosticoTipoUpdate, db: Session = Depends(get_db), _=role_admin):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    return crud.update_tipo(db, tipo, data)


@router.delete("/tipos/{tipo_id}")
def eliminar_tipo(tipo_id: int, db: Session = Depends(get_db), _=role_admin):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    if tipo.diagnosticos:
        raise HTTPException(400, "No se puede eliminar un tipo con diagnósticos asociados")
    crud.delete_tipo(db, tipo)
    return {"message": "Tipo eliminado"}


# ---------- Subtipos por monitoreo ----------

@router.get("/monitoreos/{monitoreo_id}/subtipos", response_model=List[DiagnosticoTipoResponse])
def listar_subtipos_por_monitoreo(monitoreo_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_subtipos_por_monitoreo(db, monitoreo_id)


# ---------- Campos de diagnóstico ----------

@router.get("/tipos/{tipo_id}/campos", response_model=List[DiagnosticoCampoResponse])
def listar_campos(tipo_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_campos_por_tipo(db, tipo_id)


@router.post("/campos", response_model=DiagnosticoCampoResponse, status_code=201)
def crear_campo(data: DiagnosticoCampoCreate, db: Session = Depends(get_db), _=role_admin):
    tipo = crud.get_tipo(db, data.tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    return crud.create_campo(db, data)


@router.put("/campos/{campo_id}", response_model=DiagnosticoCampoResponse)
def actualizar_campo(campo_id: int, data: DiagnosticoCampoUpdate, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    return crud.update_campo(db, campo, data)


@router.delete("/campos/{campo_id}")
def eliminar_campo(campo_id: int, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    crud.delete_campo(db, campo)
    return {"message": "Campo eliminado"}


# ---------- Campos de recomendación (por subtipo) ----------

@router.get("/tipos/{tipo_id}/campos-recomendacion", response_model=List[CampoRecomendacionResponse])
def listar_campos_recomendacion(tipo_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_campos_recomendacion_por_subtipo(db, tipo_id)


@router.post("/campos-recomendacion", response_model=CampoRecomendacionResponse, status_code=201)
def crear_campo_recomendacion(data: CampoRecomendacionCreate, db: Session = Depends(get_db), _=role_admin):
    subtipo = crud.get_tipo(db, data.subtipo_id)
    if not subtipo:
        raise HTTPException(404, "Subtipo no encontrado")
    return crud.create_campo_recomendacion(db, data)


@router.put("/campos-recomendacion/{campo_id}", response_model=CampoRecomendacionResponse)
def actualizar_campo_recomendacion(campo_id: int, data: CampoRecomendacionUpdate, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo_recomendacion(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    return crud.update_campo_recomendacion(db, campo, data)


@router.delete("/campos-recomendacion/{campo_id}")
def eliminar_campo_recomendacion(campo_id: int, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo_recomendacion(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    crud.delete_campo_recomendacion(db, campo)
    return {"message": "Campo eliminado"}


# ---------- Campos de labor (por subtipo) ----------

@router.get("/tipos/{tipo_id}/campos-labor", response_model=List[CampoLaborResponse])
def listar_campos_labor(tipo_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_campos_labor_por_subtipo(db, tipo_id)


@router.post("/campos-labor", response_model=CampoLaborResponse, status_code=201)
def crear_campo_labor(data: CampoLaborCreate, db: Session = Depends(get_db), _=role_admin):
    subtipo = crud.get_tipo(db, data.subtipo_id)
    if not subtipo:
        raise HTTPException(404, "Subtipo no encontrado")
    return crud.create_campo_labor(db, data)


@router.put("/campos-labor/{campo_id}", response_model=CampoLaborResponse)
def actualizar_campo_labor(campo_id: int, data: CampoLaborUpdate, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo_labor(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    return crud.update_campo_labor(db, campo, data)


@router.delete("/campos-labor/{campo_id}")
def eliminar_campo_labor(campo_id: int, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo_labor(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    crud.delete_campo_labor(db, campo)
    return {"message": "Campo eliminado"}
