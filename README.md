(WIP) Degurechaff - Toml Parser in Typescript
=================

TODO:

Lexer:
- [DONE] integer
- [DONE] float
- [DONE] support exponent syntax
- [DONE] comment
- string
  - Basic string
    - [DONE] Single
    - Multiline
  - Literal string
    - [DONE] Single
    - Multiline
- Date
  - Offset Date-Time
  - Local Date-Time
  - Local Date

Parser
- [DONE] Key
  - [DONE] BasicString
  - [DONE] Integer
- Value
  - Array
  - Primitive
    - [DONE] BasicString
    - [DONE] Integer
    - [DONE] Boolean
    - [DONE] Float
    - Date
  - Inline Table
- [DONE] Table
  - [DONE] single name
  - Nested Name
- [DONE] Array of Table

Emitter
- JSON
- AST
