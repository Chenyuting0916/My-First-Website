function siteLabel(key, fallback) {
    if (window.i18n && typeof i18n.t === 'function') {
        var value = i18n.t(key);
        if (value && value !== key) return value;
    }
    return fallback;
}

function siteMoreLabel() {
    return siteLabel('timeline.readMore', '閱讀更多...');
}

function siteLessLabel() {
    return siteLabel('timeline.showLess', '收合');
}

$(document).ready(function() {
    $('#showTimeLine').click(function() {
        if ($('#timelineDetail').is(':visible')) {
            $('#timelineDetail').hide('slow');
            $('#showTimeLine').text(siteMoreLabel());
        } else {
            $('#showSkill').text(siteMoreLabel());
            $('#skillDetail').hide('slow');
            $('#timelineDetail').show('slow');
            $('#showTimeLine').text(siteLessLabel());
            $([document.documentElement, document.body]).animate({
                scrollTop: $('#timelineDetail').offset().top - 16
            }, 600);
        }
    });
    $('#closeDetailTimeline').click(function() {
        $('#timelineDetail').hide('slow');
        $('#showTimeLine').text(siteMoreLabel());
    });
    $('#showSkill').click(function() {
        if ($('#skillDetail').is(':visible')) {
            $('#skillDetail').hide('slow');
            $('#showSkill').text(siteMoreLabel());
        } else {
            $('#showTimeLine').text(siteMoreLabel());
            $('#timelineDetail').hide();
            $('#skillDetail').show('slow');
            $('#showSkill').text(siteLessLabel());
            $([document.documentElement, document.body]).animate({
                scrollTop: $('#skillDetail').offset().top - 16
            }, 600);
        }
    });
    $('#closeDetailSkill').click(function() {
        $('#skillDetail').hide('slow');
        $('#showSkill').text(siteMoreLabel());
    });
});