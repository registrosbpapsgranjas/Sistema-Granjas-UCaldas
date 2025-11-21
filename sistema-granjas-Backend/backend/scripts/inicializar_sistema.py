import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.CRUD.usuarios import create_usuario, get_usuario_by_email
from app.CRUD.roles import get_rol_by_nombre
from app.schemas.usuario_schema import UsuarioCreate

def crear_admin_principal():
    db = SessionLocal()
    try:
        print("👑 Creando administrador principal...")
        
        # Verificar si ya existe
        if get_usuario_by_email(db, "admin@ucaldas.edu.co"):
            print("✅ El admin ya existe")
            return
        
        # Obtener rol admin
        rol_admin = get_rol_by_nombre(db, "admin")
        if not rol_admin:
            print("❌ Error: No existe el rol 'admin'")
            return
        
        # Crear admin
        admin_data = UsuarioCreate(
            nombre="Administrador Principal",
            email="admin@ucaldas.edu.co", 
            rol_id=rol_admin.id
        )
        admin = create_usuario(db, admin_data)
        
        print(f"✅ Admin creado exitosamente!")
        print(f"   Email: {admin.email}")
        print(f"   Nombre: {admin.nombre}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    crear_admin_principal()