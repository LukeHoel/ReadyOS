var processScript = function(script){
  //pass to tokenizer
  var tokenizedScript = scriptTokenizer(script);
  //pass tokens to parser
  try{
    return tokenParser(tokenizedScript);
  }catch(error){
    echo(error.message);
  }
}
var scriptTokenizer = function(script){
  var tokens = [];
  //where we define keywords for the language
  var keyWords = [
    {type: "STRING", ex:"\"(.*?)\""},
    {type: "RETURN", ex:"return"},
    {type: "FUNCTION", ex:"function"},
    {type: "IF", ex:"if"},
    {type: "ELSE", ex:"else"},
    {type: "LBRACE", ex:"\\{"},
    {type: "RBRACE", ex:"\\}"},
    {type: "LPAREN",ex:"\\("},
    {type: "RPAREN",ex:"\\)"},
    {type: "TERNARY",ex:"\\?"},
    {type: "COLON",ex:"\\:"},
    {type: "COMMA", ex:"\\,"},
    {type: "EQUAL",ex:"\\="},
    {type: "GREATER",ex:"\\>"},
    {type: "LESSER",ex:"\\<"},
    {type: "NOT",ex:"\\!"},
    {type: "PLUS", ex:"\\+"},
    {type: "MINUS", ex:"\\-"},
    {type: "MULTIPLY", ex:"\\*"},
    {type: "DIVIDE", ex:"\\/"},
    {type: "MODULO", ex:"\\%"},
    {type: "EMPTY", ex:"\/s"}, //exclude empty
    {type: "NAME", ex:"[a-zA-Z_][a-zA-Z0-9_]*"},//put last so we don't false positive other keywords
    {type: "NUMBER", ex:"[+-]?([0-9]*[.])?[0-9]+"},//ok I cheated on stackoverflow for this one. sorry
  ];
  //assemble regular expression
  var regEx = "("
  keyWords.forEach(function(word){
    regEx += word.ex + "|";
  });
  regEx = regEx.slice(0,regEx.length - 1);
  regEx += ")";
  regEx = new RegExp(regEx, "g");
  var matched = script.match(regEx);
  //ok, so we have some matched strings, lets attach them back up with keyWords
  var tokens = [];
  matched.forEach(function(token){
    var found = false;
    keyWords.forEach(function(word){
        if(!found){
          //use the earlier regex to match the string and give it a proper token type
          var matcher = new RegExp(word.ex);
          if(token.match(matcher)){
            //we match the string type using quotes, but we don't need them past here
            if(word.type == "STRING"){token = token.substring(1, token.length-1);}
            tokens.push({type:word.type, value:token});
            found = true;
          }
        }
    });
  });
  return tokens;
}
var tokenIterator;
var tokenParser = function(tokens){
  var functions = [];
  //split up code into functions, using brackets
  var tempFunction = null;
  var numOpenBrackets = 0;
  tokenIterator = {tokens:tokens, currentToken:0};
  var token = nextToken(tokenIterator);
  //start and end for a function
  var startIndex;
  var endIndex;
  while(token){
    //function name and parameters
    if(!tempFunction){
      assertType(tokenIterator.tokens[tokenIterator.currentToken-1],["FUNCTION"]);
      tempFunction = {
      name: assertType(nextToken(), ["NAME"]).value,
      parameters: [],
      tokens:[],
      children:[]};

      assertType(nextToken(),["LPAREN"]);//open parenthesis needs to be here, we don't need to check its value though...
      var next = assertType(nextToken(), ["NAME", "RPAREN"]);
      var more = next.type === "NAME";
      //loop through and get the parameter tokens out
      while(more){
        tempFunction.parameters.push(next.value);
        next = assertType(nextToken(), ["RPAREN", "COMMA"]);
        more = next.type === "COMMA";
        //get the next parameter name ready
        if(more){next = assertType(nextToken(), ["NAME"]);}
      }
      numOpenBrackets = 0;
      startIndex = tokenIterator.currentToken;
    }else{
      //find the beginning and end of the function
      endIndex = tokenIterator.currentToken;
      switch(token.type){
        case("LBRACE"):
          numOpenBrackets ++;
        break;
        case("RBRACE"):
          numOpenBrackets --;
        break;
      }
      if(numOpenBrackets == 0){
        if(startIndex === endIndex){
          throw new SyntaxError("Function has no content");
        }else{
          //we don't want the start/end brackets
          tempFunction.tokens = tokens.slice(startIndex+1, endIndex-1);
          functions.push(tempFunction);
          tempFunction = null;
        }
      }
    }
    token = nextToken();
  }
  if(numOpenBrackets > 0){
    throw new SyntaxError("Reached end of file while searching for end of function");
  }
  functions.forEach(function(func){
    tokenIterator = {tokens:func.tokens, currentToken:0};
    token = nextToken();
    while(token){//different starting character types of expressions
      func.children.push(parseStatement(token,func));
      token = nextToken();
    }
    delete func["tokens"];
  });
  return functions;
}
//groups of inputs
var arthemetic = ["PLUS","MINUS","MULTIPLY","DIVIDE","MODULO"];
var parseStatement = function(token,parent){
  var node = {name: "", type: "", children : []};
  switch(token.type){
    case("NAME")://either a variable reference or a function call
      node.name = token.value;
      var action = tokenIterator.tokens[tokenIterator.currentToken].type;
      //we want to move the cursor over different amounts depending on expression type
      if(action === "LPAREN"){
        node.type = "FUNCTION_CALL";
        assertType(currentToken(),["LPAREN"]);
        nextToken();
        constructStatement(node);
      }else if(action === "EQUAL"){
        node.type = "VARIABLE_ASSIGNMENT";
        nextToken();
        assertType(currentToken(),["LPAREN"]);
        nextToken();
        constructStatement(node);
      }else{
        node.type = "VARIABLE_IDENTIFIER";
      }
    break;
    case("RETURN"):
      //for return statements, we only allow simple variable references (no function calls)
      node.type = token.type;
      constructStatement(node);
      delete node["name"];
    break;
    default:
      node.name = token.value;
      node.type = token.type;
    break;
    }
    return node;
  }

