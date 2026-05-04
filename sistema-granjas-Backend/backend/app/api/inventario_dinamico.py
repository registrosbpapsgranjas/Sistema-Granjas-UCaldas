from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD import inventario_dinamico as crud
from app.schemas.inventario_dinamico_schema import (
    ProgramaInventarioTipoCreate, ProgramaInventarioTipoUpdate, ProgramaInventarioTipoResponse,
    InventarioCampoCreate, InventarioCampoUpdate, InventarioCampoResponse,
    ItemInventarioProgramaCreate, ItemInventarioProgramaUpdate, ItemInventarioProgramaResponse,
    TipoConCamposResponse, TipoConItemsResponse
)
from app.db.models import Programa

router = APIRouter(prefix="/inventario-dinamico", tags=["Inventario Dinámico"])
role_required = Depends(require_any_role(["admin", "asesor", "talento_humano"]))

# ---------- Tipos de inventario ----------
@router.get("/programas/{programa_id}/tipos", response_model=List[ProgramaInventarioTipoResponse])
def listar_tipos(programa_id: int, db: Session = Depends(get_db), _=role_required):
    tipos = crud.get_tipos_por_programa(db, programa_id)
    return tipos

@router.post("/tipos", response_model=ProgramaInventarioTipoResponse, status_code=201)
def crear_tipo(data: ProgramaInventarioTipoCreate, db: Session = Depends(get_db), _=role_required):
    # verificar que el programa existe
    programa = db.query(Programa).filter(Programa.id == data.programa_id).first()
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    return crud.create_tipo(db, data)

@router.put("/tipos/{tipo_id}", response_model=ProgramaInventarioTipoResponse)
def actualizar_tipo(tipo_id: int, data: ProgramaInventarioTipoUpdate, db: Session = Depends(get_db), _=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    return crud.update_tipo(db, tipo, data)

@router.delete("/tipos/{tipo_id}")
def eliminar_tipo(tipo_id: int, db: Session = Depends(get_db), _=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    crud.delete_tipo(db, tipo)
    return {"message": "Tipo eliminado"}

# ---------- Campos ----------
@router.get("/tipos/{tipo_id}/campos", response_model=List[InventarioCampoResponse])
def listar_campos(tipo_id: int, db: Session = Depends(get_db), _=role_required):
    campos = crud.get_campos_por_tipo(db, tipo_id)
    return campos

@router.post("/campos", response_model=InventarioCampoResponse, status_code=201)
def crear_campo(data: InventarioCampoCreate, db: Session = Depends(get_db), _=role_required):
    tipo = crud.get_tipo(db, data.tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    return crud.create_campo(db, data)

@router.put("/campos/{campo_id}", response_model=InventarioCampoResponse)
def actualizar_campo(campo_id: int, data: InventarioCampoUpdate, db: Session = Depends(get_db), _=role_required):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    return crud.update_campo(db, campo, data)

@router.delete("/campos/{campo_id}")
def eliminar_campo(campo_id: int, db: Session = Depends(get_db), _=role_required):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    crud.delete_campo(db, campo)
    return {"message": "Campo eliminado"}

# ---------- Items (registros de inventario) ----------
def _validar_valores_segun_campos(db: Session, tipo_id: int, valores: dict):
    """Lanza HTTPException si los valores no cumplen definición de campos."""
    campos = crud.get_campos_por_tipo(db, tipo_id)
    nombre_campos = {c.nombre_campo: c for c in campos}
    # Verificar requeridos
    for campo in campos:
        if campo.requerido and (campo.nombre_campo not in valores or valores[campo.nombre_campo] in (None, "")):
            raise HTTPException(400, f"El campo '{campo.nombre_campo}' es requerido")
    # Verificar que no se envíen campos que no existen
    for campo_valor in valores:
        if campo_valor not in nombre_campos and campo_valor not in ['_', 'unidades']: # Permitir campos comodín
            raise HTTPException(400, f"El campo '{campo_valor}' no está definido para este tipo de inventario")
    # Validar tipo de dato (simplificado, más adelante puedes añadir conversiones)
    for nombre, valor in valores.items():
        if nombre in nombre_campos:
            campo_def = nombre_campos[nombre]
            if campo_def.tipo_dato == "number" and not isinstance(valor, (int, float)):
                try:
                    float(valor)
                except:
                    raise HTTPException(400, f"El campo '{nombre}' debe ser numérico")
            elif campo_def.tipo_dato == "date":
                # validación más fina opcional
                pass
            elif campo_def.tipo_dato == "select":
                if valor not in campo_def.opciones:
                    raise HTTPException(400, f"Valor '{valor}' no permitido para campo '{nombre}'")
            elif campo_def.tipo_dato == "boolean":
                if valor not in [True, False, "true", "false", 1, 0]:
                    raise HTTPException(400, f"El campo '{nombre}' debe ser booleano")

@router.get("/programas/{programa_id}/items-planos", response_model=List[ItemInventarioProgramaResponse])
def listar_todos_items_programa(programa_id: int, db: Session = Depends(get_db)):
    """Devuelve todos los ítems de inventario de un programa, sin importar el tipo."""
    tipos = crud.get_tipos_por_programa(db, programa_id)
    todos = []
    for tipo in tipos:
        items = crud.get_items_por_tipo(db, tipo.id, skip=0, limit=500)
        todos.extend(items)
    return todos

@router.get("/tipos/{tipo_id}/items", response_model=List[ItemInventarioProgramaResponse])
def listar_items(tipo_id: int, skip: int = 0, limit: int = 500, db: Session = Depends(get_db), _=role_required):
    items = crud.get_items_por_tipo(db, tipo_id, skip=skip, limit=limit)
    return items

@router.get("/tipos/{tipo_id}/completo", response_model=TipoConItemsResponse)
def obtener_tipo_completo(tipo_id: int, db: Session = Depends(get_db), _=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    campos = crud.get_campos_por_tipo(db, tipo_id)
    items = crud.get_items_por_tipo(db, tipo_id)
    return TipoConItemsResponse(**tipo.__dict__, campos=campos, items=items)

@router.post("/items", response_model=ItemInventarioProgramaResponse, status_code=201)
def crear_item(data: ItemInventarioProgramaCreate, db: Session = Depends(get_db), _=role_required):
    tipo = crud.get_tipo(db, data.tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    # validar que los valores cumplen definición
    _validar_valores_segun_campos(db, data.tipo_id, data.valores)
    return crud.create_item(db, data)

@router.put("/items/{item_id}", response_model=ItemInventarioProgramaResponse)
def actualizar_item(item_id: int, data: ItemInventarioProgramaUpdate, db: Session = Depends(get_db), _=role_required):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    # si se actualizan valores, validar contra la definición de campos
    if data.valores is not None:
        _validar_valores_segun_campos(db, item.tipo_id, data.valores)
    return crud.update_item(db, item, data)

@router.delete("/items/{item_id}")
def eliminar_item(item_id: int, db: Session = Depends(get_db), _=role_required):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    crud.delete_item(db, item)
    return {"message": "Item eliminado"}