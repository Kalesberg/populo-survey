var page;
(function () {
    
    var page = (function () {
        
        var cardActions = {
            
             adjustCardHeight: function (tElement) {
                
                var sWidth = $(window).width();
                
                if(sWidth > 750 && sWidth < 992) {
                    
                    var cardHeight = tElement.find('.card-wrapper').height() + 48,
                        card = $('.card-wrapper');
                    
                    for(i=0;i<card.length;i++){
                        card.css('height', cardHeight+'px')
                    }
                    
                }
                
            },
        
            changeOnHover: function () {
                
                var sWidth = $(window).width();
                
                if(sWidth > 750) {
                    
                    var getTitle = $(this).find('.card-title strong').text(),
                        getSubTitle = $(this).find('.card-s-title').text(),
                        colorClass;

                    switch(getTitle){

                      case 'grow':
                         colorClass='grow-b-color'
                         break;

                      case 'achieve':
                         colorClass='achieve-b-color'
                         break;

                      case 'social':
                         colorClass='social-b-color'
                         break;

                      case 'learning':
                         colorClass='default-b-color'
                         break;

                      default:  
                         colorClass='default-b-color'      
                    }

                    $(this).find('.card-title-h').text(getTitle);
                    $(this).find('.card-s-title-h').text(getSubTitle);
                    $(this).find('.card-title, .card-s-title').addClass('hide');
                    $(this).find('.more').addClass('dots-h').css('padding-top','85px');
                    $(this).find('.card-header').css('height','120px').addClass('card-icon-o ' + colorClass);
                    $(this).find('.icon-w').css('margin-top','20px');
                    $(this).find('.card-wrapper').css('padding-bottom','48px');
                    var tElement = $(this);
                    cardActions.adjustCardHeight(tElement);
                }
            },
            
            changeOnLeave: function () {
                
                var sWidth = $(window).width();
                
                if(sWidth > 750) {
                    
                    var cardHeaderLastClass = $(this).find('.card-header').attr('class').split(' ').pop();

                    $(this).find('.card-title-h').text('');
                    $(this).find('.card-s-title-h').text('');
                    $(this).find('.card-title, .card-s-title').removeClass('hide'); 
                    $(this).find('.text-center:last-of-type').removeClass('dots-h'); 
                    $(this).find('.card-header, .icon-w, .more, .card-wrapper').removeAttr('style'); 
                    $(this).find('.card-header').removeClass(cardHeaderLastClass + ' card-icon-o')
                    var tElement = $(this);
                    cardActions.adjustCardHeight(tElement);
                }
            }
            
        }
        
        function page() {
            
        }
        
        page.prototype.initialize = function () {
            
            //card on hover
            pop.app.attachSingle('mouseover','li.col-xs-6.col-md-3',cardActions.changeOnHover);
            
            //card on leave
            pop.app.attachSingle('mouseleave','li.col-xs-6.col-md-3',cardActions.changeOnLeave);
            
            //small devices reduce card heaigh
            pop.app.attachSingle('resize', window, function(){
                
                var sWidth = $(window).width();
                
                if(sWidth < 768) {
                    $('.card-wrapper').removeAttr('style'); 
                    $('li.col-xs-6.col-md-3:nth-of-type(1) .card-title-h').text('grow');
                    $('li.col-xs-6.col-md-3:nth-of-type(2) .card-title-h').text('achieve');
                    $('li.col-xs-6.col-md-3:nth-of-type(3) .card-title-h').text('social');
                    $('li.col-xs-6.col-md-3:nth-of-type(4) .card-title-h').text('learn');
                }else{
                    $('li.col-xs-6.col-md-3 .card-title-h').text('');
                }
                
            })

        }
        
        return new page();
        
    })();
    
    pop.page = page;
    
})( window.pop = pop || {} )

pop.page.initialize()