function jsonParse(json){
  return JSON.parse(json.replace(/&quot;/g, '"'));
}

function isEmptyArray(array){
  var found = false;

  array.forEach(function(element){
    if(element == '' || element == null){
      found = true;
    }
  });

  return found;
}
