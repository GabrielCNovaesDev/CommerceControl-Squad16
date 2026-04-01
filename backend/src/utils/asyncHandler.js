/**
 * Envolve um handler async e encaminha qualquer erro para next(err),
 * eliminando try/catch repetitivo nos controllers.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
