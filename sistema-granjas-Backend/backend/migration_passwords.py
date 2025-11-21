# migracion_passwords.py
import sys
import os

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.db.models import Usuario

def migrar_contraseñas():
    """Migra usuarios con SHA256 a bcrypt (requiere reset de contraseña)"""
    db = SessionLocal()
    try:
        usuarios = db.query(Usuario).all()
        usuarios_afectados = []
        
        for usuario in usuarios:
            if usuario.password_hash and usuario.password_hash.startswith('sha256$'):
                usuarios_afectados.append(usuario.email)
                print(f"❌ Usuario necesita reset: {usuario.email}")
                # Establecer password_hash a NULL para forzar reset
                usuario.password_hash = None
        
        if usuarios_afectados:
            db.commit()
            print(f"\n=== MIGRACIÓN COMPLETADA ===")
            print(f"Usuarios afectados: {len(usuarios_afectados)}")
            for email in usuarios_afectados:
                print(f"  - {email}")
            print(f"\n⚠️  Estos usuarios deben resetear su contraseña")
        else:
            print("✅ No hay usuarios con contraseñas SHA256")
            
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== MIGRACIÓN DE CONTRASEÑAS SHA256 ===")
    migrar_contraseñas()