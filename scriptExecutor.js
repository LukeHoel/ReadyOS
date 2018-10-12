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
            case("arrayDef"):
            case("arrayValue"):
              ret = func.content;
            break;
            default:
            //pass in arguments
            if(func.parameters){
              if(func.parameters.length != child.children.length){
                paramsError(child.name);
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
  return ret;
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
      var len = node.children.length;
      if(len < 1 || len > 2){
        paramsError(node.name);
      }
      ret = evaluateNode({children:[node.children[0]]}, method, program) || " ";//dont return null, return space
      var color = "";
      if(node.children[1]){//color of print statement
        color = evaluateNode({children:[node.children[1]]}, method, program);
      }
      echo(ret,color);
    break;
    case("scan"):
      ret = {type: "scan", content: getUserInput(evaluateNode(node, method, program))};
    break;
    case("arrayDef"):
      var arr = [];
      node.children.forEach(function(child){
        //evaluate each child node (parameter), and add them to the new array
        arr.push(evaluateNode({children:[child]}, method, program));
      });
      ret = {type: "arrayDef", content: arr}
    break;
    case("arrayGet")://reuse same code for most of get/set code, only changing what is done with it at the end
    case("arraySet"):
      //takes two params, array and index
      var len = node.children.length;
      if(len != (node.name == "arrayGet" ? 2 : 3)){
        paramsError(node.name);
      }
      var arr = evaluateNode({children:[node.children[0]]}, method, program);
      if(!Array.isArray(arr)){
        throw new Error("Wrong type of value in parameter 0 of valueAtIndex method. Must be array");
      }
      var index = evaluateNode({children:[node.children[1]]}, method, program);
      if(index < 0 || index > arr.length){
        throw new Error("Array index out of range of array");
      }
      if(node.name == "arraySet"){
        arr[index] = evaluateNode({children:[node.children[2]]}, method, program);
      }
      ret = {type: "arrayValue", content: arr[index]}//return value regardless

    break;
  }
  return ret;
}

var getUserInput = function(question){
  return prompt(question);
}
