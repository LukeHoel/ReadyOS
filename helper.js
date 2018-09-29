function getMyKeyName(child){
  var parent = child.parentDir;
  var keys = Object.keys(parent.children);
  var foundDirName;
  //search for a matching directory name, save it and return it at the end
  keys.forEach(function(currentDirName){
    if(!foundDirName){
      if(parent.children[currentDirName] == child){
        foundDirName = currentDirName;
      }
    }
  });
  return foundDirName;
}
function dirAtPath(str, retType){
  if(str){
  var splitPath = str.split("/");
  var isValid = true;
  //check for leading / which is the root symbol
  var pwdCopy = str.charAt(0) == '/' ? fileSystem.root: fileSystem.pwd;
  splitPath.forEach(function(pathSeg){
    if(pathSeg && isValid){
      if(pathSeg == "."){
        //self reference
        pwdCopy = pwdCopy;
      }
      else if(pathSeg == ".."){
        pwdCopy = pwdCopy.parentDir;
      }
      else if(pwdCopy.children[pathSeg]){
        pwdCopy = pwdCopy.children[pathSeg];
      }else{
        isValid = false;
      }
    }
  });
  //only return isvalid if it is a directory
  return retType == "isValid" ? (isValid && pwdCopy.isDirectory): pwdCopy;
}else{
  //root
  return retType == "isValid" ? true : fileSystem.pwd;
}
}
function splitDirAndEndSeg(str){
  var splitStr = str.split("/");
  var endSeg = splitStr[splitStr.length - 1];
  var lastIndex = str.lastIndexOf("/");
  var subString = lastIndex > 0 ? str.substr(0, lastIndex) : str;
  var dir = dirAtPath(subString, "dir");
  return {dir: dir, endSeg: endSeg}
}
//array include for ie
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, "includes", {
    enumerable: false,
    value: function(obj) {
        var newArr = this.filter(function(el) {
          return el == obj;
        });
        return newArr.length > 0;
      }
  });
}