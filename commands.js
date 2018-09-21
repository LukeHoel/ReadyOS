var echo = function(str){
  console.log(str);
}
var mkdirOrTouch = function(str, isDir){
  var oldDir = fileSystem.pwd;
  //split path and new name
  var split = splitDirAndEndSeg(str);
  if(split.dir.isDirectory){
    if(split.dir){
      if(split.dir.children[split.endSeg]){
        echo("Directory \""+ str +"\" already exists");
      }else{
        split.dir.children[split.endSeg] = newFile(split.dir,isDir);
        echo(pathAndUsername() + (isDir ? " mkdir ": " touch ") + str);
      }
    }
  }else{
    echo("Not a directory");
  }
}
var cd = function(str){
  if(str){
    //check if the folder path is valid or not before doing it for real
    var isValid = dirAtPath(str, "isValid");
    var splitPath = str.split("/");
    if(isValid){
      fileSystem.pwd = str.charAt(0) == '/' ? fileSystem.root : fileSystem.pwd;
      angular.forEach(splitPath, function(pathSeg){
        if(pathSeg){
          if(pathSeg == "."){
            //self reference
            fileSystem.pwd = fileSystem.pwd;
          }
          else if(pathSeg == ".." && fileSystem.pwd != fileSystem.root){
            //parent dir
            fileSystem.pwd = fileSystem.pwd.parentDir;
          }
          else{
            //go down
            fileSystem.pwd = fileSystem.pwd.children[pathSeg];
          }
      }
      });
      echo(pwd());
    }else{
        echo("Directory not found");
    }
  }else{
    fileSystem.pwd = fileSystem.root;
  }
}
var ls = function(str){
  //all files are stored as key value pairs. this gets their key values and presents them as "file names"
  var dir = dirAtPath(str,"dir");
  var keys = Object.keys(dir.children);
  var ret = "";
  angular.forEach(keys,function(key){
    ret += key + " ";
  });
  echo(ret || pathAndUsername() + " ls " + (str || "/"));
}
var rm = function(str){
  var dir = splitDirAndEndSeg(str);
  if(dir.dir.parentDir){
    delete dir.dir.parentDir.children[dir.endSeg];
  }else{
    echo(notFound);
  }
}
//no need to pass in string for parsing
var rmByObj = function(dir){
    var name = getMyKeyName(dir);
    delete dir.parentDir.children[name];
}
var mvOrcp = function(sourceStr, destStr, isCopy){
  var source = dirAtPath(sourceStr);
  var dest = splitDirAndEndSeg(destStr);
  if(source){
    if(dest.dir.children[dest.endSeg]){
      echo(fileAlreadyExists);
    }else{
      //make dir and set up parent directory
      dest.dir.children[dest.endSeg] = angular.copy(source);
      dest.dir.children[dest.endSeg].parentDir = dest.dir;
      if(!isCopy){
        //so long, stray folder!
        rmByObj(source);
      }
    }
}else{
  echo(notFound);
}
}
