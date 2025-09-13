#!/usr/bin/env python3
"""
🧪 SUITE COMPLETA DE TESTS - FRONTEND Y BACKEND
==================================================

Este script ejecuta todos los tests del proyecto:
- Tests del Backend (Python)
- Tests del Frontend (TypeScript/React)
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Ejecuta un comando y retorna el resultado"""
    try:
        print(f"📁 Directorio: {cwd or os.getcwd()}")
        print(f"🔄 Ejecutando: {command}")
        print("-" * 60)
        
        result = subprocess.run(
            command, 
            shell=shell, 
            cwd=cwd,
            capture_output=True,
            text=True
        )
        
        if result.stdout:
            print(result.stdout)
        if result.stderr and result.returncode != 0:
            print("❌ ERRORES:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error ejecutando comando: {e}")
        return False

def run_backend_tests():
    """Ejecuta tests del backend"""
    print("\n" + "="*80)
    print("🐍 TESTS DEL BACKEND (Python)")
    print("="*80)
    
    project_root = Path(__file__).parent
    backend_path = project_root / "backend"
    
    if not backend_path.exists():
        print("❌ Directorio backend no encontrado")
        return False
    
    # Ejecutar script de tests del backend
    test_script = backend_path / "tests" / "run_all_tests.py"
    if test_script.exists():
        return run_command(f"python {test_script}", cwd=backend_path)
    else:
        print("❌ Script de tests del backend no encontrado")
        return False

def run_frontend_tests():
    """Ejecuta tests del frontend"""
    print("\n" + "="*80)
    print("⚛️  TESTS DEL FRONTEND (React/TypeScript)")
    print("="*80)
    
    project_root = Path(__file__).parent
    frontend_path = project_root / "frontend"
    
    if not frontend_path.exists():
        print("❌ Directorio frontend no encontrado")
        return False
    
    # Verificar si las dependencias están instaladas
    node_modules = frontend_path / "node_modules"
    if not node_modules.exists():
        print("📦 Instalando dependencias de Node.js...")
        if not run_command("npm install", cwd=frontend_path):
            print("❌ Error instalando dependencias")
            return False
    
    # Ejecutar tests del frontend
    print("🧪 Ejecutando tests del frontend...")
    return run_command("npm run test", cwd=frontend_path)

def main():
    """Función principal"""
    print("🚀 INICIANDO SUITE COMPLETA DE TESTS")
    print("=" * 80)
    print(f"📅 {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Directorio base: {Path(__file__).parent}")
    print("=" * 80)
    
    backend_success = run_backend_tests()
    frontend_success = run_frontend_tests()
    
    print("\n" + "="*80)
    print("📊 RESUMEN DE RESULTADOS")
    print("="*80)
    print(f"🐍 Backend:  {'✅ EXITOSO' if backend_success else '❌ FALLÓ'}")
    print(f"⚛️  Frontend: {'✅ EXITOSO' if frontend_success else '❌ FALLÓ'}")
    print("="*80)
    
    if backend_success and frontend_success:
        print("🎉 ¡TODOS LOS TESTS PASARON!")
        sys.exit(0)
    else:
        print("💥 ALGUNOS TESTS FALLARON")
        sys.exit(1)

if __name__ == "__main__":
    main()
