var page;
(function (){
    
    var page = (function(){
        
        var goalData = function() {
                
                var goal_type = $('#select-goal-type').val(),
                    goal_contribution = $('#select-contribute-goal').val(),
                    goal = $('#goal').val(),
                    goal_date = $('#goal-date').val(),
                    goal_assignee = $('#select-assignee').val(),
                    goal_status = $('#select-status').val(),
                    goal_comments = $('#goal-comments').val(),
                    goal_isStratch = $('#s-1').is(':checked');
                    
                return {
                    goal_type: goal_type, 
                    goal_contribution: goal_contribution, 
                    goal: goal, 
                    goal_date:goal_date, 
                    goal_assignee:goal_assignee,
                    goal_status:goal_status,
                    goal_comments:goal_comments,
                    goal_isStratch:goal_isStratch
                }
                
        };
        
        var addGoal = {
            
            adjustAddModal: function() {
                
                $('#tableAction .modal-header h4').html('<img src="/img/add-icon-b.svg" width="35" height="35" alt="">Add');
                $('#tableAction .modal-footer').html('<button id="save-n-g" class="btn btn-gray" type="submit" data-toggle="tooltip" data-placement="top" title="Add New Goal"><img src="/img/tick-s-b.svg" width="20" height="20" alt="add"></button>');
                $('#tableAction .modal-body .alert').remove();
                //$('#select-contribute-goal').removeAttr('disabled');
                
                //clear fields
                $('#select-goal-type').val('');
                $('#select-goal-type span.pull-left').text('select goal type');
                $('#select-contribute-goal').val('');
                $('#select-contribute-goal span.pull-left').text('Select Parent Goal');
                $('#goal').val('');
                $('#goal-date').val('');
                $('#select-assignee').val('no_assignee'); 
                $('#select-assignee span.pull-left').text('select assignee');
                $('#select-status').val(''); 
                $('#select-status span.pull-left').text('Status');  
                $('#goal-comments').val('');
                $('#itemId').val('');
                
                loadParendDropdown();
                 
            },
            
            saveNewGoal: function() {
                
                var goalPayload = goalData();
                
                $('#tableAction .modal-body .alert').remove();
                $('div.goals-list-wrapper ul div.text-center.no-data').addClass('hide');
                
                if(goalPayload['goal_type'].length < 3 || goalPayload['goal_contribution'].length < 3 || goalPayload['goal'].length < 3 || goalPayload['goal_date'].length < 3 || goalPayload['goal_status'].length < 3) {
                    
                    var msg = 'Ooops! Please select all mandatory(*) fields.',
                        msgType = 'error';
                     
                    $('#tableAction .modal-body').prepend(pop.app.ui.validationMsg(msg,msgType));
                    
                }else{
                    
                    $('#tableAction').modal('hide');
                    
                    $.ajax({
                        url: '/addGrowthPlanItem',
                        method: 'POST',
                        data: goalPayload
                    }).success(function (res) {
                                                
                        var goalItemId = res.id;
                                                 
                        loadGoals(goalItemId);
                      
                    }).error(function (res) {
                        
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                        
                    });
                    
                }
            }
        };
        
        var editGoal = {
            
            adjustEditModal: function() {
                
                var goalItemId = $(this).attr('data-id');
                
                loadParendDropdown();

                $('#tableAction .modal-header h4').html('<img src="/img/edit-icon-b.svg" width="35" height="35" alt="">Edit');
                $('#tableAction .modal-footer').html('<button id="save-edit" class="btn btn-gray" type="submit" data-toggle="tooltip" data-placement="top" title="Save Changes"><img src="/img/tick-s-b.svg" width="20" height="20" alt="add"></button>')
                $('#tableAction .modal-body .alert').remove();
                $('#select-contribute-goal').removeAttr('data-g-initial');
                //$('#select-contribute-goal').attr('disabled', 'disabled')

                $.ajax({
                    url: '/growth-plan/' + goalItemId,
                    method: 'GET'
                }).success(function (res) {
                   
                    if(res.status != 'success'){
                        
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                        
                    }else{
                        
                        oGrowthPlanItem = JSON.parse(res.data);
         
                        $('#select-goal-type').val(oGrowthPlanItem.type);
                        $('#select-goal-type').attr('data-g-initial', oGrowthPlanItem.type);
                        $('#select-goal-type span.pull-left').text(oGrowthPlanItem.type);
                        
                        if(oGrowthPlanItem.parent_growth_plan_id == null){
                            
                            $('#select-contribute-goal').val('new');
                            $('#select-contribute-goal span.pull-left').text('Add New Goal');
                            $('#select-contribute-goal').attr('data-g-initial', 'new')
                            
                        }else{
                            
                            $('#select-contribute-goal').val(oGrowthPlanItem.parent_growth_plan_id);
                            $('#select-contribute-goal').attr('data-g-initial', oGrowthPlanItem.parent_growth_plan_id)
                            var contributeToGoalTitle = $('[data-g-id=' + oGrowthPlanItem.parent_growth_plan_id + '] > .goal > .goal-header .goal-title strong').text();
                            
                            if(contributeToGoalTitle.length < 5) {
                               contributeToGoalTitle = oGrowthPlanItem.parent_growth_plan_id; 
                            }

                            $('#select-contribute-goal span.pull-left').text(contributeToGoalTitle);
                            
                        }
                        
                        $('#goal').val(oGrowthPlanItem.goal);
                        $('#goal-date').val(moment(oGrowthPlanItem.expiry_date).endOf('day').format('MMM DD, YYYY'));
                        $('#select-status').val(oGrowthPlanItem.status); 
                        $('#select-status span.pull-left').text(oGrowthPlanItem.status);  
                        $('#goal-comments').val(oGrowthPlanItem.comments);
                        $('#itemId').val(oGrowthPlanItem._id);
                                              
                        $('#select-assignee').val(oGrowthPlanItem.user_id);
                        $('#select-assignee').attr('data-a-i', oGrowthPlanItem.user_id);
                        $('#select-assignee span.pull-left').text($('[data-value=' + oGrowthPlanItem.user_id + ']').text());
                        
                        if(oGrowthPlanItem.isStratch)
                            $('#s-1').prop('checked', 'checked');
                        else
                            $('#s-1').removeAttr('checked');

                    }

                }).error(function (res) {
                    
                    $('body').append(pop.app.ui.sistemErrorMsg());
                    $('.sistem-error').delay(15000).slideUp();

                });
                
            },
            
            saveEditedGoal: function() {
                
                var goalPayload = goalData(),
                    goalItemId = $('#itemId').val(),
                    progressClass,
                    progressVal;

                $('#tableAction .modal-body .alert').remove();
                
                if(goalPayload['goal_type'].length < 3 || goalPayload['goal_contribution'].length < 3 || goalPayload['goal'].length < 3 || goalPayload['goal_date'].length < 3 || goalPayload['goal_status'].length < 3) {
                    
                    var msg = 'Ooops! Please select all mandatory(*) fields.',
                        msgType = 'error';
                     
                    $('#tableAction .modal-body').prepend(pop.app.ui.validationMsg(msg,msgType));
                    
                }else{
                    
                    $('#tableAction').modal('hide');
                    
                    $.ajax({
                        url: '/editGrowthPlanItem/' + goalItemId,
                        method: 'PUT',
                        data: goalPayload
                    }).success(function () {
                        
                        loadGoals(goalItemId);
                       
                        var countGoals = $('.goals-list-wrapper > .goals-wrapper > [data-g-id]').length;
                        
                        if(countGoals < 1) {
                        
                            $('.goals-wrapper').prepend("<div class='text-center no-data'><strong>You currently don't have any goals.</strong></div>");
                        
                        }
                        
                        
                    }).error(function () {
                        
                        $('body').append(pop.app.ui.sistemErrorMsg());
                        $('.sistem-error').delay(15000).slideUp();
                    
                    });
                    
                };
            }
            
        };
        
        var deleteGoal = {
            
            confirmDelete: function() {
                
                var msg = 'This action will archive this goal and all it’s associated goals. Are you sure you want to continue?',
                    title = 'Delete Goal',
                    itemId = $(this).attr('data-id');
                
                pop.app.ui.confirmAction(msg,title,itemId);
                
            },
            
            deleteSelected: function() {
    
                var itemId = $(this).attr('data-id'),
                    targetItem = $('[data-g-id=' + itemId + ']'),
                    parentId =  targetItem.parent().closest('li').attr('data-g-id'),
                    countChilds = $('#goal-expanded-' + parentId + ' li').length > 1;
               
                var payLoad = {
                    goal_id: itemId
                };
                
                $.ajax({
                    url: '/archieveGoal',
                    method: 'POST',
                    data: payLoad
                }).success(function () {
                    
                    var countGoals = $('.goals-list-wrapper > .goals-wrapper > [data-g-id]').length;
                    
                    loadGoals();
                    
                    if(countGoals < 1) {
                        
                        $('.goals-wrapper').prepend("<div class='text-center no-data'><strong>You currently don't have any goals.</strong></div>");
                        
                    }
                    
                }).error(function () {
                    
                    $('body').append(pop.app.ui.sistemErrorMsg());
                    $('.sistem-error').delay(15000).slideUp();
                    
                });
                
            }
            
        };
        
        var sendFeedback = function() {
            
            var goalItemId = $(this).closest('li').attr('data-g-id'),
                feedbackText = $(this).closest('.input-group').find('.goal-feedback').val(),
                childMarker = $(this).closest('li').attr('data-g-t'),
                self = $(this);
            
            $('.goals-list-wrapper .alert').remove();
            $('.p-l-r').remove();
 
            if(feedbackText.length < 5) {
                
                var msg = 'Please note that your feedback should contain at least 5 letters.',
                    msgType = 'error';
                
                if(childMarker){
                    $(this).closest('li').before('<div class="p-l-r">' + pop.app.ui.validationMsg(msg,msgType) + '</div>')    
                }else{
                    $(this).closest('li').before(pop.app.ui.validationMsg(msg,msgType))
                }
                
            }else{
                
                var payLoad = {
                    goalItemId: goalItemId, 
                    feedbackText: feedbackText
                };

                $.ajax({
                    url: '/addGoalFeedback',
                    method: 'POST',
                    data: payLoad
                }).success(function (res) {
                    
                    console.log(res);
                    
                    var msg = 'Your feedback has been successfully sent.',
                        msgType = 'success';

                    self.closest('.input-group').find('.goal-feedback').val('');
                    self.closest('.collapse').removeClass('in').attr('aria-expanded', 'false').css('height:', '0px');

                    if(childMarker){
                        self.closest('li').before('<div class="p-l-r">' + pop.app.ui.validationMsg(msg,msgType) + '</div>')    
                    } else {
                        self.closest('li').before(pop.app.ui.validationMsg(msg,msgType))
                    }

                }).error(function (res) {
                    
                    $('body').append(pop.app.ui.sistemErrorMsg());
                    $('.sistem-error').delay(15000).slideUp();
                    
                });
            }
            
        };
        
        var loadParendDropdown = function() {
            
            $.ajax({
                url: '/parent-growth-plan',
                method: 'GET'
            }).success(function (res) { 
                
                $('[aria-labelledby="select-contribute-goal"] li').remove();
                             
                for (i = 0; i < res.parentGoalList.length; i++) {
                    
                    j = i + 1;
                    $('[aria-labelledby="select-contribute-goal"]').append('<li><a href="#" data-value="new">' + res.parentGoalList[i].goal + '</a></li>');
                    $('[aria-labelledby="select-contribute-goal"] li:nth-of-type('+j+') a').attr('data-value', res.parentGoalList[i]._id);
                
                }
                
                $('[aria-labelledby="select-contribute-goal"]').prepend('<li><a href="#" data-value="new">Add New Goal</a></li>');
            
            }).error(function (res) {
                    
                $('body').append(pop.app.ui.sistemErrorMsg());
                $('.sistem-error').delay(15000).slideUp();
                    
            });
            
        }
        
        var loadGoals = function(goalItemId){
            
            var scrollPosition = 0;
            var datefrom = $('#goal-date-from').val();
            var dateto = $('#goal-date-to').val();
            $.ajax({
                url: '/goals?isAjax=true&from=' + datefrom + '&to=' + dateto,
                method: 'GET'
            }).success(function (res) { 
                
                $('.goals-list-wrapper').replaceWith(res);
                
                if($('[data-g-id=' + goalItemId + ']').attr('data-g-t')){
                    
                    var targetItem = $('[data-g-id=' + goalItemId + ']'), 
                        parentId =  targetItem.parent().closest('li').attr('data-g-id');
                    
                    targetItem.closest('.collapse').addClass('in').attr('aria-expanded', 'true').attr('style','');
                
                }
                
                if(goalItemId != null ){
                    scrollPosition = $('[data-g-id='+goalItemId+']').offset().top - 90
                }
                
                $('html, body').animate({
                    scrollTop: scrollPosition
                }, 1000);
                
 
            }).error(function (res) {
                    
                $('body').append(pop.app.ui.sistemErrorMsg());
                $('.sistem-error').delay(15000).slideUp();
                    
            });   
        };
        
        function page() {
            
        }
        
        page.prototype.initialize = function() {
            
            //add modal
            pop.app.attach('click', '#addB', addGoal.adjustAddModal);
            
            //save goal
            pop.app.attach('click', '#tableAction .modal-footer #save-n-g', addGoal.saveNewGoal);
            pop.app.attach('click', '#tableAction .modal-footer #save-edit', editGoal.saveEditedGoal);
            
            //edit modal
            pop.app.attach('click', '.edit-b', editGoal.adjustEditModal);
            
            //confirm delete
            pop.app.attach('click', '.delete-b', deleteGoal.confirmDelete);
            
            //delete goal
            pop.app.attach('click', '#deleteItem', deleteGoal.deleteSelected);
            
            //send feedback
            pop.app.attach('click', '.send-feedback', sendFeedback);
            
            pop.app.attach('click', '[data-toggle="collapse"] img', function(){
               
                var self = $(this);
                pop.app.ui.rotateImg(self);
                
            });
            
            //datetime picker
            $('#date-wrapper, #goal-date').datetimepicker({
                minDate: moment().endOf('day'),
                format: 'MMM DD, YYYY'
            }).on("dp.change", function(e) {
                $('.bootstrap-datetimepicker-widget').hide()
                $('#goal-date').blur();
            });
            $('#goal-date-from').datetimepicker({
                format: 'MMM DD, YYYY'
            }).on("dp.change", function(e) {
                $('.bootstrap-datetimepicker-widget').hide()
                $('#goal-date-from').blur();
                loadGoals();
            });
            $('#goal-date-to').datetimepicker({
                format: 'MMM DD, YYYY'
            }).on("dp.change", function(e) {
                $('.bootstrap-datetimepicker-widget').hide()
                $('#goal-date-to').blur();
                loadGoals();
                
            });

        }
        
        return new page();
        
    })();
    
    pop.page = page;
    
})(window.pop = pop || {});
    
pop.page.initialize();
