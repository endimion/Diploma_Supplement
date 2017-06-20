    var mailstoRemove = [];

    function removeUser(email,key){
      mailstoRemove.push(email);
      $("#"+key).hide();
    }


    function saveShareChanges(event){
      event.preventDefault();
      //ajax call to save changes to hl
      mailstoRemove.forEach( (elt,ind) =>{
        console.log(elt);
      });
    }
