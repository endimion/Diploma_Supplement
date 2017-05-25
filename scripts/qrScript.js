

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
