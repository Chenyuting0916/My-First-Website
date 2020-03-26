$.ajax({
    type: 'POST',
    url: './getOnlineHistoryPeople.php',
    data: {
        data: '123'
    },
    success: function (response) {
        var data = JSON.parse(response);
        var sideBar = $('#sideBar');
        sideBar.text('瀏覽人次：' + data[0] + '人');
        sideBar.attr('title', '使用者使用時間為：' + data[1]);
    },
    error: function () {
        //alert('error: unable to connect');
    }
});