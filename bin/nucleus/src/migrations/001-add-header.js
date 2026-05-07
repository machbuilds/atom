// 001 — add file header.
//
// v0.1.x JSONL files have no header line; every entry has `schema_version: 1`
// inline. v0.2 adds a header `{"_atom_nucleus": true, "_schema": 1}` at
// the top of the file so future migrations can detect file version in O(1)
// without scanning every entry.
//
// Entries are unchanged.

export const version = 1;
export const description = 'add {_atom_nucleus, _schema} header line';

export function up({ header, entries }) {
  return {
    header: { _atom_nucleus: true, _schema: 1 },
    entries,
  };
}
