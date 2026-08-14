.PHONY: install lint lint-fix format format-check test check schema

install:
	pip install -r requirements-dev.txt

lint:
	ruff check .

lint-fix:
	ruff check . --fix

format:
	black .

format-check:
	black --check .

test:
	pytest

check: lint format-check test

# Regenerates ../schema/api.schema.json from schemas.py. Run this after
# changing schemas.py, then `npm run gen:types` in client/ to update
# src/types.generated.ts. `make test` fails if either step is skipped.
schema:
	python export_schema.py
