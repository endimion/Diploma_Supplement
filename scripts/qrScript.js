

// getAndAppendQrSvg("testSVGSup","svgContent");


function getAndAppendQrSvg(supId, parentNodeId){
  var ajax = new XMLHttpRequest();
  ajax.open("GET", "/qr/get/"+supId, true);
  ajax.send();
  ajax.onload = function(e) {
    let div = document.createElement("div");
    div.innerHTML = ajax.responseText;
    let parent = document.getElementById(parentNodeId);
    parent.insertBefore(div, parent.childNodes[0]);
  }
}


function getAndDisplayOrHideQr(supId,parentNodeId){
  let parent = document.getElementById(parentNodeId);
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  if (parent.style.display === "none"){
    getAndAppendQrSvg(supId, parentNodeId);
    parent.style.display = "block";
  }else{
    parent.style.display = "none";
  }

}


function makeQRcode(emailInput,supIdInput,id){
  let _email = $("#"+emailInput).val();
  let _supId = $("#"+ supIdInput).val();
  // console.log("will send email " + _email + " id " + _supId);
  let params  = "supId="+_supId+"&email="+_email;
  $(".sendEmail").hide();
  $(".modalMessage").hide();
  $(".qrCode").hide();
  $(".preloader").show();

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "/supplement/shareQR", true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhr.onload = function(e) {
    $(".preloader").hide();
    $(".qrCode").show();
    // let div = document.getElementById("qrImage"+id);
    // div.innerHTML = this.responseText;
    canvg(document.getElementById('canvas'+id), this.responseText,{ ignoreMouse: true, ignoreAnimation: true });
    // makeQRLink("qrImage"+id,"qrLink"+id);
    let canvas = document.getElementById('canvas'+id);
    let img    = canvas.toDataURL("image/png");
    document.getElementById('imgContainer'+id).innerHTML = "<img src='" + img + "'>";

  }
  xhr.send(params);
}
