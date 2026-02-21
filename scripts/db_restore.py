#!/usr/bin/env python3
"""
Script de restore do banco de dados PostgreSQL.

ATENÇÃO: Este script substitui TODOS os dados do banco pelo arquivo de dump.
Use com cuidado em produção.

Uso:
    python scripts/db_restore.py backups/teleradar_pgo_20260221_120000.sql
"""

import os
import subprocess
import sys
from pathlib import Path


def main():
    if len(sys.argv) != 2:
        print("Uso: python scripts/db_restore.py <arquivo_de_dump.sql>")
        sys.exit(1)

    dump_file = Path(sys.argv[1])
    if not dump_file.exists():
        print(f"ERRO: Arquivo não encontrado: {dump_file}")
        sys.exit(1)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERRO: DATABASE_URL não definida no ambiente")
        sys.exit(1)

    print(f"ATENÇÃO: Isso irá substituir todos os dados do banco.")
    print(f"Arquivo: {dump_file}")
    confirm = input("Digite 'SIM' para confirmar: ")
    if confirm.strip() != "SIM":
        print("Operação cancelada.")
        sys.exit(0)

    print(f"Iniciando restore de: {dump_file}")

    try:
        result = subprocess.run(
            ["psql", "--no-password", database_url, f"--file={dump_file}"],
            capture_output=True,
            text=True,
            timeout=600,
        )

        if result.returncode != 0:
            print(f"ERRO no psql:\n{result.stderr}")
            sys.exit(1)

        print("Restore concluído com sucesso.")

    except FileNotFoundError:
        print("ERRO: psql não encontrado. Instale o cliente PostgreSQL.")
        sys.exit(1)


if __name__ == "__main__":
    main()
