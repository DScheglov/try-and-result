# Change Log

## 1.0.x

- Initial release
- Introduced
  - `doTry` function
  - `ErrValueTuple` type
  - `UnknownError` type
  - `DoTryError` class
  
## 1.1.x

- Added
  - `success` and `failure` constructor functions
  - `DoTryError` subclasses:
    - `DoTryError.NotAFunction`
    - `DoTryError.NullishValueRejected`
    - `DoTryError.NullishValueThrown`
