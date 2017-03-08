var page;
(function(){
    
    var page = (function () {
        
        var tabsDropdown = function() {
            
            var targetTab = $(this).attr('href');
            
            $(".tabs-wrapper [role='tablist']").find('li').removeClass('active');
            $('.tabs-wrapper [href=' + targetTab + ']').closest('li').addClass('active');
            
            $(this).closest('ul').find('li a').attr('aria-expanded','false');
            $(this).attr('aria-expanded','true');
            
            //show selected tab
            $('.t-dropdown-wrapper').find('.btn').html('<span class="pull-left text-capitalize">' + $(this).html() + '</span>' + '<span class="caret pull-right"></span>');
            $('.t-dropdown-wrapper').find('.btn').val($(this).data('value'));
            
            $(".tab-content [role='tabpanel']").removeClass('active');
            $(targetTab).addClass('active');
            
        };
            
        //export tab
        var exportData = {
            
            addFileValidation: function () {
                var selectFile = $(this).val(),
                    fileExtension = selectFile.split('.').pop().toLowerCase(),
                    allowedExtensions = ['pdf'];
       
                $('#export .alert').remove(); 
        
                if ($.inArray(fileExtension, allowedExtensions) == -1) {
                    var msg = 'Ooops! Please select the correct file type.',
                        msgType = 'error';
                    
                    $('#export .add-file-wrapper').parent().prepend(pop.app.ui.validationMsg(msg,msgType))
                    $(this).replaceWith($(this).val('').clone(true)); 
                    $('#export .added-file').html('').hide()
                }else{
                    $('#export .added-file').html('<div>File: </div>' + selectFile).show();
                }
            },
            
            exportSave: function () {
                var ftp = $('#ftp').val(),
                    portNo = $('#p-nr').val(),
                    userName = $('#username').val();
                
                $('#export .alert').remove(); 
                
                if (ftp.length < 5 || portNo.length < 4 || userName.length < 3) {
                    var msg = 'Ooops! Please select FTP location, Port No and Username.',
                        msgType = 'error';
                    
                    $('#export .row:first .col-md-12:first').prepend(pop.app.ui.validationMsg(msg,msgType))
                }else{
                    
                    $('#export .row').eq(0).prepend(pop.app.ui.actionLoader());

                    $.ajax({
                        url: '/upload',
                        method: 'POST',
                        data: {ftp: ftp, portNo: portNo,
                        userName: userName},
                        success: function(data){
                            var msg = 'Successfully saved.',
                                msgType = 'success';
                            $('#export-save').removeClass('disabled');
                            $('#export-save').removeAttr('disabled');
                            $('#export .loader-wrapper').remove();
                            alert('Successfully uploaded');
                        },
                        failure: function(data){
                            $('#export-save').removeClass('disabled');
                            $('#export-save').removeAttr('disabled');
                            $('#export .loader-wrapper').remove();
                            $('body').append(pop.app.ui.sistemErrorMsg());
                            $('.sistem-error').delay(15000).slideUp();  
                        },
                        error: function(data){ 
                            $('#export-save').removeClass('disabled');
                            $('#export-save').removeAttr('disabled');
                            $('#export .loader-wrapper').remove();
                            $('body').append(pop.app.ui.sistemErrorMsg());
                            $('.sistem-error').delay(15000).slideUp();
                        }
                    });
                    
                }
            }
            
        }
        
        //user management tab
        var userManagement = {
            
            importExcelFileValidation: function(){
                var selectFile = $(this).val(),
                    fileExtension = selectFile.split('.').pop().toLowerCase(),
                    allowedExtensions = ['csv','xlsx','xls'];
       
                $('#user-management .alert').remove(); 
        
                if ($.inArray(fileExtension, allowedExtensions) == -1) {
                    var msg = 'Ooops! Please select the correct file type.',
                        msgType = 'error';
                    $('#user-management .col-md-12:first').prepend(pop.app.ui.validationMsg(msg,msgType))
                    $(this).replaceWith($(this).val('').clone(true)); 
                    $('#import-added').prop('disabled', true); 
                    $('#user-management .added-file').html('').hide()
                }else{
                    $('#import-added').prop('disabled', false); 
                    $('#import-added').addClass('btn-blue-c')
                    $('#user-management .added-file').html('<div>File: </div>' + selectFile).show();
                }
            },
            
            submitForm: function(event){
                event.preventDefault();

                $('#import-added').attr('disabled', 'disabled');
                $('#import-added').addClass('disabled');
                
                $('#user-management .row').eq(1).prepend(pop.app.ui.actionLoader());

                $.ajax({
                    url: '/xlsx/users',
                    type: 'POST',
                    data: new FormData(this),
                    processData: false,
                    contentType: false,
                    success: function(data){
                        $('#import-added').removeAttr('disabled');
                        $('#import-added').removeClass('disabled');
                        $('#users-list').html(data['users_html']);
                        $('#user-management .loader-wrapper').remove();
                        alert('successfully updated users');
                    },
                    failure: function(data){
                        $('#import-added').removeAttr('disabled');
                        $('#import-added').removeClass('disabled');
                        $('#user-management .loader-wrapper').remove(); 
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                    },
                    error: function(data){
                        $('#import-added').removeAttr('disabled');
                        $('#import-added').removeClass('disabled');
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                        $('#user-management .loader-wrapper').remove();
                    }
                });

                return false;
            },
            
            userList: function() {
                pop.factories.dataTable.initialize('#user-list-table', {
                    responsive: {
                    details: {
                    type: 'column',
                    target: 'tr'
                    }
                    },
                    searching: true,
                    ordering:  false,
                    "bInfo" : false,
                    paging: false
                })
            },
            
            userListSearch: function() {
                $('#user-list-table_filter').hide();
                var sListOfUsers = $('#user-list-table').dataTable();
                $('#search-user-list').keyup(function(){
                      sListOfUsers.fnFilter( $(this).val() );
                })
            }
            
        }
        
        //customization tab
        var customization = {
            
            enableInsights: function() {
                var isChecked = $(this).is(':checked');
                $.ajax({
                    url: '/insights-on/' + isChecked,
                    method: 'GET'
                    ,success: function(data){
                    },
                    failure: function(){
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                    },
                    error: function(){
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                    }
                });
            },
            
            uploadLogo: function(image) {
                var selectFile = $(this).val(),
                    fileExtension = selectFile.split('.').pop().toLowerCase(),
                    allowedExtensions = ['jpg','jpeg','png', 'svg'];

                $('#customization .alert').remove(); 

                if ($.inArray(fileExtension, allowedExtensions) == -1) {
                    var msg = 'Ooops! Please select the correct file type.',
                        msgType = 'error';
                    
                    $('#customization .add-logo-wrapper').parent().prepend(pop.app.ui.validationMsg(msg,msgType))
                    $(this).replaceWith($(this).val('').clone(true)); 
                    $('#upload-logo').prop('disabled', true); 
                    $('#customization .added-file').html('').hide()
                }else{
                    $('#upload-logo').prop('disabled', false); 
                    $('#upload-logo').addClass('btn-blue-c')
                    $('#customization .added-file').html('<div class="img-info-wrapper"><div>File: </div><div>' + selectFile + '</div></div>').show();
                    $('#customization .added-file').prepend('<img id="logo-thumb" src="' + URL.createObjectURL(image.target.files[0]) + '">');
                }
            }
            
        }
        
        //survey management tab
        var surveyManagement = {
            
            init: function() {
                pop.factories.dataTable.initialize('#assessments-table', {
                        responsive: {
                        details: {
                        type: 'column',
                        target: 'tr'
                        }
                        },
                        searching: false,
                        ordering:  false,
                        "bInfo" : false,
                        paging: false
                })
            },
            
            select2: function() {
                $('#template-dropdown, #selectDimensions, #assignManager, #tagQuestions ').select2({
                    dropdownParent: $("#tableAction"),
                    placeholder: "Select"
                })
            },
            
            select2TagsEnableScroll: function() {
                
                $(".select2-results").toggleClass("mCustomScrollbar").attr('data-mcs-theme', 'gray-theme');
                $(".select2-results").mCustomScrollbar("destroy");
                $(".select2-results").mCustomScrollbar({
                  advanced: {
                    updateOnContentResize: true
                  }, 
                  live: true,
                  mouseWheel:true,    
                  scrollInertia: 500
                });
                
            },
            
            selectSurvey: function() {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    $('#editB, #deleteB, #deployB, #shareB').removeClass('btn-blue-c');
                }else {
                    var surveyId = $(this).attr('surveyId');
                    $('#assessments-table tbody tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                    $('#editB, #deleteB, #deployB, #shareB').addClass('btn-blue-c');
                    $('#deployB').attr('data-target', '#deploySurvey'+surveyId);
                    $('#shareB').attr('link', surveyId);
                    $('#editB').attr('link', surveyId);
              }
            },
            
            surveyTemplateChange: function() {
                var templateId = $('#template-dropdown').val();
                
                $('#tagQuestions').removeAttr("disabled", "disabled");

                $.ajax({
                    url: '/templates/'+templateId+'/questions',
                    method: 'GET',
                    success: function(data){
                        var template = data.template[0],
                            questionBank,
                            questions = [],
                            dimensions,
                            allManager = data.users,
                            qDimensions = [],
                            qData = [],
                            qAllManager = [];

                    if(template !== undefined) {
                        $('#tagQuestions').attr("disabled", "disabled")
                        $('#assignManager, #selectDimensions').removeAttr('disabled');

                        questionBank = template['question_bank'];
                        dimensions = template['selected_dimensions'];

                        strSkill = '';
                        for(var z=0; z<template['assessments'].length; z++) {
                            if(template['assessments'][z].skill) {
                                strSkill = template['assessments'][z].tag;
                            }
                        }

                        for(var j=0;j<dimensions.length; j++){
                            if(dimensions[j] != strSkill){
                            qDimensions.push({id: dimensions[j], text: dimensions[j].toLowerCase()});
                            }
                        }

                        var dimensions_options = _.map(dimensions, function(dimension){
                            if(dimension != strSkill){
                            return '<option selected="selected" value="'+ dimension +'">'+ dimension.toLowerCase() +'</option>'
                            }
                        });

                        $('#selectDimensions').html('');
                        $('#selectDimensions').html(dimensions_options.join(''));

                        $('#selectDimensions').select2({
                            data: qDimensions,
                            tags: true,
                            tokenSeparators: [','],
                            placeholder: "Select Dimensions"
                        });

                        for(var j=0;j<allManager.length; j++){
                            qAllManager.push({id: allManager[j]._id, text: allManager[j].full_legal_name});
                        }

                        $('#assignManager').html('');

                        $('#assignManager').select2({
                            data: qAllManager,
                            dropdownParent: $("#tableAction"),
                            placeholder: "Select Manager"
                        });


                        if (questionBank !== undefined) {
                            questions = questionBank['questions'];
                            for(var i=0; i<questions.length; i++){
                                qData.push({id: questions[i]._id, text: questions[i].title});
                            }

                            var questions_options = _.map(questions, function(question){
                                return '<option selected="selected" value="'+ question._id+'">'+ question.title+'</option>';
                            });

                            $('#tagQuestions').html('');

                            $('#tagQuestions').select2({
                                data: qData,
                                tags: true,
                                placeholder: "Search and Add Questions"
                            });
                        }
                    }
                  },
                    error: function (error) {
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                        console.log(error);
                    }
                })
                
            },
            
            addSurvey: {
                
                prepareModal: function() {
                    
                    $('#tableAction .modal-body .alert').remove();
                    $('#template-dropdown').removeAttr('disabled');
                    $('#select2-template-dropdown-container').html('<span class="select2-selection__placeholder">Select Template</span>');
                    $('#select2-assignManager-container').html('<span class="select2-selection__placeholder">Select Manager</span>');
                    $('#select2-template-dropdown-container, #select2-assignManager-container').removeAttr('title')
                    $('#assignManager, #selectDimensions, #tagQuestions').html('');
                    $('#selectDimensions').next('.select2').find('.select2-selection__rendered li:not(:last)').remove();
                    $('#selectDimensions').next('.select2').find('.select2-selection__rendered input').attr('placeholder','Select Dimensions')
                    $('#assignManager, #selectDimensions, #tagQuestions').attr("disabled", "disabled")
                    $('#tableAction .modal-header h4').html('<img src="/img/add-icon-b.svg" width="35" height="35" alt="">Add a new survey');
                    $('#survey-name').val('');
                    $('#survey-date').val('');

                    $('#tableAction .modal-footer').html('<button id="save-n-g" class="btn btn-gray" type="submit" data-hover="tooltip" data-placement="top" title="Save Template"><img src="/img/tick-s-b.svg" width="20" height="20" alt="add"></button>')
                },
                
                surveyData: function(survey) {
                    if(survey.state == 'started') {
                        status_class1 = 'status-c-ip-o';
                        status_class2 = 'status-c-ip-i';
                        status_title = 'In Progress';
                    } else if (survey.state == 'completed') {
                        status_class1 = 'status-c-f-o';
                        status_class2 = 'status-c-f-i';
                        status_title = 'Finished';
                    } else {
                        status_class1 = '';
                        status_class2 = '';
                        status_title = '';
                    }

                    var surveyName = survey['name'];
                    var status = "<div data-original-title='" + status_title + "' data-toggle='tooltip' data-placement='top' title='" + status_title + "' class='status-c-outer center-block " + status_class1 + "'><div class='status-c-inner " + status_class2 + "'></div></div>"; 
                    var createdBy = survey['createdUser'].full_legal_name;
                    var surveyDate = moment(survey['expiry_date']).format('MMM DD, YYYY h:mm');
                    var details = "<button data-original-title='View Survey Progress' type='submit' data-hover='tooltip' data-placement='top' title='' data-toggle='modal' data-target='#view-assessments' class='view-s-p btn btn-gray'><img src='/img/view-icon-white.svg' alt='view' height='20' width='20'></button><button type='submit' data-hover='tooltip' data-placement='top' title='' data-toggle='modal' data-target='#template-preview' class='survey-preview btn btn-gray' data-original-title='Survey Preview'><img src='/img/view-icon-white.svg' alt='view' width='20' height='20'></button>"

                    return {
                      surveyName: surveyName,  status: status,  createdBy: createdBy, surveyDate: surveyDate, details: details
                    }
                },
                
                saveSurvey: function() {
                    var questions = [],
                        dimensions = [],
                        surveyDate= $('#survey-date').val(),
                        surveyName = $('#survey-name').val(),
                        template = $('#template-dropdown :selected').val(),
                        assignManager = [],
                        bLeaderSurvey = $('#template-dropdown :selected').text() == 'Leader Survey Template' || $('#template-dropdown :selected').text() == 'Manager Survey Template' ? true : true;

                    $('#tagQuestions :selected').each(function(i, selected){
                        questions[i] = $(selected).val();
                    });

                    $('#selectDimensions :selected').each(function(i, selected){
                        dimensions[i] = $(selected).val();
                    });

                    $('#assignManager :selected').each(function(i, selected){
                        assignManager[i] = $(selected).val();
                    });

                    if (!bLeaderSurvey && (surveyName.length < 3 || surveyDate.length < 3 || dimensions.length < 1 || questions.length < 1)) {
                        var msg = 'Ooops! Template, survey name, survey expiry date, dimensions and skills fields are mandatory, please make sure you selected them.',
                            msgType = 'error';
                        $('#tableAction .modal-body').prepend(pop.app.ui.validationMsg(msg,msgType));
                    } else if (bLeaderSurvey && (surveyName.length < 3 || surveyDate.length < 3 || dimensions.length < 1)) {
                        var msg = 'Ooops! Template, survey name, survey expiry date and dimensions fields are mandatory, please make sure you selected them.',
                            msgType = 'error';
                        $('#tableAction .modal-body').prepend(pop.app.ui.validationMsg(msg,msgType));
                    } else {   
          
                        $('#tableAction').modal('hide');

                        $.ajax({
                            url: '/surveys',
                            method: 'POST',
                            data: {templateId: template, surveyName: surveyName, assignManager: assignManager.join(','), 
                            surveyDate: surveyDate, dimensions: dimensions.join(','), questions: questions.join(',')},
                            success: function(data){
                                console.log('success:', data);
                                surveyManagement.addSurvey.drawSurveyInTable(data)
                            },
                            error: function(err){
                                console.log('error:', err);
                                $('body').append(pop.app.ui.sistemErrorMsg());
                                $('.sistem-error').delay(15000).slideUp();
                            }
                        });
                    }
                },
                
                drawSurveyInTable: function(data) {
                    var payLoad = surveyManagement.addSurvey.surveyData(data['survey']), 
                        assessmentsTable = $('#assessments-table').DataTable(),
                        survey = data['survey'],
                        surveyId = survey['_id'],
                        dataPayload = [payLoad['surveyName'], payLoad['status'], payLoad['createdBy'], payLoad['surveyDate'], payLoad['details']];
                    
                    assessmentsTable.row.add(dataPayload).draw();
                    $('#assessments-table tbody tr:last-of-type td:nth-of-type(2), #assessments-table tbody tr:last-of-type td:nth-of-type(3), #assessments-table tbody tr:last-of-type td:nth-of-type(4), #assessments-table tbody tr:last-of-type td:nth-of-type(5)').addClass('text-center');
                    $('#assessments-table tr:last').attr('surveyid', surveyId);
                    $('#deployB').attr('data-target', '#deploySurvey'+surveyId);
                    $('#editB').attr('link', surveyId);
                },
                
            },
            
            editSurvey: {
                
                editSurveyData: function(e) {
                    var selectedSurveyId = $('#editB').attr('link'),
                        recordsCount = $('#assessments-table').DataTable().data().length,
                        statusE = $('#assessments-table tbody tr.selected td:nth-child(2) div:first-child').hasClass('status-c-f-o');
                    

                    $('#assessments .alert, #tableAction .alert').remove();
                    
                    if (statusE == true) {
                        msg = 'Ooops! You can not edit finished survey.<a href="#" class="close" data-fade="alert" aria-label="close">&times;</a>' 
                    }else {
                        msg = 'Ooops! Please select row which you want to edit.<a href="#" class="close" data-fade="alert" aria-label="close">&times;</a>'  
                    }

                    $('#tableAction .modal-header h4').html('<img src="/img/edit-icon-b.svg" width="35" height="35" alt="">Edit Survey');

                    $('#tableAction .modal-footer').html('<button id="save-edit" class="btn btn-gray" type="submit"><img src="/img/tick-s-b.svg" width="20" height="20" alt="add"></button>')

                    if ($('#assessments-table tbody tr').hasClass('selected') && !statusE && recordsCount > 0){
                        $.ajax({
                        url: '/surveys/'+ selectedSurveyId,
                        method: 'GET',
                        success: function(data){
                            var survey = data['survey'],
                                template = survey.templateId;
                            
                            $('#tagQuestions').removeAttr("disabled", "disabled");
                            $('#select2-template-dropdown-container').attr('title', template.title).text(template.title);

                            var surveySelectedAssessments = [];
                            $('#tagQuestions').attr("disabled", "disabled");
                            if(template.survey_type == "manager" ) {
                                surveySelectedAssessments = survey.manager_assessments;
                            }else if(template.survey_type == "leader") {
                                surveySelectedAssessments = survey.team_leader_assessments;
                            }else{ 
                                surveySelectedAssessments = survey.assessments;
                            }

                            var surveyDimensions = _.map(surveySelectedAssessments, 'tag');
                            var assignManager = survey.assignManager;
                            var allManagers = data['allManagers'];

                            var strSkill = '';
                            for(var z=0; z<template['assessments'].length; z++) {
                                if(template['assessments'][z].skill) {
                                    strSkill = template['assessments'][z].tag;
                                }
                            }

                            surveyDimensions =_.filter(surveyDimensions, function(dimension){
                                return dimension != strSkill;
                            });

                            var surveySkillAssessment = _.find(surveySelectedAssessments, function(assessment){
                                return assessment.tag == strSkill;
                            });

                            var surveySkillQuestions = surveySkillAssessment ? surveySkillAssessment.questions : [];

                            $('#template-dropdown option').removeAttr('selected');
                            $('#template-dropdown').find('option[value='+template._id+']').attr('selected', 'selected');

                            var questionBank = template['question_bank'];
                            var dimensions = template['selected_dimensions'];

                            var qDimensions = [];
                            var qData = [];
                            var qAllManager = [];

                            for(var j=0;j<allManagers.length; j++){
                                qAllManager.push({id: allManagers[j]._id, text: allManagers[j].full_legal_name});
                            }

                            var assignManager_options = _.map(allManagers, function(manager){
                                if(_.includes(assignManager, manager._id)){
                                    return '<option selected="selected" value="'+ manager._id +'">'+ manager.full_legal_name +'</option>'
                                }else{
                                    return '<option value="'+ manager._id +'">'+ manager.full_legal_name +'</option>'
                                }
                            });

                            $('#assignManager').html(assignManager_options.join(''));

                            $('#assignManager').select2({
                                data: qAllManager,
                                tags: true,
                                tokenSeparators: [','],
                                placeholder: "Select Manager"
                            });

                            for(var j=0;j<dimensions.length; j++){
                                if(dimensions[j] != strSkill){
                                qDimensions.push({id: dimensions[j], text: dimensions[j].toLowerCase()});
                                }
                            }

                            var dimensions_options = _.map(dimensions, function(dimension){
                                if(dimension != strSkill){
                                    if(_.includes(surveyDimensions, dimension)){
                                        return '<option selected="selected" value="'+ dimension +'">'+ dimension.toLowerCase() +'</option>'
                                    }else{
                                        return '<option value="'+ dimension +'">'+ dimension.toLowerCase() +'</option>'
                                    }
                                }
                            });

                            $('#selectDimensions').html(dimensions_options.join(''));

                            $('#selectDimensions').select2({
                                data: qDimensions,
                                tags: true,
                                tokenSeparators: [','],
                                placeholder: "Select Dimensions"
                            });

                            if (questionBank !== undefined) {
                                var questions = questionBank['questions'];

                                for(var i=0; i<questions.length; i++){
                                qData.push({id: questions[i]._id, text: questions[i].title});
                                }

                                var questions_options = _.map(questions, function(question){
                                    if(_.includes(_.map(surveySkillQuestions, '_id'), question._id)){
                                        return '<option selected="selected" value="'+ question._id+'">'+ question.title+'</option>'
                                    }else{
                                        return '<option value="'+ question._id +'">'+ question.title +'</option>'
                                    }
                                });

                                qData = [];
                                questions_options = [];

                                $('#tagQuestions').html(questions_options.join(''));

                                $('#tagQuestions').select2({
                                    data: qData,
                                    tags: true,
                                    placeholder: "Search and Add Questions"
                                    });
                            }

                            $('#survey-name').val(survey['name']);
                            $('#survey-date').val(moment(survey['expiry_date']).format('MMM DD, YYYY h:mm'));
                            $('#template-dropdown').attr('disabled', 'disabled');
                        }
                       });    

                    } else {
                        e.stopPropagation();
                        var msgType = 'error';
                        $("#assessments .table-wrapper").prepend(pop.app.ui.validationMsg(msg,msgType))
                    }
                },
                
                saveSurveyEdit: function() {
                    var selectedSurveyId = $('#editB').attr('link'),
                        questions = [],
                        dimensions = [],
                        assignManager = [],
                        surveyDate= $('#survey-date').val(),
                        surveyName = $('#survey-name').val(),
                        template = $('#template-dropdown :selected').val(),
                        bLeaderSurvey = $('#template-dropdown :selected').text() == 'Leader Survey Template' || $('#template-dropdown :selected').text() == 'Manager Survey Template' ? true : true;
                    
                    $('#tableAction .alert').remove();

                    $('#tagQuestions :selected').each(function(i, selected){
                        questions[i] = $(selected).val();
                    });

                    $('#selectDimensions :selected').each(function(i, selected){
                        dimensions[i] = $(selected).val();
                    });

                    $('#assignManager :selected').each(function(i, selected){
                        assignManager[i] = $(selected).val();
                    });

                    if (!bLeaderSurvey && (surveyName.length < 3 || surveyDate.length < 3 || dimensions.length < 1 || questions.length < 1)) {
                        var msg = 'Ooops! Template, survey name, survey expiry date, dimensions and skills fields are mandatory, please make sure you selected them.',
                            msgType = 'error';
                        $('#tableAction .modal-body').prepend(pop.app.ui.validationMsg(msg,msgType));  
                    } else if (bLeaderSurvey && (surveyName.length < 3 || surveyDate.length < 3 || dimensions.length < 1)) {
                        var msg = 'Ooops! Template, survey name, survey expiry date and dimensions fields are mandatory, please make sure you selected them.',
                            msgType = 'error';
                        $('#tableAction .modal-body').prepend(pop.app.ui.validationMsg(msg,msgType));   
                    } else {  
                          
                        $('#tableAction').modal('hide');

                        $.ajax({
                            url: '/surveys/'+selectedSurveyId,
                            method: 'PUT',
                            data: {templateId: template, surveyName: surveyName,
                            surveyDate: surveyDate, dimensions: dimensions.join(','), assignManager: assignManager.join(','), questions: questions.join(',')},
                            success: function(data){

                              console.log('success:', data);

                              var payLoad = surveyManagement.addSurvey.surveyData(data['survey']),
                                  survey = data['survey'],
                                  gDate = new Date(survey['expiry_date']),
                                  editedRow = [payLoad['surveyName'], payLoad['status'], payLoad['createdBy'], payLoad['surveyDate'],payLoad['details']],
                                  tc = $('#assessments-table tbody tr.selected td');

                              $(tc).each(function (j) {
                                if (j<4){
                                    $(this).html(editedRow[j]);
                                }
                              });
                            },
                            error: function(err){
                              console.log('error:', err);
                              $('body').append(pop.app.ui.sistemErrorMsg());
                              $('.sistem-error').delay(15000).slideUp();    
                            }
                        });
                    }
                }
            },
            
            deleteSurvey: {
                
                confirmDelete: function(e) {
                    var recordsCount = $('#assessments-table').DataTable().data().length;

                    $('#assessments .alert').remove(); 

                    if (!$('#assessments-table tbody tr').hasClass('selected') || recordsCount == 0 ) {     
                        e.stopPropagation();
                        var msg = 'Ooops! Please select row which you want to delete.'
                            msgType = 'error'
                        $('#assessments .table-wrapper').prepend(pop.app.ui.validationMsg(msg,msgType))     
                    }else{
                        var msg = 'Are you sure you want to delete this survey?',
                            title = 'Delete Survey'
                        pop.app.ui.confirmAction(msg,title)
                    }
                },
                
                delete: function(){
                    var selectedRow = $('#assessments-table').DataTable().row('.selected'),
                        surveyId = $('#assessments-table').find('.selected').attr('surveyId');
                    
                    selectedRow.remove().draw( false );
                    
                    $.ajax({
                        url: '/survey/archive/'+surveyId,
                        method: 'DELETE',
                        success: function(data){
                          return true;
                        }, failure: function(data){
                          throw 'unable to delete survey' + surveyId
                        }, error: function(data){
                          throw 'unable to delete survey' + surveyId
                        }
                    });
                }
            },
            
            shareSurvey: function(e) {
                var selectedSurveyId = $('#shareB').attr('link'),
                    recordsCount = $('#assessments-table').DataTable().data().length,
                    statusE = $('#assessments-table tbody tr.selected td:nth-child(2) div:first-child').hasClass('status-c-f-o'),
                    msg,
                    msgType = 'error';

                $('#assessments .alert').remove();

                if (statusE == true) {
                    msg = 'Ooops! You can not share finished survey.' 
                }else {
                    msg = 'Ooops! Please select survey which you want to share.'  
                }

                if ($('#assessments-table tbody tr').hasClass('selected') && !statusE && recordsCount > 0){
                    $.ajax({
                    url: '/survey/share/'+ selectedSurveyId,
                    method: 'POST',
                    success: function(data){
                        msg = 'Thank you for sharing survey with manager.'
                        msgType = 'success'
                        $('#assessments .table-wrapper').prepend(pop.app.ui.validationMsg(msg,msgType))
                     }
                   });
                } else {
                    e.stopPropagation();
                    $("#assessments .table-wrapper").prepend(pop.app.ui.validationMsg(msg,msgType))
                }
            },
            
            previewSurvey: {
                
                surveyInfo: function() {
                    var surveyId = $(this).closest('tr').attr('surveyid');
        
                    $.ajax({
                        url: '/surveys/'+ surveyId,
                        method: 'GET',
                        success: function(data){
                            var survey = data['survey'],
                                templateId = survey.templateId,
                                step = 0,
                                questions = [];

                            if(templateId.survey_type == "manager" ) {
                                surveySelectedAssessments = survey.manager_assessments;
                            }else if(templateId.survey_type == "leader") {
                                surveySelectedAssessments = survey.team_leader_assessments;
                            }else{ 
                                surveySelectedAssessments = survey.assessments;
                            }

                            var surveyDimensions = _.map(surveySelectedAssessments, 'tag');

                            var strSkill = '';
                            for(var z=0; z<templateId['assessments'].length; z++) {
                                if(templateId['assessments'][z].skill) {
                                    strSkill = templateId['assessments'][z].tag;
                                }
                            }

                            surveyDimensions =_.filter(surveyDimensions, function(dimension){
                                return dimension != strSkill;
                            });

                            surveyManagement.previewSurvey.getSurveyHtml(templateId._id, surveyDimensions.toString(), step, questions);

                        }
                    })
                },
                
                getSurveyHtml: function(templateId, strDimensions, step, questions) {
                    $.ajax({
                        url: '/survey/preview',
                        method: 'POST',
                        data: {templateId: templateId, dimensions: strDimensions,
                        step: step, questions: questions},
                        success: function(data){
                            $('#template-preview .modal-body').html(data.strHTML);
                        },
                        failure: function(data){
                            $('body').append(pop.app.ui.sistemErrorMsg());
                            $('.sistem-error').delay(15000).slideUp();
                        },
                        error: function(data){
                            $('body').append(pop.app.ui.sistemErrorMsg());
                            $('.sistem-error').delay(15000).slideUp();
                        }
                    });
                },
                
                nextSection: function() {
                    var templateId = $('#previewTemplateId').val(),
                        strDimensions = $('#previewDimensions').val(),
                        step = $('#previewStep').val(),
                        questions = [];
                    surveyManagement.previewSurvey.getSurveyHtml(templateId, strDimensions, step, questions);
                },
                
                prevSection: function() {
                    var templateId = $('#previewTemplateId').val(),
                        strDimensions = $('#previewDimensions').val(),
                        step = $('#previewPrevStep').val(),
                        questions = [];
                    surveyManagement.previewSurvey.getSurveyHtml(templateId, strDimensions, step, questions);
                }
                
            },
            
            deploySurvey: {
                
                deployData: function(e) {
                    var sRowData = $('#assessments-table').DataTable().row('.selected').data(),
                    row = $('#assessments-table tbody tr'),
                    recordsCount = $('#assessments-table').DataTable().data().length;
                    
                    $('#assessments .alert').remove();
                    
                    if (row.hasClass('selected') && recordsCount > 0) {
                        var selectedSurveyId = row.closest('tr.selected').attr("surveyId");

                        $.ajax({
                        url: '/surveys/' + selectedSurveyId,
                        method: 'GET',
                        success: function (data) {
                            var survey = data.survey;
                            var users1 = data.users;
                            var users = [];

                            if(survey.templateId.survey_type == "manager") {
                                users = _.filter( users1, function( user ){
                                    return user.userType == 'Manager' || user.userType == 'HR Manager';
                                });
                            } else if(survey.templateId.survey_type == "leader") {
                                users = _.filter( users1, function( user ){
                                    return user.userType == 'Leader';
                                });
                            } else {
                                users = _.filter( users1, function( user ){
                                    return user.userType == 'Employee';
                                });
                            }; 

                            $('.survey-t').text(survey.name);
                            $('#select-employees').DataTable().clear().draw();
                            $('#surveyId_deploy_modal').val(survey._id);
                            $.each( users, function( index, user ){
                                var row1 = '<div class="avatar-wrapper-m avatar-border"><img src="/img/avatar-f-small.svg", alt="avatar"></div><div><strong>' + user.full_legal_name + '</strong></div>';
                                var row2 = '<div class="switch"><input name="s-' + survey._id + '-' + user._id + '" type="checkbox" id="s-toggle-' + survey._id + '-' + user._id + '" userid="' + user._id + '" class="user-select s-toggle s-toggle-round"><label for="s-toggle-' + survey._id + '-' + user._id + '"></label></div>';
                                if( _.includes(_.map(survey.assignees, 'full_legal_name'), user.full_legal_name)) {
                                    row2 = '<div class="switch"><input name="s-' + survey._id + '-' + user._id + '" type="checkbox" checked="checked" id="s-toggle-' + survey._id + '-' + user._id + '" userid="' + user._id + '" class="user-select s-toggle s-toggle-round"><label for="s-toggle-' + survey._id + '-' + user._id + '"></label></div>';
                                } 

                                $('#select-employees').DataTable().row.add([row1, row2]).draw(false);
                          });

                          $('.deploy-survey').modal('show');

                          //deploy survey - move selected users to the top
                          var selectedEmployee = $('#select-employees tr .s-toggle:checked');
                          if (selectedEmployee.length > 0){
                              selectedEmployee.closest('tr').prependTo("#select-employees tbody");  
                          }


                        }
                      });
                    }else {
                        e.stopPropagation();
                        var msg = 'Ooops! Please select survey which you want to deploy.'
                            msgType = 'error'
                        $('#assessments .table-wrapper').prepend(pop.app.ui.validationMsg(msg,msgType))   
                    }
                },
                
                deployTo: function(event) {
                    var surveyUsers = [],
                        deploySurvey = $(event.currentTarget).parents('.deploy-survey'),
                        surveyId = $('#surveyId_deploy_modal').val(),
                        users = $(deploySurvey).find('.user-select');

                    for(var index=0; index < users.length; index++){
                        var user = $(users[index]);
                        if(user.is(':checked')){
                            surveyUsers.push(user.attr('userId'))
                        }
                    };

                    $.ajax({
                        url: '/surveyDeploy',
                        method: 'POST',
                        data: {assignedUsers: surveyUsers.join(','), surveyId: surveyId},
                        success: function(data){
                            status_class1 = 'status-c-ip-o';
                            status_class2 = 'status-c-ip-i';
                            status_title = 'In Progress';
                            $($('#assessments-table tbody tr.selected td')[1]).html("<div data-original-title='" + status_title + "' data-toggle='tooltip' data-placement='top' title='" + status_title + "' class='status-c-outer center-block " + status_class1 + "'><div class='status-c-inner " + status_class2 + "'></div></div>");
                            deploySurvey.modal('hide');
                        },
                        error: function(data){
                            console.log(data);
                            $('body').append(pop.app.ui.sistemErrorMsg());
                            $('.sistem-error').delay(15000).slideUp();
                        },
                        failure: function(data){
                            console.log(data);
                            $('body').append(pop.app.ui.sistemErrorMsg());
                            $('.sistem-error').delay(15000).slideUp();
                        }
                    });  
                },
                
                init: function(){
                    pop.factories.dataTable.initialize('#select-employees', {
                        responsive: {
                        details: {
                            type: 'column'
                            }
                        },
                        searching: true,
                        ordering:  false,
                        "bInfo" : false,
                        paging: false
                    })
                },
                
                enableSearch: function() {
                    $("#select-employees_filter").hide();
                    sEmployees = $('#select-employees').dataTable();
                    $('#search-employees').keyup(function(){
                          sEmployees.fnFilter( $(this).val() );
                    })
                },
                
                selectAll: function() {
                    $(".deploy-survey .switch input:checkbox").prop('checked', $(this).prop("checked"));
                },
                
                selectAllState:function(){
                    if($("#select-employees .s-toggle:checked").length == $("#select-employees .s-toggle").length ){
                        $("#s-toggle-all").attr('checked','checked');  
                    }else{
                        $("#s-toggle-all").removeAttr('checked');           
                    }  
                }
                
            },
            
            viewSurveyProgress: {
                
                init: function() {
                    pop.factories.dataTable.initialize('#view-assessments-table', {
                        responsive: {
                          details: {
                            type: 'column'
                          }
                        },
                        searching: true,
                        ordering: false,
                        "bInfo": false,
                        paging: false
                    })
                },
                
                enableSearch: function() {
                    $('#view-assessments-table_filter').hide();
                    var vAssessmentByUser = $('#view-assessments-table').dataTable();
                        $('#search-box').keyup(function () {
                            vAssessmentByUser.fnFilter($(this).val());
                        })
                },
                
                loadData: function() {
                    var surveyId = $(this).closest('tr').attr('surveyid'),
                        viewAssessmentsTable = $('#view-assessments-table').DataTable();
                    
                    $('table#view-assessments-table tbody').html('<tr><td colspan="0" class="dataTables_empty text-center" valign="top">No data available in table</td></tr>')
                    viewAssessmentsTable.clear()
                      
                    $.ajax({
                        url: '/surveys/'+surveyId+'/user-stats',
                        method: 'GET',
                        success: function (data) {
                            var surveyProgressData = data.surveyProgress,
                                progressColor = [];

                            for( i=0; i < surveyProgressData.length; i++ ){ 

                              switch(surveyProgressData[i]){

                                  case 'Finished':
                                     progressColor=['status-c-f-o','status-c-f-i']
                                     break;

                                  case 'In Progress':
                                     progressColor=['status-c-ip-o','status-c-ip-i']
                                     break;

                                  case 'Not Started':
                                     progressColor=['','']
                                     break;

                                  default:
                                     progressColor=['',''] 

                              }    
                              var col1Data = '<div class="avatar-wrapper-m avatar-border"><img src="/img/avatar-f-small.svg" alt="avatar"/></div><div><strong>' + surveyProgressData[i].name + '</strong></div>',
                                  col2Data = '<td class="text-center"><div data-toggle="tooltip" data-placement="top" title="' + surveyProgressData[i].state + '" class="status-c-outer ' + progressColor[0] + '"><div class="status-c-inner ' + progressColor[1] + '"></div></div></td>';    
                              viewAssessmentsTable.row.add([col1Data, col2Data]).draw();              
                            }   

                            $('table#view-assessments-table tbody tr td:last-of-type').addClass('text-center')
                        }
                    });
                }
                
            }
            
        };
        
        var goals = {
        
            init: function() {
                pop.factories.dataTable.initialize('#goals-list', {
                    responsive: {
                    details: {
                    type: 'column',
                    target: 'tr'
                    }
                    },
                    searching: true,
                    ordering:  false,
                    "bInfo" : false,
                    paging: false
                })
            },
            
            enableSearch: function() {
                $('#goals-list_filter').hide();
                var sListOfUsers = $('#goals-list').dataTable();
                $('#search-goals').keyup(function(){
                      sListOfUsers.fnFilter( $(this).val() );
                })
            }
            
        };
        
        
        function page () {
            
        };
        
        page.prototype.initialize = function () {
            
            //export tab
            pop.app.attachSingle('change', '#add-pdf', exportData.addFileValidation);
            pop.app.attachSingle('click', '#export-save', exportData.exportSave);
            
            //user management tab
            pop.app.attachSingle('change', '#import-file', userManagement.importExcelFileValidation);
            pop.app.attachSingle('submit', 'form#user-management', userManagement.submitForm);
            userManagement.userList();
            userManagement.userListSearch();
            
            //customization tab
            pop.app.attachSingle('change', '#customization #s-toggle-1', customization.enableInsights);
            pop.app.attachSingle('change', '#add-logo', customization.uploadLogo);
            
            //survey management tab
            surveyManagement.init();
            surveyManagement.select2();
            pop.app.attachSingle('click', '#shareB', surveyManagement.shareSurvey)
            surveyManagement.deploySurvey.init();
            surveyManagement.deploySurvey.enableSearch();
            pop.app.attachSingle('click', '#deployB', surveyManagement.deploySurvey.deployData);
            pop.app.attachSingle('click', '.deploySurvey', surveyManagement.deploySurvey.deployTo);
            pop.app.attachSingle('change', '#s-toggle-all', surveyManagement.deploySurvey.selectAll);
            pop.app.attachSingle('show.bs.modal', '#deploySurvey', surveyManagement.deploySurvey.selectAllState);
            surveyManagement.viewSurveyProgress.init();
            surveyManagement.viewSurveyProgress.enableSearch();
            pop.app.attach('click', '#assessments-table td button.view-s-p.btn.btn-gray', surveyManagement.viewSurveyProgress.loadData);
            pop.app.attachSingle('click', '#deleteB', surveyManagement.deleteSurvey.confirmDelete);
            pop.app.attach('click', '#deleteItem', surveyManagement.deleteSurvey.delete);
            pop.app.attach('click', '#assessments-table tr', surveyManagement.selectSurvey);
            
            pop.app.attachSingle('click', '#addB', surveyManagement.addSurvey.prepareModal);
            pop.app.attach('click', '#tableAction .modal-footer #save-n-g', surveyManagement.addSurvey.saveSurvey);
            pop.app.attachSingle('change', '#template-dropdown', surveyManagement.surveyTemplateChange);
            pop.app.attach('click', 'span.select2-selection', surveyManagement.select2TagsEnableScroll);
            
            pop.app.attachSingle('click', '#editB', surveyManagement.editSurvey.editSurveyData);
            pop.app.attach('click', '#tableAction .modal-footer #save-edit', surveyManagement.editSurvey.saveSurveyEdit);
            
            pop.app.attach('click', '.survey-preview', surveyManagement.previewSurvey.surveyInfo);
            pop.app.attach('click', '#nextPreviewNavigation', surveyManagement.previewSurvey.nextSection);
            pop.app.attach('click', '#prevPreviewNavigation', surveyManagement.previewSurvey.prevSection);
            pop.app.attachSingle('click', '#editSurveyTemplate', function(){
                
                $('#template-preview').modal('hide');
                surveyManagement.editSurvey.editSurveyData();
                
            });
            
            pop.app.attachSingle('click', ".tabs-wrapper [data-toggle='tab']", tabsDropdown);
            
            //goals
            goals.init()
            goals.enableSearch()
        
            //datetime picker
            $('#date-wrapper, #survey-date').datetimepicker({
                minDate: moment().startOf('d'),
                format: 'MMM DD, YYYY h:mm'
            }).on("dp.change", function(e) {
                $('.bootstrap-datetimepicker-widget').hide()
                $('#survey-date').blur();
            });

            //scroll-modal
            $(".initiate-scroll, .initiate-scroll-user-list").mCustomScrollbar({
                scrollInertia: 500,
                live: "on"
            });
            
        }
        
        return new page;
        
    })();
   
    pop.page = page;
    
})(window.pop = pop || {})

pop.page.initialize();


