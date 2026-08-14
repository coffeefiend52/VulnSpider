"""
Dump schemas.py to JSON Schema at ../schema/api.schema.json.

The client's ``npm run gen:types`` compiles that file into
client/src/types.generated.ts. Run via ``make schema`` whenever a response
shape in schemas.py changes.
"""

import json
import os

from marshmallow_jsonschema import JSONSchema

from schemas import (
    ModelsResponse,
    Site,
    SseDoneEvent,
    SseErrorEvent,
    SsePageEvent,
)

# Every top-level entity the client needs a generated type for. Anything they
# reference (Vulnerability, RobotsTxtResult, ...) gets pulled in automatically
# as its own named definition.
_ENTRY_POINTS = {
    "Site": Site,
    "SsePageEvent": SsePageEvent,
    "SseDoneEvent": SseDoneEvent,
    "SseErrorEvent": SseErrorEvent,
    "ModelsResponse": ModelsResponse,
}

# Site is deliberately excluded from the root "properties" below (though its
# schema is still dumped above so it lands in "definitions") — it's already
# reachable via SsePageEvent.page, and referencing it a second time from the
# root causes json-schema-to-typescript to declare it twice under different
# names (Site / Site1).
_ROOT_PROPERTIES = [name for name in _ENTRY_POINTS if name != "Site"]

_OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "schema", "api.schema.json"
)


def _clean(node):
    """Tidy up marshmallow-jsonschema's output for TS codegen:

    - Drop the per-field "title"/"enumNames" noise it adds to every property.
      Left in place, json-schema-to-typescript hoists each one into its own
      top-level type alias (``Content``, ``Description``, ...) instead of a
      clean, flat set of named interfaces.
    - Drop sibling keys next to "$ref" (e.g. the "type": "object" it puts on
      every ``$ref``'d list item). Per JSON Schema draft-07 these siblings
      are ignored anyway, and leaving them in trips up json-schema-to-typescript's
      ref resolution.
    """
    if isinstance(node, dict):
        node.pop("title", None)
        node.pop("enumNames", None)
        if "$ref" in node:
            for key in [k for k in node if k != "$ref"]:
                del node[key]
            return
        for value in node.values():
            _clean(value)
    elif isinstance(node, list):
        for item in node:
            _clean(item)


def build_bundle() -> dict:
    dumper = JSONSchema()
    definitions: dict = {}
    for schema_cls in _ENTRY_POINTS.values():
        dumped = dumper.dump(schema_cls())
        definitions.update(dumped["definitions"])

    bundle = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "definitions": definitions,
        "type": "object",
        "properties": {
            name: {"$ref": f"#/definitions/{name}"} for name in _ROOT_PROPERTIES
        },
    }
    _clean(bundle)
    return bundle


def main() -> None:
    bundle = build_bundle()
    os.makedirs(os.path.dirname(_OUTPUT_PATH), exist_ok=True)
    with open(_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)
        f.write("\n")
    print(f"Wrote {os.path.abspath(_OUTPUT_PATH)}")


if __name__ == "__main__":
    main()
