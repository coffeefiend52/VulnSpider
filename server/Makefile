.PHONY: install lint lint-fix format format-check test check

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
