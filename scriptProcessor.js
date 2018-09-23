var processScript = function(script){
  //pass to tokenizer
  var tokenizedScript = scriptTokenizer(script);
  //pass tokens to parser
  try{
    var parsedScript = tokenParser(tokenizedScript);
  }catch(error){
  echo(error.message);
  }
}
var scriptTokenizer = function(script){
  var tokens = [];
  //where we define keywords for the language
  var keyWords = [
    {type: "FUNCTION", ex:"function"},
    {type: "IF", ex:"if"},
    {type: "ELSE", ex:"else"},
    {type: "PRINT", ex:"print"},
    {type: "LBRACE", ex:"\\{"},
    {type: "RBRACE", ex:"\\}"},
    {type: "LPAREN",ex:"\\("},
    {type: "RPAREN",ex:"\\)"},
    {type: "TERNARY",ex:"\\?"},
    {type: "COLON",ex:"\\:"},
    {type: "SEMICOLON",ex:"\\;"},
    {type: "COMMA", ex:"\\,"},
    {type: "EQUAL",ex:"\\="},
    {type: "GREATER",ex:"\\>"},
    {type: "LESSER",ex:"\\<"},
    {type: "NOT",ex:"\\!"},
    {type: "DOUBLE_QUOTE", ex:"\""},
    {type: "PLUS", ex:"\\+"},
    {type: "MINUS", ex:"\\-"},
    {type: "MULTIPLY", ex:"\\*"},
    {type: "DIVIDE", ex:"\\/"},
    {type: "MODULO", ex:"\\%"},
    {type: "EMPTY", ex:"\/s"}, //exclude empty
    {type: "NUMBER", ex:"\\d+"},
    {type: "NAME", ex:"[a-zA-Z_][a-zA-Z0-9_]*"},//put last so we don't false positive other keywords
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
      tempFunction = {name: assertType(nextToken(), ["NAME"]).value, parameters: [], tokens:[]};
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
    token = nextToken(tokenIterator);
  }
  if(numOpenBrackets > 0){
    throw new SyntaxError("Reached end of file while searching for end of function");
  }
  console.log(functions);
}
var nextToken = function(){
  return tokenIterator.tokens[tokenIterator.currentToken ++];
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
    throw new SyntaxError("Unexpected character \'" + token.value + "\'");
  }
}
