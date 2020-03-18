var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth - 6;
canvas.height = window.innerHeight - 6;

var c = canvas.getContext("2d");
c.fillStyle = "rgba(20, 25, 14, 0.5)";

function Circle(x, y, radius, dx, dy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;

    this.draw = function () {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, Math.PI * 2, false);
        c.fillStyle = "rgba(20, 25, 14, 0.5)";
        c.fill();
    }

    this.update = function () {
        if (this.x + this.radius > innerWidth || this.x < this.radius) this.dx = -this.dx;
        if (this.y + this.radius > innerHeight || this.y < this.radius) this.dy = -this.dy;
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    }
}

var circleArray = [];
for (var i = 0; i < 100; i++) {
    var x = Math.random() * (innerWidth - radius * 2 + radius);
    var y = Math.random() * (innerHeight - radius * 2 + radius);
    var dx = (Math.random() - 0.5) * 8;
    var dy = (Math.random() - 0.5) * 8;
    var radius = Math.random() * 50;
    circleArray.push(new Circle(x, y, radius, dx, dy));
}

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = 0; i < circleArray.length; i++) {
        circleArray[i].update();
    }
}

animate();