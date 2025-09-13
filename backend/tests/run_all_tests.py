#!/usr/bin/env python3
"""
Script para ejecutar todos los tests del sistema
"""
import os
import sys
import subprocess

def run_test_file(test_file):
    """Ejecuta un archivo de test específico"""
    print(f"\n{'='*60}")
    print(f"EJECUTANDO: {test_file}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run([sys.executable, test_file], 
                              capture_output=True, text=True, cwd=os.path.dirname(test_file))
        
        if result.returncode == 0:
            print(f"✅ {test_file} - EXITOSO")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ {test_file} - FALLÓ")
            if result.stderr:
                print("ERRORES:")
                print(result.stderr)
            if result.stdout:
                print("OUTPUT:")
                print(result.stdout)
                
    except Exception as e:
        print(f"❌ Error ejecutando {test_file}: {e}")

def main():
    """Ejecuta todos los tests"""
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("INICIANDO SUITE DE TESTS")
    print(f"Directorio: {tests_dir}")
    
    # Lista de tests a ejecutar
    test_files = [
        "test_crud.py",
        "test_dashboard.py", 
        "test_multa_model.py",
        "test_api.py"  # Este último porque levanta un servidor
    ]
    
    for test_file in test_files:
        test_path = os.path.join(tests_dir, test_file)
        if os.path.exists(test_path):
            run_test_file(test_path)
        else:
            print(f"⚠️  Test no encontrado: {test_file}")
    
    print(f"\n{'='*60}")
    print("🏁 TESTS COMPLETADOS")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
