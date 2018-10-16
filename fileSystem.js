var fileSystem = {
  root : {children:{},  isDirectory : true},
  pwd : null,
}
fileSystem.pwd = fileSystem.root;//set to root to start off with
function newFile(parentDir, isDirectory){
  return {parentDir:parentDir,isDirectory:isDirectory, children: {}, content : ""}
}
function pwd(){
  var ret = "";
  var currentDir = fileSystem.pwd;
  while(currentDir.parentDir){
    ret = "/" + getMyKeyName(currentDir) + ret;
    currentDir = currentDir.parentDir;
  }
  return ret;
}
path = function(){
  return "[" + pwd() + "]"
}
