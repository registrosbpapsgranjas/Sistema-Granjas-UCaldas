import os
import sys
from pathlib import Path

# La ruta base de tu proyecto (donde estás ejecutando el script)
BASE_DIR = Path('.') 

# Definición de la estructura
def crear_estructura():
    # Creamos las carpetas anidadas de una sola vez
    (BASE_DIR / 'backend' / 'app' / 'api').mkdir(parents=True, exist_ok=True)
    
    # Creamos los archivos
    (BASE_DIR / 'backend' / 'app' / 'main.py').touch(exist_ok=True)
    (BASE_DIR / 'backend' / 'app' / 'api' / 'sync.py').touch(exist_ok=True)
    
    # Opcional pero recomendado para Python: __init__.py en cada carpeta
    (BASE_DIR / 'backend' / 'app' / '__init__.py').touch(exist_ok=True)
    (BASE_DIR / 'backend' / 'app' / 'api' / '__init__.py').touch(exist_ok=True)

    print("Estructura de directorios creada con éxito.")

if __name__ == "__main__":
    crear_estructura()