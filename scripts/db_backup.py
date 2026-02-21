#!/usr/bin/env python3
"""
Script de backup do banco de dados PostgreSQL.

# TODO:UPGRADE [PRIORIDADE: ALTA]
# Motivo: No Free Tier o banco expira em 30 dias — backups manuais são essenciais
# Solução: Upgrade para Render Postgres Basic-256mb ($6/mês) — backups automáticos diários incluídos
# Custo estimado: $6/mês
# Métrica de alerta: Executar este script manualmente ao menos 1x por semana no Free Tier

Uso:
    python scripts/db_backup.py
"""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def main():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERRO: DATABASE_URL não definida no ambiente")
        sys.exit(1)

    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"teleradar_pgo_{timestamp}.sql"

    print(f"Iniciando backup: {backup_file}")

    try:
        result = subprocess.run(
            ["pg_dump", "--no-password", "--format=plain", f"--file={backup_file}", database_url],
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:
            print(f"ERRO no pg_dump:\n{result.stderr}")
            sys.exit(1)

        size_mb = backup_file.stat().st_size / 1024 / 1024
        print(f"Backup concluído: {backup_file} ({size_mb:.2f} MB)")
        print()
        print("Para restaurar este backup execute:")
        print(f"  python scripts/db_restore.py {backup_file}")

    except FileNotFoundError:
        print("ERRO: pg_dump não encontrado. Instale o cliente PostgreSQL.")
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print("ERRO: Timeout no backup (>5 min)")
        sys.exit(1)


if __name__ == "__main__":
    main()
