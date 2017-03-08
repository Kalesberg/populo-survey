$('#select-manager').change(function () {
  var selectedManagerId = $('#select-manager option:selected').val();
  var managersEmployees = $('#select-manager').data('options');
  var selectedEmployees = [];
  var data = [];

  managersEmployees.forEach(function (managerEmployees) {
    if (selectedManagerId == managerEmployees['_id']) {
      selectedEmployees = managerEmployees['employees'].sort();
    }
  });

  selectedEmployees.forEach(function (employee) {
    data.push({id: employee, text: employee});
  });

  $("#select-individual").html('');

  $("#select-individual").select2({
    data: data
  });

  $("#select-individual").on("select2:open", function (e) {
    $(".select2-results").addClass("mCustomScrollbar").attr('data-mcs-theme', 'gray-theme');
    $(".select2-results").mCustomScrollbar("destroy");
    $(".select2-results").mCustomScrollbar({
      advanced:{
        updateOnContentResize: true
      },
      scrollInertia:500
    });
  });
});

$('#get-insights').click(function () {
  var manager = $('#select-manager').val();
  var individual = $('#select-individual').val();
  var assessmentType = $('#select-topic').val().toLowerCase().replace(/(?:^|\s)\w/g, function(match) {
                                                            return match.toUpperCase();
                                                        });
  if (individual != null) {
    $.ajax({
      url: '/getInsights',
      data: {manager: manager, individual: individual, assessmentType: assessmentType},
      method: 'POST'
    }).done(function (data) {

          $('#culcture-panel, #team-effectiveness-panel, #manager-effectiveness-panel, #behaviors-panel, #skills-panel').addClass('hide');

          if(data.status == 'failure' || !data.submissionQA || _.isEmpty(data.submissionQA.answers)){
            $('#empty-message-graphs').removeClass('hide');
          }else{
            $('#empty-message-graphs').addClass('hide');

            switch (assessmentType) {
              case 'SKILLS':
                skillChart(data.submissionQA, data.multiRaters, data.employeeTeamRating, data.employeeManagerRating, '.skills__chart-wrapper');
                $('#skills-panel').removeClass('hide');
                $('#skills-panel').show();
                break;
              case 'culcture':
                culctureChart(data.submissionQA, '#culcture', '#culcture-support');
                $('#culcture-panel').removeClass('hide');
                $('#culcture-panel').show();
                break;
              case 'TEAM EFFECTIVENESS':
                teamEffectivenessChart(data.submissionQA, data.employeeTeamEffectiveness, '.team-effectiveness__chart-wrapper');
                $('#team-effectiveness-panel').removeClass('hide');
                $('#team-effectiveness-panel').show();
                break;
              case 'MANAGER EFFECTIVENESS':
                if(data.user.userType == 'HR Manager' && data.user.full_legal_name != manager) {
                  $('.self-panel').addClass('hide');
                  $('.self-panel').hide();  
                  managerEffectivenessChart(data.submissionQA, '#manager-effectiveness', '#manager-effectiveness-support');
                  $('.manager-panel').removeClass('hide');
                  $('.manager-panel').show();  
                }
                else if(data.user.userType == 'HR Manager' && data.user.full_legal_name == manager) {
                  $('.manager-panel').addClass('hide');
                  $('.manager-panel').hide();  
                  managerSelfEffectivenessChart(data.submissionQA, data.employeeManagerEffectiveness, '.manager-effectiveness__chart-wrapper');
                  $('.self-panel').removeClass('hide');
                  $('.self-panel').show();  
                }
                else
                  managerSelfEffectivenessChart(data.submissionQA, data.employeeManagerEffectiveness, '.manager-effectiveness__chart-wrapper');
                $('#manager-effectiveness-panel').removeClass('hide');
                $('#manager-effectiveness-panel').show();
                break;
              case 'BEHAVIORS':
                var expandView = false;
                behaviourChart(data.submissionQA, data.multiRaters, data.employeeTeamRating, data.employeeManagerRating, '.behaviours__chart-wrapper', expandView);
                $('#behaviors-panel').removeClass('hide');
                $('#behaviors-panel').show();
                break;
              default:
                console.log('out of option');
            }
          }
          $('#print-reports').attr('onclick', "printPDF('/files/pdf/" + data.user.full_legal_name + " Growth Report.pdf')");
          $('#pdf-export-button').attr('href', "/files/pdf/" + data.user.full_legal_name + " Growth Report.pdf");
        }
    ).
        fail(function (data) {
          console.log(data);
        })
  }
});
