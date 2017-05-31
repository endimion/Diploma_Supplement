'use strict';

// getAndAppendQrSvg("testSVGSup","svgContent");


function sendEmail(emailInput,supIdInput,id){
  let _email = $("#"+emailInput).val();
  let _supId = $("#"+ supIdInput).val();
  // console.log("will send email " + _email + " id " + _supId);
  let data = { email: _email, supId: _supId };
  $(".sendEmail").hide();
  $(".preloader").show();

  $.post( "/supplement/share",data)
  .done( res => {
      // alert( "second success" );
      // Materialize.toast(message, displayLength, className, completeCallback);
      let $toastContent = $('<span>Diploma supplement sharable link sent via email!</span>');
      Materialize.toast($toastContent, 5000);
  })
  .fail(function() {
    let $toastContent = $('<span>oops... could not send email. Please try again</span>');
    Materialize.toast($toastContent, 5000);
    // alert( "" );
  })
  .always(function() {
    $('#modal'+id).modal('close');
    $(".sendEmail").show();
    $(".preloader").hide();
  });


}
