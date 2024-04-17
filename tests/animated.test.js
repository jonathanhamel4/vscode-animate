/**
 * @jest-environment jsdom
 */

const { AnimatedNode, DIRECTION } = require('../assets/main.js');

describe('main', () => {
    beforeEach(() => {
        setGlobals();
    });

    describe('AnimatedNode', () => {
        it('sets initial values', () => {
            const node = new AnimatedNode(10, 30, 5);

            expect(node.size).toBe(5);
            expect(node.clientHeight).toBe(50);
            expect(node.clientWidth).toBe(50);
            expect(node.x).toBe(10);
            expect(node.y).toBe(20);
            expect(node.node).toBeDefined();
            expect(node.a).toBe(0);
            expect(node.b).toBe(0);
            expect(node.direction).toBe(DIRECTION.RIGHT);
            expect(document.querySelector('#zone .drop')).toBeDefined()
            expect(node.clientHeight).toBe(50);
            expect(node.clientWidth).toBe(50);
            expect(node.node.style.left).toStrictEqual('10px');
            expect(node.node.style.bottom).toStrictEqual('20px');
            expect(node.node.style.width).toStrictEqual('5px');
            expect(node.node.style.height).toStrictEqual('5px');
            expect(node.maxWidth).toBe(45);
            expect(node.maxHeight).toBe(45);
            expect(node.minWidth).toBe(1);
            expect(node.minHeight).toBe(1);
        });

        it('sets a random color', () => {
            const node = new AnimatedNode(10, 30, 5);

            const color = node.getRandomColor();

            expect(color).toMatch(/#\w{6}/);
        });

        it('increments the size', () => {
            const node = new AnimatedNode(10, 30, 5);

            node.incrementSize();

            expect(node.size).toBe(7);
            expect(node.x).toBe(9);
            expect(node.y).toBe(19);
            expect(node.node.style.left).toStrictEqual('9px');
            expect(node.node.style.bottom).toStrictEqual('19px');
            expect(node.node.style.width).toStrictEqual('7px');
            expect(node.node.style.height).toStrictEqual('7px');
        });

        it('sets initial slope', () => {
            const node = new AnimatedNode(10, 30, 5);

            node.setInitialSlope();

            expect(node.direction).toBe(DIRECTION.RIGHT);
            expect(node.a).toBe(0.125);
            expect(node.b).toBe(18.75);
        });


        it('detects collisions', () => {
            const node = new AnimatedNode(10, 30, 5);

            const collisionWithSide = node.hasCollision(50, 30);
            const collisionWithTop = node.hasCollision(10, 50);


            expect(collisionWithSide).toBeTruthy();
            expect(collisionWithTop).toBeTruthy();
            expect(node.hasCollision(node.x, node.y)).toBeFalsy();
        });

        it('sets new slope slope', () => {
            const node = new AnimatedNode(10, 30, 5);

            node.setInitialSlope();

            node.x = 50;
            node.y = 25;
            node.newSlopeAndDirection();

            expect(node.direction).toBe(DIRECTION.RIGHT);
            expect(node.a).toBe(-0.125);
            expect(node.b).toBe(31.25);
        });

        it('increments x when moving', () => {
            const node = new AnimatedNode(10, 30, 5);

            node.setInitialSlope();

            expect(node.x).toBe(10);

            const { x, y } = node.increment();

            expect(x).toBe(10.5);
            expect(y).toBe(20.0625);
        });

        it('clears on stop', () => {
            const node = new AnimatedNode(10, 30, 5);

            node.stop();

            expect(document.querySelector('#zone .drop')).toBeFalsy();
        });
    });
});

function setGlobals() {
    document.body.innerHTML = `
    <button id="stop" type="button">Stop</button>
    <div id="zone"><div>
    <template id="drop"><span class="drop"></span></template>
`;
    global.innerWidth = 50;
    global.innerHeight = 50;
}