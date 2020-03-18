var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth - 6;
canvas.height = window.innerHeight - 6;
var c = canvas.getContext("2d");

var colorArray = [
    '#99BBFF',
    '#5599FF',
    '#0066FF',
    '#0044BB',
    '#003C9D',
    '#003377',
    '#9999FF',
    '#5555FF',
    '#0000FF'
];
//mouse
var mouse = {
    x: undefined,
    y: undefined
}
window.addEventListener('mousemove',
    function (event) {
        mouse.x = event.x;
        mouse.y = event.y;
    })
//resize when change
window.addEventListener('resize',
    function () {
        canvas.width = window.innerWidth - 6;
        canvas.height = window.innerHeight - 6;
        init();
    })
//draw circle
function Circle(x, y, radius, dx, dy, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.minRadius = radius;
    this.dx = dx;
    this.dy = dy;
    this.color = colorArray[Math.floor(Math.random() * colorArray.length)];

    this.draw = function () {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
        c.fillStyle = "rgba(20, 25, 14, 0.5)";
        c.fill();
    }

    this.colorDraw = function () {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    this.update = function () {
        if (this.x + this.radius >= innerWidth - 6 || this.x <= this.radius) this.dx = -this.dx;
        if (this.y + this.radius >= innerHeight - 6 || this.y <= this.radius) this.dy = -this.dy;
        this.x += this.dx;
        this.y += this.dy;
        //getting big
        if (mouse.x - this.x < 50 && mouse.x - this.x > -50 && mouse.y - this.y < 50 && mouse.y - this.y > -50)
            if (this.radius < 40) this.radius += 5;
        if (this.radius > this.minRadius) this.radius -= 1;
        this.colorDraw();
    }
}
//move


//main function
function init() {
    var circleArray = [];
    for (var i = 0; i < 1200; i++) {
        var x = Math.random() * (innerWidth - 7 - radius);
        var y = Math.random() * (innerHeight - 7 - radius);
        var dx = (Math.random() - 0.5);
        var dy = (Math.random() - 0.5);
        var radius = Math.random() * 4 + 1;
        circleArray.push(new Circle(x, y, radius, dx, dy));
    }
    animate = function() {
        requestAnimationFrame(animate);
        c.clearRect(0, 0, innerWidth, innerHeight);
        for (var i = 0; i < circleArray.length; i++) {
            circleArray[i].update();
        }
    }
};
init();
animate();