var processScript = function(script){
  //pass to tokenizer
  var tokenizedScript = scriptTokenizer(script);
  //pass tokens to parser
  var parsedScript = tokenParser(tokenizedScript);
}
var scriptTokenizer = function(script){
  var tokens = [];
  //where we define keywords for the language
  var keyWords = [
    {type: "IF", ex:"if"},
    {type: "ELSE", ex:"else"},
    {type: "PRINT", ex:"print"},
    {type: "LBRACE", ex:"\\{"},
    {type: "RBRACE", ex:"\\}"},
    {type: "LPAREN",ex:"\\("},
    {type: "RPAREN",ex:"\\)"},
    {type: "SEMICOLON",ex:";"},
    {type: "EQUAL",ex:"="},
    {type: "GREATER",ex:">"},
    {type: "LESSER",ex:"<"},
    {type: "NOT",ex:"!"},
    {type: "DOUBLE_QUOTE", ex:"\""},
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
            tokens.push({name:word.type, value:token});
            found = true;
          }
        }
    });
  });
  return tokens;
}
var tokenParser = function(tokens){

}
