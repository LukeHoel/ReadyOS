function processCommand(command){
  if(command.length > 0){
    // split command by spaces
    var splitCommand = command.split(" ");
    switch(splitCommand[0]){
      case("echo"):
        echo(command.split(/ (.+)/)[1]);
      break;
      case("mkdir"):
        //go though words seperated by spaces after command, make a dir of each
        for(var i =1; i < splitCommand.length; i ++){
          mkdirOrTouch(splitCommand[i], true);
        }
      break;
      case("cd"):
        //ignores all words after 2nd
          cd(splitCommand[1]);
      break;
      case("ls"):
      //ignores all words after 2nd
        ls(splitCommand[1]);
      break;
      case("pwd"):
        echo(pwd() || "/");
      break;
      case("rm"):
        //go though words seperated by spaces after command, make a dir of each
        for(var i =1; i < splitCommand.length; i ++){
          rm(splitCommand[i]);
        }
      break;
      case("clear"):
        vm.lines = linesRef = [];
      break;
      case("mv"):
      case("cp"):
        //needs two arguments
        if(splitCommand[1] && splitCommand[2]){
          mvOrcp(splitCommand[1],splitCommand[2], splitCommand[0] == "cp");
        }else{
          echo("Usage: mv source destination");
        }
      break;
      case("touch"):
        for(var i =1; i < splitCommand.length; i ++){
          mkdirOrTouch(splitCommand[i], false);
        }
      break;
      default:
        if(extraCommands()){
          extraCommands(splitCommand);
        }
        echo("Unrecognized command \"" + splitCommand[0] + "\"");
      break;
    }
  }
}
