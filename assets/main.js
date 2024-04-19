const isTestEnvironment = typeof jest !== 'undefined';

function main() {
    const animator = new Animator();
    animator.listen();
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
        this.resize();
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
        this.nodes.push(this.tempAnimatedNode);
    }

    releaseNode(browser) {
        clearInterval(this.sizeIntervalId);
        if (browser) {
            this.tempAnimatedNode.animate();
        }
        this.stopButton.show();
        this.reset();
    }

    reset() {
        this.tempAnimatedNode = null;
        this.sizeIntervalId = null;
    }

    resize() {
        this.dimensions = this.zone.getBoundingClientRect();
        this.nodes.forEach((node) => {
            node.setDimensions(this.dimensions);
        });
    }

    listen() {
        document.addEventListener('mousedown', (e) => {
            if (e.target.id === this.stopButton.id || e.button === 2) { return; }
            this.createNode(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', (e) => {
            if (e.target.id === this.stopButton.id) { return; }
            this.releaseNode(true);
        });

        window.addEventListener('resize', () => {
            this.resize();
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
        this.size = size;
        this.removed = false;
        this.setDimensions(dimensions);
        this.x = x - this.dimensions.left;
        const trueY = y - this.dimensions.top;
        this.y = this.dimensions.height - trueY;
        this.node = this.createNode();
        this.setNodePosition();

        // slope info
        this.a = 0;
        this.b = 0;
        this.direction = DIRECTION.RIGHT;

        // add
        this.appendHtmlNode(selector);
    }

    get maxWidth() {
        return this.dimensions.width - this.size;
    }

    get maxHeight() {
        return this.dimensions.height - this.size;
    }

    get minHeight() {
        return 0;
    }

    get minWidth() {
        return 0;
    }

    /** If a drop was created outside of the zone */
    resetOverflow() {
        if (this.x <= this.size) {
            this.x = this.size + 5;
        }
        if (this.x >= this.maxWidth) {
            this.x = this.maxWidth - 5;
        }
        if (this.y <= this.size) {
            this.y = this.size + 5;
        }
        if (this.y >= this.maxHeight) {
            this.y = this.maxHeight - 5;
        }
    }

    /** Keeps the DomRect from the container */
    setDimensions(dimensions) {
        this.dimensions = dimensions;
    }

    /** returns a random color */
    getRandomColor() {
        const color = "hsl(" + Math.random() * 360 + ", 80%, 50%)";
        return color;
    }

    /** Sets the actual absolute positioning of the drop */
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
        this.moveWithJsAnimation();
    }

    /** Uses the animate JS api to animate the drop between the edges
     * and uses the `finished` promise to trigger the next animation
     */
    moveWithJsAnimation() {
        const nextCollision = this.getNextCrossingCoordinate();
        const xDiff = nextCollision.x - this.x;
        const yDiff = (nextCollision.y - this.y) * -1;
        const keyframes = [
            { transform: `translate(${xDiff}px, ${yDiff}px)` },
        ];
        const lengthToTravel = Math.sqrt(Math.abs(xDiff) ** 2 + Math.abs(yDiff) ** 2);
        const fastestDuration = 2000 * lengthToTravel / 300;
        const sizeFactor = this.size === 5 ? 1 : 1 + (this.size / 10);
        const duration = fastestDuration * sizeFactor;

        const animation = {
            duration,
            iterations: 1,
        };

        const promise = this.node.animate(keyframes, animation);

        promise.finished.then(() => {
            if (this.removed) { return; };
            this.x = nextCollision.x;
            this.y = nextCollision.y;
            this.node.style.bottom = this.y + 'px';
            this.node.style.left = this.x + 'px';
            this.newSlopeAndDirection();
            this.moveWithJsAnimation();
        });
    }

    /** Given a slope and a direction, find the next logical intersection with the boundary */
    getNextCrossingCoordinate() {
        const xIfHittingSide = this.direction === DIRECTION.RIGHT ? this.maxWidth : this.minWidth;
        const yIfHittingSide = this.a * xIfHittingSide + this.b;
        if (yIfHittingSide <= this.maxHeight && yIfHittingSide >= this.minHeight) {
            return { x: xIfHittingSide, y: yIfHittingSide };
        }

        let tempY;
        if (this.direction === DIRECTION.RIGHT) {
            tempY = this.a > 0 ? this.maxHeight : this.minHeight;
        } else {
            tempY = this.a > 0 ? this.minHeight : this.maxHeight;
        }
        return { x: (tempY - this.b) / this.a, y: tempY };
    }

    /** Defines the initial slope of the drop given the starting point and the first collision */
    setInitialSlope() {
        const centerY = this.dimensions.height / 2;
        const goingRight = isTestEnvironment ? true : Math.round(Math.random()) === 1;
        const initialX = goingRight ? this.dimensions.width : 0;

        // y = ax + b;
        // initial slope (y2-y1)/(x2-x1)
        this.a = (centerY - this.y) / (initialX - this.x);
        this.b = (this.a * this.x - this.y) * -1;
        this.direction = goingRight ? DIRECTION.RIGHT : DIRECTION.LEFT;
    }

    /** Adjusts the slope and direction whenever there is a collision */
    newSlopeAndDirection() {
        const collisionWithSide = this.x <= this.minWidth || this.x >= this.maxWidth;
        if (collisionWithSide) {
            this.direction = DIRECTION.OPPOSITE[this.direction];
        }
        this.a = this.a * - 1;
        this.b = this.y - this.a * this.x;
    }

    /** Removes the node from the html and clears the interval */
    stop() {
        clearInterval(this.intervalId);
        this.node.remove();
        this.removed = true;
    }
}

if (isTestEnvironment) {
    module.exports = { AnimatedNode, main, DIRECTION };
} else {
    main();
}
