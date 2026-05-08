---
type: pattern
applies_to: [python, api]
slug: pydantic-v2-over-v1
---

# Pydantic v2 over v1 for new projects

## Pattern

For new FastAPI services, pin `pydantic>=2` and write models against
the v2 API. Don't reach for `pydantic.v1.*` shims unless a dependency
forces it.

## Why

- v2 is faster (rust-based core, ~5-50x parsing speedup depending on
  payload shape) and the validation rules are more consistent.
- v1 is in long-term maintenance only; new FastAPI features assume v2
  semantics (e.g., `model_validator`, `field_validator` decorators).
- Mixing v1 and v2 in the same project means dual import paths, dual
  validator decorators, and dual mental models — rarely worth the
  complexity.

## How to apply

- Use `pydantic-settings` for env-based config (it's the v2-native
  successor to `BaseSettings`, which moved out of pydantic core).
- Replace `@validator` with `@field_validator` and
  `@root_validator` with `@model_validator(mode='after')`.
- Replace `Config` inner class with `model_config = ConfigDict(...)`
  or `model_config = SettingsConfigDict(...)`.
- If a dependency still hardcodes v1 imports, isolate it with
  `from pydantic.v1 import BaseModel as V1Model` rather than
  pinning the whole project to v1.
