// function printPDF(pdfUrl){
//   var document = window.open(pdfUrl);
//   document.print();
// }

function printPDF(contentId){
  var prtContent = document.getElementById("" + contentId);
  var WinPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');

  WinPrint.document.write(prtContent.innerHTML);
  WinPrint.document.close();
  WinPrint.focus();
  WinPrint.print();
  WinPrint.close();
}

function dashboardPrintView(){
   window.print();
}

$(document).ready(function(){

  $('.survey-reminder-email').click(function(){
    var url = $(this).attr('link');
    var messageBox = $(this).parents('.assessment-wrapper').prev().find('.message-text');

    $.ajax({
      url: url,
      method: 'GET'
      , success: function(data){
        messageBox.html('Reminder Sent Successfully.<a href="#" class="close" data-fade="alert" aria-label="close">&times;</a>');
        messageBox.addClass('success-msg-fade show');
      },
      failure: function(data){
        messageBox.text('Reminder Sent Successfully');
        messageBox.addClass('bg-alert').fadeOut(2000);
      },
      error: function(data){
        messageBox.text('Reminder Failure');
        messageBox.addClass('bg-alert').fadeOut(2000);
      }
    });
  });
});