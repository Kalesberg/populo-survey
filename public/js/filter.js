$("#search-box").on("focus", function () {
  $(".form-control-feedback").hide();
});

$("#search-box").on("blur", function () {
  $(".form-control-feedback").show()
});
