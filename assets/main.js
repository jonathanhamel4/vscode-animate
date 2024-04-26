// @ts-check

// @ts-expect-error
const isTestEnvironment = typeof jest !== 'undefined';

/**
 * Main function that runs in the browser
 */
function main() {
    const animator = new Animator();
    animator.listen();
};

class Direction {
    static Right = 1;
    static Left = -1;
    /**
     * 
     * @param {number} direction 
     * @returns {number}
     */
    static Opposite(direction) {
        return direction * -1;
    }
}

class Animator {
    constructor() {
        this.zoneId = 'zone';
        /** @type {HTMLSpanElement} */
        this.zone = this.createZone();
        /** @type {DOMRect} */
        this.dimensions = this.zone.getBoundingClientRect();
        /** @type {AnimatedNode[]} */
        this.nodes = [];
        /** @type {() => void} */
        const resetNodes = this.resetNodes.bind(this);
        /** @type {StopButton} */
        this.stopButton = new StopButton('stop', `#${this.zoneId}`, resetNodes);
        /** @type {NodeJS.Timeout | undefined} */
        this.sizeIntervalId = undefined;
        /** @type {AnimatedNode | null} */
        this.tempAnimatedNode = null;
        /** @type {() => void} */
        this.resize();
    }

    /**
     * Creates the bouncing area
     * @returns {HTMLDivElement}
     */
    createZone() {
        const zone = document.createElement('div');
        zone.id = this.zoneId;
        const body = document.querySelector('body');
        body?.insertBefore(zone, body.firstChild);
        return zone;
    }

    /**
     * Removes all nodes from the DOM and clears the array
     */
    resetNodes() {
        this.nodes.forEach((node) => {
            node.stop();
        });
        this.nodes = [];
    }

    /**
     * Creates the drop node and starts the auto grow interval.
     * @param {number} x 
     * @param {number} y 
     */
    createNode(x, y) {
        this.tempAnimatedNode = new AnimatedNode(x, y, 5, this.dimensions, `#${this.zoneId}`);
        this.nodes.push(this.tempAnimatedNode);
        this.sizeIntervalId = setInterval(() => {
            this.tempAnimatedNode?.incrementSize();
        }, 200);
    }

    /**
     * Clears the intervals and animates the node is parameter is true. 
     * It also shows the stop button and resets the intervals for the next node.
     * @param {boolean} animate 
     */
    releaseNode(animate) {
        clearInterval(this.sizeIntervalId);
        if (animate) {
            this.tempAnimatedNode?.animate();
        }
        this.stopButton.show();
        this.resetDefaults();
    }

    /**
     * Resets timers
     */
    resetDefaults() {
        this.tempAnimatedNode = null;
        this.sizeIntervalId = undefined;
    }

    /** 
     * Resizes the bouncing area 
     */
    resize() {
        this.dimensions = this.zone.getBoundingClientRect();
        this.nodes.forEach((node) => {
            node.setDimensions(this.dimensions);
        });
    }

    /**
     * Adds event listeners
     */
    listen() {
        document.addEventListener('mousedown', (e) => {
            const id = e.target && 'id' in e.target ? e.target.id : null;
            if (id === this.stopButton.id || e.button === 2) { return; }
            this.createNode(e.clientX, e.clientY);
        });

        document.addEventListener('mouseup', (e) => {
            const id = e.target && 'id' in e.target ? e.target.id : null;
            if (id === this.stopButton.id) { return; }
            this.releaseNode(true);
        });

        window.addEventListener('resize', () => {
            this.resize();
        });
    }

}

class StopButton {
    /**
     * Stop button class
     * @param {string} id 
     * @param {string} container 
     * @param {() => void} reset 
     */
    constructor(id, container, reset) {
        /** @type {string} */
        this.id = id;
        /** @type {HTMLButtonElement} */
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.id = id;
        this.button.innerText = 'Clear';
        this.button.style.display = 'none';

        const onClick = () => {
            reset();
            this.click();
        };

        this.button.onclick = onClick;
        const containerNode = document.querySelector(container);
        containerNode?.insertBefore(this.button, containerNode.firstChild);
    }

