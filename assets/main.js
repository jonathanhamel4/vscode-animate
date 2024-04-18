// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
function main(browser) {
    // const vscode = acquireVsCodeApi();
    const animator = new Animator();

    document.addEventListener('mousedown', (e) => {
        if (e.target.id === animator.stopButton.id) { return; }
        animator.createNode(e.clientX, e.clientY);
    });

    document.addEventListener('mouseup', (e) => {
        if (e.target.id === animator.stopButton.id) { return; }
        animator.releaseNode(true);
        // vscode.postMessage({ type: 'clicked' });
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
        this.nodes = [];
        const resetNodes = this.resetNodes.bind(this);
        this.stopButton = new StopButton('stop', 'body', resetNodes);
        this.sizeIntervalId = null;
        this.tempAnimatedNode = null;
    }

    resetNodes() {
        this.nodes.forEach((node) => {
            node.stop();
        });
        this.nodes = [];
    }

    createNode(x, y) {
        this.tempAnimatedNode = new AnimatedNode(x, y, 5);
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
        this.nodes.forEach((node) => {
            node.setWidthAndHeight();
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
    constructor(x, y, size) {
        // init
        this.size = size;
        this.setWidthAndHeight();
        const trueY = this.clientHeight - y;
        this.x = x;
        this.y = trueY;
        this.node = this.createNode();
        this.setBoundaries();

        // slope info
        this.a = 0;
        this.b = 0;
        this.intervalId = null;
        this.direction = DIRECTION.RIGHT;

        // add
        this.appendHtmlNode();
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

    setWidthAndHeight() {
        this.clientWidth = window.innerWidth;
        this.clientHeight = window.innerHeight;
        this.maxWidth = this.clientWidth - this.size;
        this.maxHeight = this.clientHeight - this.size;
        this.minHeight = 1;
        this.minWidth = 1;
    }

    /** Increments the size and centers the element with the cursor while the cursor is being held */
    incrementSize() {
        if (this.size > 50) { return; }
        this.size += 2;
        this.x -= 1;
        this.y -= 1;

        this.setBoundaries();
    }

    /** Sets the boundaries of the zone using the whole client dimensions */
    setBoundaries() {
        this.node.style.left = this.x + 'px';
        this.node.style.bottom = this.y + 'px';
        this.node.style.width = this.size + 'px';
        this.node.style.height = this.size + 'px';

        this.setWidthAndHeight();
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
    appendHtmlNode() {
        const zone = document.querySelector('#zone');
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
        const rightCenterY = this.clientHeight / 2;
        const rightMostX = this.clientWidth;

        // y = ax + b;
        // initial slope (y2-y1)/(x2-x1)
        this.a = (rightCenterY - this.y) / (rightMostX - this.x);
        this.b = (this.a * this.x - this.y) * -1;
        this.direction = DIRECTION.RIGHT;
    }

    /** Defines the movement and collision behaviours through an interval */
    move() {
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
        }, 20);
    }

    /** Adjusts the slope and direction whenever there is a collision */
    newSlopeAndDirection(tempX) {
        const collisionWithSide = tempX <= this.minWidth || tempX >= this.maxWidth;
        if (collisionWithSide) {
            this.direction = DIRECTION.OPPOSITE[this.direction];

        }

        this.a = this.a * - 1;
        this.b = this.y - this.a * this.x;
    }

    /** Increments the x position to find a new (x, y) coordinate for the element */
    increment() {
        const updatedX = this.x + (0.5 * this.direction);
        const nextY = this.a * updatedX + this.b;
        return { x: updatedX, y: nextY };
    }

    /** Check if there has been a collision */
    hasCollision(x, y) {
        const topBottomCollision = y >= this.maxHeight || y <= this.minHeight;
        if (topBottomCollision) {
            return true;
        }

        if (this.direction === DIRECTION.RIGHT) {
            return x >= this.maxWidth;
        }
        return x <= this.minWidth;
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
