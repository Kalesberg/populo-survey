var processNotificationId = [];

$(document).ready(function(){
    var socket = io();
    // Here we emit the event and back-end will add it into DB.
    socket.on('newNotification',function(msg){
        notifyMe(msg);
    });
    
    arrNotificationDate = $('.n-date');
    for(i=0; i<arrNotificationDate.length; i++) {
        $(arrNotificationDate[i]).text(moment($(arrNotificationDate[i]).text()).fromNow());
    }
});

function notifyMe(msg) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    }
    // Let's check if the user is okay to get some notification
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        createNotification(msg);
    }
    // Otherwise, we need to ask the user for permission
    // Note, Chrome does not implement the permission static property
    // So we have to check for NOT 'denied' instead of 'default'
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // Whatever the user answers, we make sure we store the information
            if (!('permission' in Notification)) {
                Notification.permission = permission;
            }
            // If the user is okay, let's create a notification
            if (permission === "granted") {
                createNotification(msg);
            }
        });
    }
    // At last, if the user already denied any notification, and you
    // want to be respectful there is no need to bother them any more.
}

function createNotification(msg) {
    
    if (processNotificationId.indexOf(msg.id) > -1)
        return; 
        
    addNotificationInApp(msg);
    
    var options = {
        title: msg.title, 
        body: msg.details,
        tag: msg.id, 
        icon: msg.img, 
        dir : "ltr"
    };
    var notification = new Notification(msg.title, options);
    processNotificationId.push(msg.id);
}

function addNotificationInApp(msg) {
    var notificationNumber = parseInt($('.new-responses-number-wrapper').text());
    
    if(notificationNumber == 0) {
        $('li.no_notification').hide();
        $('.new-responses-number-wrapper').removeClass('hide');
        $('.new-responses-number-wrapper').show();
    }
    
    $('.new-responses-number-wrapper').text(notificationNumber + 1);
    
    var dt = moment(msg.dateTime);
    
    var newNotification = '<li>';
    newNotification += '<a href="' + msg.href + '">';
    newNotification += '<div class="n-icon">';
    newNotification += '<img src="' + msg.userImg + '" width="45" height="45" class="mCS_img_loaded">';
    newNotification += '</div>';
    newNotification += '<div class="n-msg-wrapper"><div class="n-title">' + msg.title + '</div>';
    newNotification += '<div class="n-text">' + msg.details + '</div>';
    newNotification += '<div class="n-date">' + dt.fromNow() + '</div>';
    newNotification += '</div>';
    newNotification += '</a>';
    newNotification += '</li>';
    $('#n-menu').prepend(newNotification);
    
}