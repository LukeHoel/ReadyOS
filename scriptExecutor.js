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
  //search for and run main function with return type int
  program.forEach(function(func){
    if(func.name == "main" && func.returnType == "RET_VOID"){
      program.main = func;
    }
  });
  //throw runtime error if not found
  if(!program.main){
    throw new Error("Method with name \'main\' and return type void not found");
  }
  //rest of program execution assuming main exists
  program.variables = {};
  evaluateNode(program.main,program.main,  program);
}
var evaluateNode = function(node, method, program){
  var ret;
  //node might be a variable value being passed up
  if(node.children){
    node.children.forEach(function(child){
      switch(child.type){
        case("VARIABLE_ASSIGNMENT")://register variable
          if(!method.variables){node.variables = {};}
          method.variables[child.name] = evaluateNode(child, method, program);
        break;
        case("STRING"):
        case("NUMBER"):
          ret = child.name;
        break;
        case("FUNCTION_CALL"):
          var func = getFunctionObject(child, method, program);
          ret = evaluateNode(func, func, program); //change method
        break;
        case("VARIABLE_IDENTIFIER"):
          ret = getVariableValue(child.name, method, program);
        break;
      }
    });
  }
  return ret;
}

var getFunctionObject = function(node, method, program){
  //check if any reserved function names match first
  var ret = reservedFunctions(node, method, program);
    if(!ret){
    program.forEach(function(func){
      if(func.name == node.name){
        ret = func;//we want a copy, so we can copy multiple times without memory leak
      }
    });
    if(!ret){throw new Error("Method with name " + node.name + " not found")}
  }
  return JSON.parse(JSON.stringify(ret));
}

var getVariableValue = function(varName, node, method){
  if(node.variables){
    return node.variables[varName];
  }else{
    throw new Error("Variable with name " + varName + " not found");
  }
}

var reservedFunctions = function(node, method, program){
  var ret;
  switch(node.name){
    case("print"):
      ret = evaluateNode(node, method, program);
      echo(ret);
    break;
  }
  return ret;
}
