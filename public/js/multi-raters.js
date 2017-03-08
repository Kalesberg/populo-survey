var page;
(function(){
    
    var page = (function () {
        
        var checkSwitches = function() {
            
            if ($('#role').val() != 'Manager')
            return;
    
            var all_selected = false;
            if($(".cards-wrapper .s-toggle:checked").length == $(".cards-wrapper .s-toggle").length)
            {
                all_selected = true;
            }

            if ( all_selected == false ) {
                $(".txt-area-wrapper").addClass("show");
                $(".btn-reply").addClass("show-b");
                $('html, body').animate({
                    scrollTop: $(".txt-area-wrapper").offset().top
                }, 1000); 

            }else{
                $(".txt-area-wrapper").removeClass("show");  
                $(".btn-reply").removeClass("show-b");
            }
            
        };
            
        var cardSwitchAction = function() {
            
            var checkId = $(this).attr('id');
            if($(this).is(':checked')) {
                $('#a-' + checkId).prop('checked', true);
            }
            else {
                $('#a-' + checkId).prop('checked', false);
            }

            checkSwitches()
            
        };
        
        var addUserSwitchAction = function() {
            var checkId = $(this).attr('id');
            checkId = checkId.substring(checkId.indexOf("-")+1);

            if($(this).is(':checked')) {
                if($('#' + checkId).length > 0) {
                    $('#' + checkId).prop('checked', true);
                }
                else {
                    nextCardNo = $(".cards-wrapper .s-toggle").length + 1;
                    cardImg = $($(this).parent().parent().parent()[0]).find("td:first").find('img').attr('src');
                    cardName = $($(this).parent().parent().parent()[0]).find("td:first").find('div').find('strong').html();
                    cardJobRole = $($(this).parent().parent().parent()[0]).find("td:first").find('div').find('span').html();
                    cardId = checkId;
                    cardIdName = $(this).attr('name');

                    newEl = '<li class="col-xs-6 col-md-3">';
                    newEl += '<div class="card-wrapper text-center">';
                    newEl += '<div class="card-header">' + nextCardNo + '</div>';
                    newEl += '<div class="c-avatar center-block avatar-border">';
                    newEl += '<img src="' + cardImg + '"></div>';
                    newEl += '<div><strong>' + cardName + '</strong></div>';
                    newEl += '<div class="text-capitalize">' + cardJobRole + '</div>';
                    newEl += '<div class="switch">';
                    newEl += '<input id="' + cardId + '" name="' + cardIdName + '" type="checkbox" class="s-toggle s-toggle-round" checked>';
                    newEl += '<label for="' + cardId + '"></label>';
                    newEl += '</div>';
                    newEl += '</div>';
                    newEl += '</li>';

                    $('.cards-wrapper ul').find(' > li:nth-last-child(1)').before(newEl);

                    $(".cards-wrapper input").off("click");
                    $(".cards-wrapper input").on("click", cardSwitchAction);
                }

            }
            else {
                if($('#' + checkId).length > 0) {
                    $('#' + checkId).parent().parent().parent().remove();

                    $(".cards-wrapper input").off("click");
                    $(".cards-wrapper input").on("click", cardSwitchAction);

                    // TODO: Adjust top number
                }
            }
        };
        
        var cardHeight = Math.max.apply(null, $(".cards-wrapper ul li").map(function () {
            return $(this).height();
        }).get());
        
        var addRatersDatatable = {
            
            init: function() {
                pop.factories.dataTable.initialize('#add-raters-table', {
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
                
                $("#add-raters-table_filter").hide();
                var addRatersTable = $('#add-raters-table').dataTable();
                
                $('#search-box').keyup(function(){
                    addRatersTable.fnFilter( $(this).val() );
                });
            }
        };
        
        var submitRaters = function() {
            raterCount = $(".cards-wrapper input").length;
            activeRaterCount = $(".cards-wrapper input:checked").length;

            if(raterCount == 0) {
                // Oops! No rater added, please add atleast one rater.
                return false;
            }

            if(activeRaterCount == 0) {
                // Oops! No active rater found, please add atleast one active rater.
                return false;
            }

            if ($('#role').val() == 'Manager') {
                managerComments = $(".cards-wrapper input:checked").length
            }

            var arrRaters = new Array;

            for(i = 0; i<raterCount; i++) {
                var objRater = new Object;
                objRater.id = $($(".cards-wrapper input")[i]).attr('name');
                objRater.status = $($(".cards-wrapper input")[i]).is(':checked');

                arrRaters.push(objRater);
            }

            $("#selectedRaters").val(JSON.stringify(arrRaters));
            return true;
        };
        
        function page () {

        }

        page.prototype.initialize = function () {
            checkSwitches();
            pop.app.attachSingle('click', '.cards-wrapper input', cardSwitchAction);
            pop.app.attachSingle('click', '#add-raters-table input', addUserSwitchAction);
            $('.add-button').css('height', cardHeight+"px");
            $(".initiate-scroll").mCustomScrollbar({
                scrollInertia:500
            });
            addRatersDatatable.init();
            addRatersDatatable.enableSearch();
            pop.app.attach('submit', '#raterForm', submitRaters() );
        }
       
        return new page;
        
    })()
    
    pop.page = page;
    
})(window.pop = pop || {})

pop.page.initialize()    