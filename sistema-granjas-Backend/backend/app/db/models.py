from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean, Text, Table, Date, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.db.database import Base

# ──────────────────────────────────────────────────────────────────────────────
# FUNCIÓN DE ZONA HORARIA COLOMBIA (UTC-5)
# ──────────────────────────────────────────────────────────────────────────────
def colombia_now():
    return datetime.utcnow() - timedelta(hours=5)

# ──────────────────────────────────────────────────────────────────────────────
# TABLAS PIVOTE EXISTENTES
# ──────────────────────────────────────────────────────────────────────────────
usuario_granja = Table(
    'usuario_granja',
    Base.metadata,
    Column('usuario_id', Integer, ForeignKey('usuarios.id'), primary_key=True),
    Column('granja_id', Integer, ForeignKey('granjas.id'), primary_key=True)
)

usuario_programa = Table(
    'usuario_programa',
    Base.metadata,
    Column('usuario_id', Integer, ForeignKey('usuarios.id'), primary_key=True),
    Column('programa_id', Integer, ForeignKey('programas.id'), primary_key=True)
)

class GranjaPrograma(Base):
    __tablename__ = 'granja_programa'
    granja_id = Column(Integer, ForeignKey('granjas.id'), primary_key=True)
    programa_id = Column(Integer, ForeignKey('programas.id'), primary_key=True)

class LoteCultivo(Base):
    __tablename__ = "lote_cultivo"
    lote_id = Column(Integer, ForeignKey("lotes.id", ondelete="CASCADE"), primary_key=True)
    cultivo_id = Column(Integer, ForeignKey("cultivos_especies.id", ondelete="CASCADE"), primary_key=True)
    lote = relationship("Lote", back_populates="cultivos_asignados")
    cultivo = relationship("CultivoEspecie", back_populates="lotes_asignados")

# ──────────────────────────────────────────────────────────────────────────────
# NUEVA TABLA INTERMEDIA DIAGNOSTICO-PLANTA (MUCHOS A MUCHOS)
# ──────────────────────────────────────────────────────────────────────────────
diagnostico_planta = Table(
    "diagnostico_planta",
    Base.metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("diagnostico_id", Integer, ForeignKey("diagnosticos.id", ondelete="CASCADE")),
    Column("planta_id", Integer, ForeignKey("plantas.id", ondelete="CASCADE")),
    Column("created_at", DateTime, default=colombia_now),
)

# ──────────────────────────────────────────────────────────────────────────────
# MODELOS EXISTENTES (CON LAS ADAPTACIONES NECESARIAS)
# ──────────────────────────────────────────────────────────────────────────────
class Rol(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text)
    nivel_permiso = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    activo = Column(Boolean, default=True)
    password_hash = Column(String(255))
    auth_provider = Column(String(50), default="traditional")
    fecha_creacion = Column(DateTime, default=colombia_now)
    rol = relationship("Rol", back_populates="usuarios")
    granjas = relationship("Granja", secondary=usuario_granja, back_populates="usuarios")
    programas = relationship("Programa", secondary=usuario_programa, back_populates="usuarios")
    labores_asignadas = relationship("Labor", back_populates="trabajador")
    recomendaciones_generadas = relationship("Recomendacion", back_populates="docente")
    diagnosticos = relationship("Diagnostico", back_populates="usuario")

class Programa(Base):
    __tablename__ = "programas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255))
    tipo = Column(String(50), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=colombia_now)
    granjas = relationship("Granja", secondary="granja_programa", back_populates="programas")
    usuarios = relationship("Usuario", secondary=usuario_programa, back_populates="programas")
    lotes = relationship("Lote", back_populates="programa")
    insumos = relationship("Insumo", back_populates="programa")
    monitoreos = relationship("Monitoreo", back_populates="programa", cascade="all, delete-orphan")
    diagnosticos = relationship("Diagnostico", back_populates="programa")

class Granja(Base):
    __tablename__ = "granjas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    ubicacion = Column(String(150), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=colombia_now)
    cultivos = relationship("CultivoEspecie", back_populates="granja")
    usuarios = relationship("Usuario", secondary=usuario_granja, back_populates="granjas")
    programas = relationship("Programa", secondary="granja_programa", back_populates="granjas")
    lotes = relationship("Lote", back_populates="granja")

class TipoLote(Base):
    __tablename__ = "tipos_lote"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(String(255))

class Lote(Base):
    __tablename__ = "lotes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    tipo_lote_id = Column(Integer, ForeignKey("tipos_lote.id"))
    granja_id = Column(Integer, ForeignKey("granjas.id"))
    programa_id = Column(Integer, ForeignKey("programas.id"))
    fecha_inicio = Column(DateTime)
    estado = Column(String(50), default="activo")
    surcos = Column(Integer, nullable=False, default=0)
    plantas_por_surco = Column(Integer, nullable=False, default=0)

    # Relaciones existentes
    cultivos_asignados = relationship("LoteCultivo", back_populates="lote", cascade="all, delete-orphan")
    tipo_lote = relationship("TipoLote")
    granja = relationship("Granja", back_populates="lotes")
    programa = relationship("Programa", back_populates="lotes")
    labores = relationship("Labor", back_populates="lote")
    diagnosticos = relationship("Diagnostico", back_populates="lote")
    recomendaciones = relationship("Recomendacion", back_populates="lote")
    
    # NUEVA relación uno a muchos con Planta
    plantas = relationship("Planta", back_populates="lote", cascade="all, delete-orphan")

class TipoLabor(Base):
    __tablename__ = "tipos_labor"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255))

