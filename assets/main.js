// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
const nodes = [];

(function () {
    // const vscode = acquireVsCodeApi();

    const stopElement = document.querySelector('#stop');
    stopElement.style.display = 'none';
    stopElement.onclick = () => {
        nodes.forEach((node) => {
            node.stop();
        });
        nodes = [];
    };

    let sizeIntervalId = null;
    let tempAnimatedNode = null;
    document.addEventListener('mousedown', (e) => {
        if (e.target.id === 'stop') { return; }

        tempAnimatedNode = new AnimatedNode(e.clientX, e.clientY, 5);
        nodes.push(tempAnimatedNode);
        sizeIntervalId = setInterval(() => {
            tempAnimatedNode.incrementSize();
        }, 200);
    });

    document.addEventListener('mouseup', (e) => {
        if (e.target.id === 'stop') { return; }

        clearInterval(sizeIntervalId);
        sizeIntervalId = null;
        tempAnimatedNode.animate();
        tempAnimatedNode = null;
        size = 5;
        stopElement.style.display = 'block';
        // vscode.postMessage({ type: 'clicked' });
    });
}());

class AnimatedNode {
    constructor(x, y, size) {
        // init
        this.size = size;
        this.clientWidth = window.innerWidth;
        this.clientHeight = window.innerHeight;
        const trueY = this.clientHeight - y;
        this.x = x;
        this.y = trueY;
        this.node = this.createNode();
        this.setBoundaries();

        // slope info
        this.a = 0;
        this.b = 0;
        this.intervalId = null;
        this.direction = 'right';
        this.node.style.backgroundColor = this.getRandomColor();

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

    /** Increments the size and centers the element with the cursor while the cursor is being held */
    incrementSize() {
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

        this.maxWidth = this.clientWidth - this.size;
        this.maxHeight = this.clientHeight - this.size;
        this.minHeight = this.size;
        this.minWidth = this.size;
    }

    /** Creates the node that will be moving */
    createNode() {
        const template = document.querySelector("#drop");
        const copy = template.cloneNode(true).content;
        const node = copy.querySelector('.drop');

        node.style.left = this.x + 'px';
        node.style.bottom = this.y + 'px';
        node.style.width = this.size + 'px';
        node.style.height = this.size + 'px';
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
        const rightCenterY = this.clientHeight / 2;
        const rightMostX = this.clientWidth;

        // y = ax + b;
        // initial slope (y2-y1)/(x2-x1)
        this.a = (rightCenterY - this.y) / (rightMostX - this.x);
        this.b = (this.a * this.x - this.y) * -1;
        this.direction = 'right';
        this.move();
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
        }, 40);
    }

    /** Adjusts the slope and direction whenever there is a collision */
    newSlopeAndDirection(tempX) {
        const collisionWithSide = tempX <= this.minWidth || tempX >= this.maxWidth;
        switch (this.direction) {
            case 'right': {
                if (collisionWithSide) {
                    this.direction = 'left';
                }
                break;
            }
            case "left": {
                if (collisionWithSide) {
                    this.direction = 'right';
                }
                break;
            }
        }

        this.a = this.a * - 1;
        this.b = this.y - this.a * this.x;
    }

    /** Increments the x position to find a new (x, y) coordinate for the element */
    increment() {
        switch (this.direction) {
            case 'right': {
                let nextY = this.a * (this.x + 1) + this.b;
                return { x: this.x + 1, y: nextY };
            }
            case "left": {
                let nextY = this.a * (this.x - 1) + this.b;
                return { x: this.x - 1, y: nextY };
            }
            default:
                return { x: this.x, y: this.y };
        }
    }

    /** Check if there has been a collision */
    hasCollision(x, y) {
        switch (this.direction) {
            case 'right': {
                return x >= this.maxWidth || y >= this.maxHeight || y <= this.minHeight;
            }
            case "left": {
                return x <= this.minWidth || y >= this.maxHeight || y <= this.minHeight;
            }
            default:
                return false;
        }
    }

    /** Removes the node from the html and clears the interval */
    stop() {
        clearInterval(this.intervalId);
        this.node.remove();
    }
}