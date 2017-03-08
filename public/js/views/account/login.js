var page;
(function () {
    
    var page = (function () {
        
        var loginForm = {
            
            inputFocus: function () {
                $(this).prev("span").hide();
            },
            
            inputBlur: function () {
                if (!$(this).val()) {
                  $(this).prev("span").show();
                }
            },
            
            inputChange: function () {
                if ($('input').val().length > 1) {
                  $('#username, #password').prev("span").hide();
                }  
            },
            
            inputOnLoad: function () {
                setTimeout(function () {
                  if ($('#username').val().length > 1) {
                    $('#username, #password').prev("span").hide();
                  }
                });    
            }
        }
        
        function page () {
            
        }
        
        page.prototype.initialize = function () {
            
            //handle inputs on focus
            pop.app.attachSingle('focus','#username, #password', loginForm.inputFocus)
            
            //handle inputs on blur
            pop.app.attachSingle('blur','#username, #password', loginForm.inputBlur)
            
            //handle input on change
            pop.app.attachSingle('change','#username, #password', loginForm.inputChange)
            
            //handle input on page load
            pop.app.attachSingle('load', window, loginForm.inputOnLoad)
            
        }
        
        
        return new page();
        
    })()
    
    pop.page = page;
    
})(window.pop = pop || {});

pop.page.initialize()
    
