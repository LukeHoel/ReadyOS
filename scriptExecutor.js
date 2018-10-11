var parseProgramJson = function(path){
  var file = dirAtPath(path,"dir");
  if(file && !file.isDir && file.content){
    var program = JSON.parse(file.content);
    return program;
  }else{
    echo("File doesn't exist or is a directory");
  }
}
var execute = function(program){
  //search for and run main function with return type int
  program.forEach(function(func){
    if(func.name == "main"){
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
          setVariable(child, method, program, null);
        break;
        case("STRING"):
        case("NUMBER"):
          ret = child.type == "NUMBER" ? parseFloat(child.name) : child.name;
        break;
        case("FUNCTION_CALL"):
          var func = getFunctionObject(child, method, program);
          switch(func.type){
            case ("scan"):
              ret = func.content;
            break;
            default:
            //pass in arguments
            if(func.parameters){
              if(func.parameters.length != child.children.length){
                throw new Error("Wrong number of arguments in call to method " + child.name);
              }
              for(var i = 0; i < func.parameters.length; i ++){
                //fake the structre of a node so we don't need to write new code
                setVariable({name: func.parameters[i], children:[child.children[i]]}, func, program, method);
              }
            }
            ret = evaluateNode(func, func, program); //change method
          break;
        }
        break;
        case("VARIABLE_IDENTIFIER"):
          ret = getVariableValue(child.name, method, program);
        break;
        case("ARITHMETIC"):
          var lookUp = {
            PLUS: "+",
            MINUS: "-",
            MULTIPLY: "*",
            DIVIDE: "/",
            MODULO: "%"
          }
          var evaluatedFirst = evaluateNode({children:[child.children[0]]},method,program);
          var evaluatedSecond = evaluateNode({children:[child.children[1]]},method,program);
          //wrap in extra quotes because so eval doesn't think we want to get a variable
          if(typeof evaluatedFirst == "string"){evaluatedFirst = "\"" + evaluatedFirst + "\"";}
          if(typeof evaluatedSecond == "string"){evaluatedSecond = "\"" + evaluatedSecond + "\"";}
          //construct string to evaluate based on type of operation.
          ret = eval(evaluatedFirst + lookUp[child.operator] + evaluatedSecond);
          if(ret != ret){
            ret = "NaN";
          }
        break;
        case("RETURN"):
        case("EXPRESSION"):
          ret = evaluateNode(child, method, program)
        break;
      }
    });
  }
  return ret;
}

var setVariable = function(node, method, program, sourceMethod){
  if(!method.variables){method.variables = {};}
  //sourcemethod is when passing variable identifier as parameterS
  var test = evaluateNode(node, sourceMethod || method, program);
  method.variables[node.name] = test;
}

var getFunctionObject = function(node, method, program){
  //check if any reserved function names match first
  var ret = reservedFunctions(node, method, program);
    if(!ret){
    program.forEach(function(func){
      if(func.name == node.name){
        ret = func;
      }
    });
    if(!ret){throw new Error("Method with name " + node.name + " not found, or an error occured in evaluation")}
  }
  return JSON.parse(JSON.stringify(ret));
}

var getVariableValue = function(varName, node, method){
  if(node.variables[varName]){
    return node.variables[varName];
  }else{
    throw new Error("Variable with name " + varName + " not found");
  }
}

var reservedFunctions = function(node, method, program){
  var ret;
  switch(node.name){
    case("print"):
      ret = evaluateNode(node, method, program) || " ";//dont return null, return space
      echo(ret);
    break;
    case("scan"):
      ret = {type: "scan", content: getUserInput(evaluateNode(node, method, program))};
    break;
  }
  return ret;
}

var getUserInput = function(question){
  return prompt(question);
}
