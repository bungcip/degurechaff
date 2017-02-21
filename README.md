(WIP) Degurechaff - Toml Parser in Typescript
=================

TODO:

Lexer:
- [DONE] integer
- float
- support exponent syntax
- [DONE] comment
- bool
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
  - 
- Value
  - Array
  - Primitive
    - [DONE] BasicString
    - [DONE] Integer
    - [DONE] Boolean
    - Date
- [DONE] Table
  - [DONE] single name
  - Nested Name
- Array of Table

Emitter
- JSON
- AST
