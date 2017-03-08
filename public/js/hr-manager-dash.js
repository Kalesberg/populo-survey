/*tooltip move and retype later*/
$(function () {
  $('[data-toggle="tooltip"], [data-hover="tooltip"]').tooltip({
    container: 'body'
  });
});

$(document).ready(function () {
  /*SCROLL*/
  $(".initiate-scroll").mCustomScrollbar({
    scrollInertia: 500
  });

  $(".c-select").select2();
	$("#select-manager.c-select").select2( {placeholder: 'Select Manager'});
	$("#select-individual.c-select").select2( {placeholder: 'Select Individual'});
 	$("#select-topic.c-select").select2( {placeholder: 'Select Topic'});

  $("span.select2.select2-container").on("click", function () {
    $(".select2-results").toggleClass("mCustomScrollbar").attr('data-mcs-theme', 'gray-theme');
    $(".select2-results").mCustomScrollbar("destroy");
    $(".select2-results").mCustomScrollbar({
      advanced: {
        updateOnContentResize: true
      },  
      scrollInertia: 500
    });
  });

  $('#view-assessments-table').DataTable({
    responsive: {
      details: {
        type: 'column'
      }
    },
    searching: true,
    ordering: false,
    "bInfo": false,
    paging: false
  });

  //enable table search
  $("#view-assessments-table_filter").hide();
  vAssessmentByUser = $('#view-assessments-table').dataTable();
  $('#search-box').keyup(function () {
    vAssessmentByUser.fnFilter($(this).val());
  })
});
