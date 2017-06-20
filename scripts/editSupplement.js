    var mailstoRemove = [];

    function removeUser(email,key){
      mailstoRemove.push(email);
      $("#"+key).hide();
    }


    function saveShareChanges(event, supplementId){
      event.preventDefault();
      let data = {};
      data.supId = supplementId;
      data.emails = mailstoRemove;

      mailstoRemove.forEach( (elt,ind) =>{
        console.log(elt);
      });
      //ajax call to save changes to hl
      $.post("/supplement/removeInvites",data)
      .done(res =>{
        console.log(res);
      })
      .fail(err =>{
        console.log(err);
      });

    }
