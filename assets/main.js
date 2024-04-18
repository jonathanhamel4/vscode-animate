function main() {
    const animator = new Animator();

    document.addEventListener('mousedown', (e) => {
        if (e.target.id === animator.stopButton.id) { return; }
        animator.createNode(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', (e) => {
        if (e.target.id === animator.stopButton.id) { return; }
        animator.releaseNode(true);
    });

    window.addEventListener('resize', () => {
        animator.resize();
    });
};

const DIRECTION = function () {
    const dir = {
        RIGHT: 1,
        LEFT: -1,
    };
    dir['OPPOSITE'] = {
        [dir.LEFT]: dir.RIGHT,
        [dir.RIGHT]: dir.LEFT
    };
    return dir;
}();

class Animator {
    constructor() {
        this.createZone();
        this.nodes = [];
        const resetNodes = this.resetNodes.bind(this);
        this.stopButton = new StopButton('stop', '#zone', resetNodes);
        this.sizeIntervalId = null;
        this.tempAnimatedNode = null;
    }

    createZone() {
        this.zone = document.createElement('div');
        this.zone.id = 'zone';
        const body = document.querySelector('body');
        document.querySelector('body').insertBefore(this.zone, body.firstChild);
    }

    resetNodes() {
        this.nodes.forEach((node) => {
            node.stop();
        });
        this.nodes = [];
    }

    createNode(x, y) {
        const clientDimensions = this.zone.getBoundingClientRect();
        this.tempAnimatedNode = new AnimatedNode(x, y, 5, clientDimensions, '#zone');
        this.sizeIntervalId = setInterval(() => {
            this.tempAnimatedNode.incrementSize();
        }, 200);
    }

    releaseNode(browser) {
        clearInterval(this.sizeIntervalId);
        if (browser) {
            this.tempAnimatedNode.animate();
        }
        this.nodes.push(this.tempAnimatedNode);
        this.stopButton.show();
        this.reset();
    }

    reset() {
        this.tempAnimatedNode = null;
        this.sizeIntervalId = null;
    }

    resize() {
        const clientDimensions = this.zone.getBoundingClientRect();
        this.nodes.forEach((node) => {
            node.setDimensions(clientDimensions);
            node.setNodePosition();
        });
    }

}

class StopButton {
    constructor(id, container, reset) {
        this.id = id;
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.id = id;
        this.button.innerText = 'Stop';
        this.button.style.display = 'none';

        const onClick = () => {
            reset();
            this.click();
        };

        this.button.onclick = onClick;
        document.querySelector(container).insertBefore(this.button, document.querySelector(container).firstChild);
    }

    click() {
        this.button.style.display = 'none';
    }

    show() {
        this.button.style.display = '';
    }
}

class AnimatedNode {
    constructor(x, y, size, dimensions, selector) {
        // init
        this.setDimensions(dimensions);
        this.size = size;
        this.x = x - this.dimensions.left;
        const trueY = y - this.dimensions.top;
        this.y = this.dimensions.height - trueY;
        this.node = this.createNode();
        this.setNodePosition();

        // slope info
        this.a = 0;
        this.b = 0;
        this.intervalId = null;
        this.direction = DIRECTION.RIGHT;

        // add
        this.appendHtmlNode(selector);
    }

    resetOverflow() {
        if (this.x <= this.size) {
            this.x = this.size + 5;
        }
        if (this.x >= (this.dimensions.width - this.size)) {
            this.x = this.dimensions.width - this.size - 5;
        }
        if (this.y <= this.size) {
            this.y = this.size + 5;
        }
        if (this.y >= (this.dimensions.height - this.size)) {
            this.y = this.dimensions.height - this.size - 5;
        }
    }

    setDimensions(dimensions, setOverflow = true) {
        this.dimensions = dimensions;
    }

    /** returns a random color */
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    setNodePosition() {
        this.resetOverflow();
        this.node.style.left = this.x + 'px';
        this.node.style.bottom = this.y + 'px';
        this.node.style.width = this.size + 'px';
        this.node.style.height = this.size + 'px';
    }

    /** Increments the size and centers the element with the cursor while the cursor is being held */
    incrementSize() {
        if (this.size > 50) { return; }
        this.size += 2;
        this.x -= 1;
        this.y -= 1;

        this.setNodePosition();
    }

    /** Creates the node that will be moving */
    createNode() {
        const template = document.querySelector("#drop");
        const copy = template.cloneNode(true).content;
        const node = copy.querySelector('.drop');
        node.style.backgroundColor = this.getRandomColor();
        return node;
    }

    /** Adds the node to the html document */
    appendHtmlNode(selector) {
        const zone = document.querySelector(selector);
        zone.appendChild(this.node);
    }

    /** Starts the animation of the element. It defines the initial slope based on the
     * initial click and the (x,y) defined by the center of the right edge.
     */
    animate() {
        this.setInitialSlope();
        this.move();
    }

    setInitialSlope() {
        const centerY = this.dimensions.height / 2;
        const goingRight = Math.round(Math.random()) === 1;
        // const goingRight = true;
        const initialX = goingRight ? this.dimensions.width : 0;

        // y = ax + b;
        // initial slope (y2-y1)/(x2-x1)
        this.a = (centerY - this.y) / (initialX - this.x);
        this.b = (this.a * this.x - this.y) * -1;
        this.direction = goingRight ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }

    /** Defines the movement and collision behaviours through an interval */
    move() {
        const randomSpeed = (Math.random() * (80 - 20) + 20);
        this.intervalId = setInterval(() => {
            const { x: newX, y: newY } = this.increment();

            if (this.hasCollision(newX, newY)) {
                clearInterval(this.intervalId);
                this.newSlopeAndDirection(newX, newY);
                this.move();
            }

            this.x = newX;
            this.y = newY;
            this.node.style.bottom = this.y + 'px';
            this.node.style.left = this.x + 'px';
        }, randomSpeed);
    }

    /** Adjusts the slope and direction whenever there is a collision */
    newSlopeAndDirection(tempX) {
        const collisionWithSide = tempX <= 0 || tempX >= (this.dimensions.width - this.size);
        if (collisionWithSide) {
            this.direction = DIRECTION.OPPOSITE[this.direction];

        }

        this.a = this.a * - 1;
        this.b = this.y - this.a * this.x;
    }

    /** Increments the x position to find a new (x, y) coordinate for the element */
    increment() {
        let stepSize = 0.5;
        if (Math.abs(this.a) > 12) {
            stepSize = 0.12;
        } else if (Math.abs(this.a) > 2) {
            stepSize = 0.25;
        }
        const updatedX = this.x + (stepSize * this.direction);
        const nextY = this.a * updatedX + this.b;
        return { x: updatedX, y: nextY };
    }

    /** Check if there has been a collision */
    hasCollision(x, y) {
        const topBottomCollision = y >= (this.dimensions.height - this.size) || y <= 0;
        if (topBottomCollision) {
            return true;
        }

        if (this.direction === DIRECTION.RIGHT) {
            return x >= (this.dimensions.width - this.size);
        }
        return x <= 0;
    }

    /** Removes the node from the html and clears the interval */
    stop() {
        clearInterval(this.intervalId);
        this.node.remove();
    }
}

if (typeof jest !== 'undefined') {
    module.exports = { AnimatedNode, main, DIRECTION };
} else {
    main(true);
}
