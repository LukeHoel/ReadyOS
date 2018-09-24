var parseProgramJson = function(path){
  var file = dirAtPath(path,"dir");
  if(file && !file.isDir){
    var program = JSON.parse(file.content);
    return program;
  }else{
    echo("File doesn't exist or is a directory");
  }
}
var execute = function(program){
  console.log(program);
}