class Recomendacion(Base):
    __tablename__ = "recomendaciones"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    tipo = Column(String(100), nullable=True)
    estado = Column(String(50), default="pendiente")
    docente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    diagnostico_id = Column(Integer, ForeignKey("diagnosticos.id"), nullable=True)
    fecha_creacion = Column(DateTime, default=colombia_now)
    fecha_aprobacion = Column(DateTime, nullable=True)
    evidencias = relationship("Evidencia", back_populates="recomendacion")
    docente = relationship("Usuario", back_populates="recomendaciones_generadas")
    lote = relationship("Lote", back_populates="recomendaciones")
    labores = relationship("Labor", back_populates="recomendacion")
    diagnostico = relationship("Diagnostico", back_populates="recomendaciones", foreign_keys=[diagnostico_id])

class Evidencia(Base):
    __tablename__ = "evidencias"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)
    descripcion = Column(Text, nullable=False)
    url_archivo = Column(String(500), nullable=False)
    labor_id = Column(Integer, ForeignKey("labores.id"), nullable=True)
    diagnostico_id = Column(Integer, ForeignKey("diagnosticos.id"), nullable=True)
    recomendacion_id = Column(Integer, ForeignKey("recomendaciones.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    fecha_creacion = Column(DateTime, default=colombia_now)
    labor = relationship("Labor", back_populates="evidencias")
    diagnostico = relationship("Diagnostico", back_populates="evidencias")
    recomendacion = relationship("Recomendacion", back_populates="evidencias")
    usuario = relationship("Usuario")

class Labor(Base):
    __tablename__ = "labores"
    id = Column(Integer, primary_key=True, index=True)
    estado = Column(String(50), default="pendiente")
    tipo_labor_id = Column(Integer, ForeignKey("tipos_labor.id"), nullable=False)
    avance_porcentaje = Column(Integer, default=0)
    comentario = Column(Text, nullable=True)
    fecha_asignacion = Column(DateTime, default=colombia_now)
    fecha_finalizacion = Column(DateTime, nullable=True)
    recomendacion_id = Column(Integer, ForeignKey("recomendaciones.id"), nullable=False)
    trabajador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=True)
    recomendacion = relationship("Recomendacion", back_populates="labores")
    trabajador = relationship("Usuario", back_populates="labores_asignadas")
    lote = relationship("Lote", back_populates="labores")
    evidencias = relationship("Evidencia", back_populates="labor")
    tipo_labor = relationship("TipoLabor")
    uso_herramientas = relationship("MovimientoHerramienta", back_populates="labor")
    uso_insumos = relationship("MovimientoInsumo", back_populates="labor")

class Diagnostico(Base):
    __tablename__ = "diagnosticos"
    id = Column(Integer, primary_key=True, index=True)
    programa_id = Column(Integer, ForeignKey("programas.id"), nullable=False)
    tipo_monitoreo_id = Column(Integer, ForeignKey("monitoreos.id"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo_diagnostico = Column(String(100), nullable=False)
    condiciones_dia = Column(String(50), nullable=False)
    formulario = Column(JSON, nullable=True)
    fecha_creacion = Column(DateTime, default=colombia_now)

    # Relaciones existentes
    programa = relationship("Programa", back_populates="diagnosticos")
    tipo_monitoreo = relationship("Monitoreo", back_populates="diagnosticos")
    lote = relationship("Lote", back_populates="diagnosticos")
    usuario = relationship("Usuario", back_populates="diagnosticos")
    recomendaciones = relationship("Recomendacion", back_populates="diagnostico")
    evidencias = relationship("Evidencia", back_populates="diagnostico")

    # NUEVA relación muchos a muchos con Planta
    plantas = relationship("Planta", secondary=diagnostico_planta, back_populates="diagnosticos")

class Monitoreo(Base):
    __tablename__ = "monitoreos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    programa_id = Column(Integer, ForeignKey("programas.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(Date, default=colombia_now().date())
    programa = relationship("Programa", back_populates="monitoreos")
    diagnosticos = relationship("Diagnostico", back_populates="tipo_monitoreo")

class CultivoEspecie(Base):
    __tablename__ = "cultivos_especies"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    tipo = Column(String(50), nullable=False)
    descripcion = Column(Text)
    estado = Column(String(50), default="activo")
    granja_id = Column(Integer, ForeignKey("granjas.id"), nullable=False)
    granja = relationship("Granja", back_populates="cultivos")
    lotes_asignados = relationship("LoteCultivo", back_populates="cultivo", cascade="all, delete-orphan")

# ──────────────────────────────────────────────────────────────────────────────
# NUEVO MODELO: PLANTA (con relación muchos a uno con Lote)
# ──────────────────────────────────────────────────────────────────────────────
class Planta(Base):
    __tablename__ = "plantas"
    id = Column(Integer, primary_key=True, index=True)
    lote_id = Column(Integer, ForeignKey("lotes.id", ondelete="CASCADE"), nullable=False)
    surco = Column(Integer, nullable=False)
    numero = Column(Integer, nullable=False)
    codigo = Column(String(50), unique=True, nullable=False, index=True)   # Ej: "CITRICO1-S01P02"
    estado = Column(String(20), default="productivo")   # activa, eliminada
    created_at = Column(DateTime, default=colombia_now)
    updated_at = Column(DateTime, default=colombia_now, onupdate=colombia_now)

    # Relaciones
    lote = relationship("Lote", back_populates="plantas")
    diagnosticos = relationship("Diagnostico", secondary=diagnostico_planta, back_populates="plantas")
