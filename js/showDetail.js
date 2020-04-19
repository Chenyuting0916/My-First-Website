$(document).ready(function() {
    $('#timelineDetail').hide();
    $('#skillDetail').hide();
    //show timeline
    $('#showTimeLine').click(function() {
        if ($(timelineDetail).is(":visible")) {
            $('#timelineDetail').hide('slow');
            $('#showTimeLine').text('Read More...')
        } else {
            //close skillDetail
            $('#showSkill').text('Read More...');
            $('#skillDetail').hide('slow');
            //open timelineDetail
            $('#timelineDetail').show('slow');
            $('#showTimeLine').text('Show Less...')
            $([document.documentElement, document.body]).animate({
                scrollTop: $("#timelineDetail").offset().top
            }, 1000);
        }
    });
    $('#closeDetailTimeline').click(function() {
        $('#timelineDetail').hide('slow');
        $('#showTimeLine').text('Read More...')
    });
    //show skill
    $('#showSkill').click(function() {
        if ($(skillDetail).is(":visible")) {
            $('#skillDetail').hide('slow');
            $('#showSkill').text('Read More...')
        } else {
            //close timelineDetail
            $('#showTimeLine').text('Read More...');
            $('#timelineDetail').hide();
            //open skillDetail
            $('#skillDetail').show('slow');
            $('#showSkill').text('Show Less...')
            $([document.documentElement, document.body]).animate({
                scrollTop: $("#skillDetail").offset().top
            }, 1000);
        }
    });
    $('#closeDetailSkill').click(function() {
        $('#skillDetail').hide('slow');
        $('#showSkill').text('Read More...')
    });
});