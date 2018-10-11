var notFound = "Not Found";
var fileAlreadyExists = "File with same name exists in this location";
var error = function(message){
  echo(message, errorColor);
}
var paramsError = function(methodName){
  throw new Error("Wrong number of arguments in call to method " + methodName);
}
