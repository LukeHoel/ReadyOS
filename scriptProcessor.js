var processScript = function(script){
  //pass to tokenizer
  var tokenizedScript = scriptTokenizer(script);
  //pass tokens to parser
  var parsedScript = tokenParser(tokenizedScript);
  // try{
  //   var parsedScript = tokenParser(tokenizedScript);
  // }catch(error){
  // echo(error.message);
  // }
}
var scriptTokenizer = function(script){
  var tokens = [];
  //where we define keywords for the language
  var keyWords = [
    {type: "STRING", ex:"\"(.*?)\""},
    {type: "FUNCTION", ex:"function"},
    {type: "IF", ex:"if"},
    {type: "ELSE", ex:"else"},
    {type: "LBRACE", ex:"\\{"},
    {type: "RBRACE", ex:"\\}"},
    {type: "LPAREN",ex:"\\("},
    {type: "RPAREN",ex:"\\)"},
    {type: "TERNARY",ex:"\\?"},
    {type: "COLON",ex:"\\:"},
    {type: "SEMICOLON",ex:"\\;"},
    {type: "COMMA", ex:"\\,"},
    {type: "DOT", ex:"\\."},
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
    {type: "NUMBER", ex:"\\d+"},
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
      tempFunction = {name: assertType(nextToken(), ["NAME"]).value, parameters: [], tokens:[], children:[]};
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
  console.log(functions);
}
var parseStatement = function(token,parent){
  var node = {name: "", type: "", children : []};
  switch(token.type){
    case("NAME"):
      node.name = token.value;
      assertType(nextToken(),["LPAREN","COMMA","RPAREN"]);//open parenthesis needs to be here, we don't need to check its value though...
      //check if is function call or variable identifier
      if(tokenIterator.tokens[tokenIterator.currentToken-1].type === "LPAREN"){
        node.type = "FUNCTION_CALL";
        var next = assertType(nextToken(), ["STRING","NUMBER","NAME", "RPAREN"]);
        var more = next.type !== "RPAREN";
        //loop through and get the parameter tokens out
        while(more){
          //yay recursion
          node.children.push(parseStatement(next,node));
          next = assertType(nextToken(), ["STRING","NUMBER","NAME", "RPAREN", "COMMA"]);
          more = next.type === "COMMA";
          //get the next parameter name ready
          if(more){next = assertType(nextToken(), ["STRING","NUMBER","NAME"]);}
        }
        endIndex = token.currentToken;
        return node;
      }else{
        lastToken();
        node.type = "VARIABLE_IDENTIFIER";
        return node;
      }
    break;
    case("DOT"):
      node.type = "ATTRIBUTE_ACCESSOR";
      node.name = assertType(nextToken(),["NAME"]).value;
      return node;//points up to previous statement or variable
    break;
    case("SEMICOLON"):
    default:
      node.name = token.value;
      node.type = token.type;
      return node;
    break;
  }
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
