var pop;
(function () {
    
    //app
    var app = (function() {
        
        var topMenu = function() {
            
            var pgurl = window.location.href.substr(window.location.href.lastIndexOf("/"));
            
            switch(pgurl){

                case '/hr-insights':
                case '/manager-insights':
                case '/teamleader-insights':    
                    
                    lClass='l-grow'
                    break;
                    
                case '/dashboard':
                    
                    $('.t-menu ul').addClass('hide');
                    break;    

                case '/growth-plan':
                    
                    lClass='l-achieve'
                    break;

                case '/social':
                    
                    lClass='l-social'
                    break;
                    
                case '/learning':
                    
                    lClass='l-learning'
                    break;    
                    
                default:  
                    
            }
            
            $(".t-menu ul li a").each(function(){
                
                if($(this).attr("href") == pgurl )
                $(this).addClass(lClass);
                
            });
        }
        
        function app() {
            
        }
        
        app.prototype.initialize = function () {
            
            //tooltips
            $('body').tooltip({
                container: 'body',
                trigger : 'hover',
                selector:'[data-toggle="tooltip"], [data-hover="tooltip"]'
            });
            
            //dropdown select value
            this.attach('click', '#tableAction .dropdown-menu li a', function(e){
                e.preventDefault();
                $(this).parents(".dropdown").find('.btn').html('<span class="pull-left text-capitalize">' + $(this).text() + '</span>' + '<span class="caret pull-right"></span>');
                $(this).parents(".dropdown").find('.btn').val($(this).data('value'));
            });
            
            //dropdown prevent close on click inside
            this.attachSingle ('click', '#n-menu', function(e){
                e.stopPropagation();
            });
            
            //close msg
            this.attach('click', '[data-fade="alert"]',function(e){
                e.preventDefault();
                $(this).closest('div').remove();
            });
            
            //left menu expand
            this.attachSingle('click', '#hamburger-menu', function(e){
                e.preventDefault();
                $('.sidebar').toggleClass("sidebar-expand-l");
                $('.mask').toggleClass("is-active");
            });
            
            //left menu collapse
            this.attachSingle('click', '.mask, #close-sidebar', function(){
                $('.mask').removeClass("is-active");
		        $('.sidebar').removeClass("sidebar-expand-l");
            });
            
            //top menu
            topMenu();
            
        }
        
        app.prototype.attach = function (event, selector, callback) {
            $(document).on(event, selector, callback)
        }
        
        app.prototype.attachSingle = function (event, selector, callback) {
            $(selector).on(event, callback)
        }
        
        app.prototype.ui = {
            
            validationMsg: function (msg,msgType){
                var msgHtml='<div class="alert ' +msgType+ '-msg show">' +msg+ '<a href="#" class="close" data-fade="alert" aria-label="close">&times;</a></div>';
                return msgHtml;
            },
            
            sistemErrorMsg: function(msg){
                var msg = 'Ooops! We are sorry, but something went wrong. We have been notified about this issue and we will take a look at it shortly.',
                    msgHtml='<div class="sistem-error text-center">' +msg+ '<a href="#" class="close" data-fade="alert" aria-label="close">&times;</a></div>';
                return msgHtml;
            },
            
            actionLoader: function(){
                var msgHtml = '<div class="loader-wrapper text-center"><span class="loader"></span></div>';
                return msgHtml;
            },
            
            rotateImg:function(self) {
                
                if (self.css( "transform" ) == 'none' ){
                    
                    self.css("transform","rotate(180deg)");
                    
                } else {
                    
                    self.removeAttr("style" );
                    
                }
                
            },
            
            confirmAction: function (msg,title,itemId) {
                
                if (itemId == null){
                    
                    var itemId = '';
                    
                }
                
                var $modal = $('<div tabindex="-1" role="dialog" name="' +title+ '" class="modal fade confirm-delete" style="display: none;">'+
                               '<div role="document" class="modal-dialog">'+
                               '<div class="modal-content">'+
                               '<div class="modal-header">'+
                               '<button type="button" data-dismiss="modal" aria-label="Close" class="close"><span aria-hidden="true">×</span></button>'+
                               '<h4 class="modal-title text-capitalize"><img src="img/delete-icon-b.svg" alt="insights icon" width="35" height="35">' +title+ '</h4>'+
                               '</div>'+
                               '<div class="modal-body">'+
                               '<div class="form-f-wrapper">'+
                               '<div class="row">'+
                               '<div class="col-md-12 text-center">'+
                               '<div>' +msg+ '</div>'+
                               '</div>'+
                               '</div>'+
                               '</div>'+
                               '</div>'+
                               '<div class="modal-footer">'+
                               '<button id="deleteItem" type="button" data-id="' +itemId+ '" data-dismiss="modal" data-hover="tooltip" data-placement="top" title="' +title+ '" class="btn btn-gray btn-blue-c"><img src="/img/delete-icon-w.svg" alt="' +title+ '" width="20" height="20"></button>'+
                               '</div>'+
                               '</div>'+
                               '</div>'+
                               '</div>');

                $modal.on('hidden.bs.modal', function () {
                    $(this).remove();
                });

                $modal.modal();
            }

        }
        
        return new app();
    })()
    
    //factories
    var factories;
    (function() {
        
        var dataTable = (function(){
            
            function dataTable () {
                this.instances = [];
            }
            
            //init
            dataTable.prototype.initialize = function(selector, settings){
                var instance = $(selector).DataTable(settings);
                this.instances[selector] = instance;
            }
            
            return new dataTable();
            
        })()
        
        factories.dataTable = dataTable;
        
    })(factories = factories || {});
    
    pop.app = app;  
    pop.factories = factories;
    
})( window.pop = pop || {});

pop.app.initialize()