var constructStatement = function(node){
  var counter = 1;
  var curTok = nextToken();
  while(curTok && counter > 0){
    if(curTok.type == "LPAREN"){
      var child = {type: "EXPRESSION", children : []};
      constructStatement(child);
      node.children.push(child);
    }else if(curTok.type == "RPAREN"){
      counter --;
    }
    else if(curTok.type != "COMMA"){
      node.children.push(parseStatement(curTok,node));
    }
    curTok = nextToken();
  }
  lastToken();
  applyGrouping(node);
}

//group ARITHMETIC operations together
var applyGrouping = function(node){
  var newChildren = [];
  var arthemeticOperationCount = 0;
  node.children.forEach(function(child){
    if(arthemetic.includes(child.type)){
      arthemeticOperationCount ++;
      if(arthemeticOperationCount > 1){
        throw new SyntaxError("Only one arthemetic operation is allowed per expression");
      }
    }
  });
  for(var i = 0;i<node.children.length;i++){
    if(arthemetic.includes(node.children[i].type)){
      //check if there are two available objects to insert where
      //left comes from newChildren array
      //Right comes from node children
      var left = newChildren[i-1];
      var right = node.children[i+1];
      if(left && right){
        //make use of the already in array value, so we don't have to delete
        var leftCopy = copy(left);
        delete left["name"];
        left.type = "ARITHMETIC";
        left.operator = node.children[i].type;
        left.children = [leftCopy,right];
        i++;
      }else{
        throw new SyntaxError("Arthemetic operations require two operands");
      }
    }else{
      newChildren.push(copy(node.children[i]));
    }
  }
  node.children = newChildren;
}

var currentToken = function(){
  return tokenIterator.tokens[tokenIterator.currentToken];
}
var nextToken = function(){
  return tokenIterator.tokens[tokenIterator.currentToken ++];
}
var lastToken = function(){
  return tokenIterator.tokens[tokenIterator.currentToken --];
}
//pass in possible characters, throw error if none match
var assertType = function(token, types){
  var match = false;
  types.forEach(function(type){
    if(type === token.type){match = true;}
  });
  if(match){
    return token;
  }else{
    //SHOW THE SURROUNDING CHARACTERS FOR CONTEXT
    var howManyAround = 3;
    var index = tokenIterator.currentToken - 1;
    var ret = "";
    var i = 0;
    tokenIterator.tokens.forEach(function(tok){
      if(Math.abs(i - index) < howManyAround){
        if(i == index){
          ret += "\'" + tok.value + "\' ";
        }else{
          ret += tok.value + " ";
        }
        i ++;
      }
    });
    throw new SyntaxError("Unexpected character \'" + token.value + "\' in " + ret + ". Expected one of these types: " + types);
  }
}