    click() {
        this.button.style.display = 'none';
    }

    show() {
        this.button.style.display = '';
    }
}

class AnimatedNode {
    /**
     * Animated node class
     * @param {number} x 
     * @param {number} y 
     * @param {number} size 
     * @param {DOMRect} dimensions 
     * @param {string} selector 
     */
    constructor(x, y, size, dimensions, selector) {
        /** @type {number} */
        this.size = size;
        /** @type {boolean} */
        this.removed = false;
        /** @type {DOMRect} */
        this.dimensions = dimensions;
        /** @type {number} */
        this.x = x - this.dimensions.left;
        const trueY = y - this.dimensions.top;
        /** @type {number} */
        this.y = this.dimensions.height - trueY;
        /** @type {HTMLSpanElement} */
        this.node = this.createNode();
        this.setNodePosition();

        // slope info
        /** @type {number} */
        this.a = 0;
        /** @type {number} */
        this.b = 0;
        /** @type {number} */
        this.direction = Direction.Right;

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

    /** 
     * If a drop was created outside of the zone 
     */
    resetOverflow() {
        if (this.x <= this.minWidth) {
            this.x = this.minWidth + 5;
        }
        if (this.x >= this.maxWidth) {
            this.x = this.maxWidth - 5;
        }
        if (this.y <= this.minWidth) {
            this.y = this.minWidth + 5;
        }
        if (this.y >= this.maxHeight) {
            this.y = this.maxHeight - 5;
        }
    }

    /**
     * Keeps the DomRect from the container
     * @param {DOMRect} dimensions 
     */
    setDimensions(dimensions) {
        this.dimensions = dimensions;
    }

    /** 
     * Returns a random hsl color
     * @returns {string}
     */
    getRandomColor() {
        const color = "hsl(" + Math.random() * 360 + ", 80%, 50%)";
        return color;
    }

    /**
     * Sets the actual absolute positioning of the drop
     */
    setNodePosition() {
        this.resetOverflow();
        this.node.style.left = this.x + 'px';
        this.node.style.bottom = this.y + 'px';
        this.node.style.width = this.size + 'px';
        this.node.style.height = this.size + 'px';
    }

    /**
     * Increments the size and centers the element with the cursor while the cursor is being held
     */
    incrementSize() {
        if (this.size > 50) { return; }
        this.size += 2;
        this.x -= 1;
        this.y -= 1;
        this.setNodePosition();
    }

    /**
     * Creates the node that will be moving
     * @returns {HTMLSpanElement}
     */
    createNode() {
        const template = document.querySelector("#drop");
        const copy = template?.cloneNode(true);
        if (!(copy instanceof HTMLTemplateElement)) {
            throw new Error('Invalid template element');
        }
        const node = copy.content.querySelector('.drop');
        if (!(node instanceof HTMLSpanElement)) {
            throw new Error("Invalid drop html element type");
        }
        node.style.backgroundColor = this.getRandomColor();
        return node;
    }

    /**
     * Adds the node to the html document
     * @param {string} selector 
     */
    appendHtmlNode(selector) {
        const zone = document.querySelector(selector);
        zone?.appendChild(this.node);
    }

    /** 
     * Starts the animation of the element. It defines the initial slope based on the
     * initial click and the (x,y) defined by the center of the right edge.
     */
    animate() {
        this.setInitialSlope();
        this.moveWithJsAnimation();
    }

    /** 
     * Uses the animate JS api to animate the drop between the edges
     * and uses the `finished` promise to trigger the next animation
     */
    moveWithJsAnimation() {
        const nextCollision = this.getNextCrossingCoordinate();
        const xDiff = nextCollision.x - this.x;
        const yDiff = (nextCollision.y - this.y) * -1;
        const { keyframes, animation } = this.getKeyframesAndAnimation(xDiff, yDiff);
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

    /**
     * Returns keyframes and a animation object given a X,Y coordinate to animate to
     * @param {number} newX 
     * @param {number} newY 
     * @returns {{keyframes: Record<string, string>[], animation: {duration: number, iterations: number}}}
     */
    getKeyframesAndAnimation(newX, newY) {
        const keyframes = [
            { transform: `translate(${newX}px, ${newY}px)` },
        ];
        const lengthToTravel = Math.sqrt(Math.abs(newX) ** 2 + Math.abs(newY) ** 2);
        const fastestDuration = 2000 * lengthToTravel / 300; // Travel 300px in 2 seconds.
        const sizeFactor = this.size === 5 ? 1 : 1 + (this.size / 10); // The bigger you are, the slower you are.
        const duration = fastestDuration * sizeFactor;

        const animation = {
            duration,
            iterations: 1,
        };

        return { keyframes, animation };
    }

    /**
     * Given a slope and a direction, find the next logical intersection with the boundary
     * @returns {{x: number, y: number}}
     */
    getNextCrossingCoordinate() {
        const xIfHittingSide = this.direction === Direction.Right ? this.maxWidth : this.minWidth;
        const yIfHittingSide = this.a * xIfHittingSide + this.b;
        if (yIfHittingSide <= this.maxHeight && yIfHittingSide >= this.minHeight) {
            return { x: xIfHittingSide, y: yIfHittingSide };
        }

        let tempY;
        if (this.direction === Direction.Right) {
            tempY = this.a > 0 ? this.maxHeight : this.minHeight;
        } else {
            tempY = this.a > 0 ? this.minHeight : this.maxHeight;
        }
        return { x: (tempY - this.b) / this.a, y: tempY };
    }

    /** 
     * Defines the initial slope of the drop given the starting point and the first collision 
     */
    setInitialSlope() {
        /** @typedef {'up' | 'right' | 'down' | 'left'} Directions */
        /** @type {Directions[]} */
        const directions = ['up', 'right', 'down', 'left'];
        /** @type {Directions} */
        let randomDirection = 'right';
        if (!isTestEnvironment) {
            randomDirection = directions[Math.floor(Math.random() * 4)];
        }

        /** @type {Record<Directions, {x: number, y: number, direction: number}>} */
        const positionByDirection = {
            'up': {
                x: this.dimensions.width / 2,
                y: this.dimensions.height,
                direction: ((this.dimensions.width / 2) - this.x) < 0 ? Direction.Left : Direction.Right,
            },
            'right': {
                x: this.dimensions.width,
                y: this.dimensions.height / 2,
                direction: Direction.Right,
            },
            'down': {
                x: this.dimensions.width / 2,
                y: 0,
                direction: ((this.dimensions.width / 2) - this.x) < 0 ? Direction.Left : Direction.Right,
            },
            'left': {
                x: 0,
                y: this.dimensions.height / 2,
                direction: Direction.Left,
            }
        };
        const { x, y, direction } = positionByDirection[randomDirection];
        this.a = (y - this.y) / (x - this.x);
        this.b = (this.a * this.x - this.y) * -1;
        this.direction = direction;
    }

    /** 
     * Adjusts the slope and direction whenever there is a collision
     */
    newSlopeAndDirection() {
        const collisionWithSide = this.x <= this.minWidth || this.x >= this.maxWidth;
        if (collisionWithSide) {
            this.direction = Direction.Opposite(this.direction);
        }
        this.a = this.a * - 1;
        this.b = this.y - this.a * this.x;
    }

    /** 
     * Removes the node from the html and clears the interval 
     */
    stop() {
        this.node.remove();
        this.removed = true;
    }
}

if (isTestEnvironment) {
    module.exports = { AnimatedNode, main, Direction, Animator };
} else {
    main();
}
