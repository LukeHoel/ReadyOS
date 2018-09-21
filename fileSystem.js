var fileSystem = {
  root : {children:{},  isDirectory : true},
  pwd : null, //set this to files on startup
}
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
pathAndUsername = function(){
  return "[" + pwd() + "]"
}
