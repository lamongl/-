"""Reuse the original benchmark's exact inputs without duplicating task definitions."""
import runpy
from pathlib import Path
source=runpy.run_path(str(Path(__file__).with_name('benchmark-skill.py')))
COMMON=source['COMMON']
TASKS=source['TASKS']
