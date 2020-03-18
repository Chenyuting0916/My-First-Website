var canvas = document.querySelector('canvas');


canvas.width = window.innerWidth - 6;
canvas.height = window.innerHeight - 6;

var c = canvas.getContext("2d");
c.fillStyle = "rgba(20, 25, 14, 0.5)";

for (var i = 0; i < 1000; i++) {
    var x = Math.random() * window.innerWidth;
    var y = Math.random() * window.innerHeight;
    c.beginPath();
    c.arc(x, y, 30, Math.PI * 2, false);
    //c.fillStyle = "red";
    c.fill();
}


console.log(canvas);