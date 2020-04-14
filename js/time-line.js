$(document).ready(function() {
    $('#timelineDetail').hide();
    $('#showTimeLine').click(function() {
        if ($(timelineDetail).is(":visible")) {
            $('#timelineDetail').hide('slow');
        } else {
            $('#timelineDetail').show('slow');
            $([document.documentElement, document.body]).animate({
                scrollTop: $("#timelineDetail").offset().top
            }, 1000);
        }
    });
    $('#closeDetailTimeline').click(function() {
        $('#timelineDetail').hide('slow');
    });

});