var page;
(function (){
    
    var page = (function () {
        
        var rateQuestion = {
            
            //rate on scale 1-5
            ratingScaleRate: function () {
                
                var getValue = $(this).closest('li').index() + 1,
                lastClassTimeline = $(this).closest("ul").attr('class').split(' ').pop();

                $(this).closest("ul").find("li").each(function(i) {

                    i++;
                    if (i < getValue ){
                        $(this).find("label").addClass("r-color-" + i);
                    }else {
                        $(this).find("label").removeClass("r-color-" + i);
                                 }
                    });

                    if (lastClassTimeline !=="responses"){
                       $(this).closest("ul").removeClass(lastClassTimeline);
                    }
                    $(this).closest("ul").addClass("timeline" + getValue);

                $(this).closest("ul").find("input[type=radio]:checked + label.text-capitalize").addClass("r-checked-" + getValue + " " + "r-checked-b" + getValue + " " + "label-c-" + getValue);

                $(this).parents('.question').find('.selected-answer').attr('value', getValue - 1);
                $(this).parents('.question').find('.btn-not-able-tmj').removeClass('emotion-btn-active');
                $(this).parents('.question').find('.select-emotion-option').attr('value', "false");
            },
            
            //rate on NA button
            emotionBtnRate: function (event) {
                
                var current_ele = $(event.currentTarget),
                    inputEle = current_ele.prev(),
                    inputValue = inputEle.val();

                if(!current_ele.hasClass('emotion-btn-active')){
                  if (inputValue == "false") {

                    $(this).parents('.question').find('ul.responses').attr('class', 'responses');
                    $(this).parents('.question').find('ul.responses').find('label').attr('class', 'text-capitalize');
                    $(this).parents('.question').find('ul.responses').find('input').prop('checked', false);
                    inputEle.attr('value', "true");
                  } else {

                    $(this).parents('.question').find('ul.responses').attr('class', 'responses');
                    $(this).parents('.question').find('ul.responses').find('label').attr('class', 'text-capitalize');
                    $(this).parents('.question').find('ul.responses').find('input').prop('checked', false);
                    inputEle.attr('value', "false");
                  }

                  current_ele.addClass('emotion-btn-active');
                }
                
            },
            
            //check if all questions are checked
            questionsValidation: function () {
                
                $('.alert').remove(); 
                
                var all_selected = true;
                $("input:radio").each(function(){
                    var name = $(this).attr("name"),
                        emotionBtn = $(this).closest(".col-xs-12").find("button");

                    if(!$("input[type=radio][name="+name+"]").is(':checked') && !emotionBtn.hasClass("emotion-btn-active") ){
                        all_selected = false;
                    }
                });

                if ( all_selected == false ) {
   
                    var msg = 'Ooops! Please answer all the questions to continue.',
                        msgType = 'error'; 
                    
                    $(pop.app.ui.validationMsg(msg,msgType)).insertBefore('.timeline-wrapper');  
                    
                    $('html, body').animate({
                        scrollTop: $(".error-msg").offset().top - 90
                    }, 1000);
                        return false;
                    }else {
                        return true;
                    }
            }
            
        }
        
        var surveyActions = {
            
            //go to previous questions
            questionsBack: function (event) {
                
                $('form').append('<input class=hide value=back name=backBtn />');
                $('form').find('input[type="submit"]').click();
                
            },
            
            //see next questions
            questionsNext: function (event){
                event.preventDefault();
                if(rateQuestion.questionsValidation()){
                  $('form').find('input[type="submit"]').click();
                }   
            },
            
            //submit survey
            questionsSubmit: function (event) {
                event.preventDefault();
                if(rateQuestion.questionsValidation()){
                  $('form').append('<input class=hide value=submit name=submitBtn />');
                  $('form').find('input[type="submit"]').click();
                }    
            },
            
            //save survey
            questionsSave: function (event) {
                event.preventDefault();
                $('form').append('<input class=hide value=save name=saveBtn />');
                $('form').find('input[type="submit"]').click();
            }
            
        }
        
        //sticky timeline
        var stickyTimeline = function () {
            var startPosition = $(".s-header").offset().top,
                topPosition = $(this).scrollTop(),
                winHeight = $(this).height(),
                docHeight = $(document).height();

            if (topPosition > startPosition && topPosition + winHeight < docHeight - 150) {
                $(".timeline-wrapper").addClass("sticky-timeline");
                $(".timeline-header, .timeline").addClass("sticky-timeline-inner center-block");
            } else {
                if (topPosition == 0 || topPosition + winHeight == docHeight) {
                    $(".timeline-wrapper").removeClass("sticky-timeline");
                    $(".timeline-header, .timeline").removeClass("sticky-timeline-inner center-block");
                }
            }    
        }
        
        function page () {
            
        }
        
        page.prototype.initialize = function () {
            
            //click on rating scale
            pop.app.attach('click', 'form ul.responses li input[type=radio]', rateQuestion.ratingScaleRate)
            
            //click on emotion button
            pop.app.attach('click', '.emotion-btn', rateQuestion.emotionBtnRate)
            
            //questions - go back
            pop.app.attachSingle('click', '.submit-assessment-back-type', surveyActions.questionsBack)
            
            //questions - see next
            pop.app.attachSingle('click', '#nextQ', surveyActions.questionsNext)
            
            //questions - submit
            pop.app.attachSingle('click', '.submit-assessment-btn', surveyActions.questionsSubmit)
            
            //questions - save
            pop.app.attachSingle('click', '.save-assessment-btn', surveyActions.questionsSave)
            
            //sticky timeline
            pop.app.attachSingle('scroll touchmove', window, stickyTimeline)
            
            $('.radio-edit-select').click();

        }
       
        
        return new page;
        
    })();
    
    pop.page = page;
    
})(window.pop = pop || {})


pop.page.initialize()
