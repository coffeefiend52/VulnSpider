import json

from export_schema import _OUTPUT_PATH, build_bundle


def test_checked_in_schema_matches_schemas_py():
    """schema/api.schema.json must match what schemas.py currently produces.

    If this fails, someone edited schemas.py without running `make schema`
    (and then `npm run gen:types` in client/) to regenerate the contract —
    see export_schema.py.
    """
    with open(_OUTPUT_PATH, encoding="utf-8") as f:
        checked_in = json.load(f)

    assert build_bundle() == checked_in
