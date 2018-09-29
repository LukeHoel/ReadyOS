var echo = function(str){
  console.log(str);
}
var fileSystemChanged = function(){
  //called when file system is changed... override something here in implementation
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
        echo(path() + (isDir ? " mkdir ": " touch ") + str);
        fileSystemChanged();
        return split.dir.children[split.endSeg];
      }
    }
  }else{
    echo("File already exists, or is not a directory ");
  }
}
var cd = function(str){
  if(str){
    //check if the folder path is valid or not before doing it for real
    var isValid = dirAtPath(str, "isValid");
    var splitPath = str.split("/");
    if(isValid){
      fileSystem.pwd = str.charAt(0) == '/' ? fileSystem.root : fileSystem.pwd;
      splitPath.forEach(function(pathSeg){
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
  keys.forEach(function(key){
    ret += key + " ";
  });
  echo(ret || path() + " ls " + (str || "/"));
}
var rm = function(str){
  var dir = splitDirAndEndSeg(str);
  if(dir.dir.parentDir){
    delete dir.dir.parentDir.children[dir.endSeg];
    fileSystemChanged();
  }else{
    echo(notFound);
  }
}
//no need to pass in string for parsing
var rmByObj = function(dir){
    var name = getMyKeyName(dir);
    delete dir.parentDir.children[name];
    fileSystemChanged();
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
      fileSystemChanged();
    }
}else{
  echo(notFound);
}
}
var extraCommands = function(){
  echo("Unrecognized command \"" + splitCommand[0] + "\"");
}
var compile = function(str,dest){
  //send the file found to the scriptProcessor

    var compiledData = JSON.stringify(processScript(dirAtPath(str,"dir").content));
    if(compiledData){
      var newFile = mkdirOrTouch(dest,false);
      newFile.content = compiledData;
      fileSystemChanged();
      echo(path() + " compile " + str);
    }
  }
