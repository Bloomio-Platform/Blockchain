var Q = require("q");

function N(logger, logstring, def, error, result) {
  if (error != null) { //jshint ignore:line
    if (logger != null) //jshint ignore:line
      logger.Warn(logstring + ".Promise completed with error: " + error);
    def.reject(error);
  } else {
    if (logger != null) //jshint ignore:line
    {
      logger.Log(logstring + ".Promise completed: " + result);
    }
    def.resolve(result);
  }
}

function PromiseWrapper1(f, logger, logstring, arg) {
  var def = Q.defer();
  if (logger !== null)
    logger.Log(logstring + ".Promise ("+arg+")...");
  f.bind(this).call(this, arg, N.bind(this, logger, logstring, def));
  return def.promise;
}

function PromiseWrapper0(f, logger, logstring) {
  var def = Q.defer();
  if (logger != null) //jshint ignore:line
    logger.Log(logstring + ".Promise ()...");
  f.bind(this).call(this, N.bind(this, logger, logstring, def));
  return def.promise;
}

function PromiseWrapperArray(f, logger, logstring, args) {
  var def = Q.defer();
  if (logger != null) //jshint ignore:line
    logger.Log(logstring + ".Promise ("+args+")...");
  args.push(N.bind(this, logger, logstring, def));
  f.bind(this).apply(this, args);
  return def.promise;
}

function PromiseWrapperN(f, logger, logstring/*, ...args*/) {
  var args = [];
  var ll = args.length = arguments.length - 3;
  for (var i = 0; i < ll; ++i) {
    args[i] = arguments[i+3];
  }
  return PromiseWrapperArray(f, logger, logstring, args);
}

function ResolveP(arg) {
  var def = Q.defer();
  def.resolve(arg);
  return def.promise;
}

function RejectP(error) {
  var def = Q.defer();
  def.reject(error);
  return def.promise;
}

function Resolve(arg) {
  return ResolveP.bind(null, arg);
}

module.exports.PromiseWrapperArray = PromiseWrapperArray;
module.exports.PromiseWrapperN = PromiseWrapperN;
module.exports.PromiseWrapper0 = PromiseWrapper0;
module.exports.PromiseWrapper1 = PromiseWrapper1;
module.exports.Resolve = Resolve;
module.exports.ResolveP = ResolveP;
module.exports.RejectP = RejectP;