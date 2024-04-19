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
            const rect = document.getElementById('zone').getBoundingClientRect();
            const node = new AnimatedNode(10, 30, 5, rect, '#zone');

            expect(node.size).toBe(5);
            expect(node.removed).toBeFalsy();
            expect(node.dimensions).toStrictEqual({ "bottom": 50, "height": 50, "left": 0, "right": 50, "top": 0, "width": 50, "x": 0, "y": 0 });
            expect(node.x).toBe(10);
            expect(node.y).toBe(20);
            expect(node.node).toBeDefined();
            expect(node.a).toBe(0);
            expect(node.b).toBe(0);
            expect(node.direction).toBe(DIRECTION.RIGHT);
            expect(document.querySelector('#zone .drop')).toBeDefined();
            expect(node.node.style.left).toStrictEqual('10px');
            expect(node.node.style.bottom).toStrictEqual('20px');
            expect(node.node.style.width).toStrictEqual('5px');
            expect(node.node.style.height).toStrictEqual('5px');
            expect(node.maxWidth).toBe(45);
            expect(node.maxHeight).toBe(45);
            expect(node.minWidth).toBe(0);
            expect(node.minHeight).toBe(0);
        });

        it('sets a random color', () => {
            const rect = document.getElementById('zone').getBoundingClientRect();
            const node = new AnimatedNode(10, 30, 5, rect, '#zone');

            const color = node.getRandomColor();

            expect(color).toMatch(/hsl\([\d]+(.[\d]+)?, 80%, 50%\)/);
        });

        it('increments the size', () => {
            const rect = document.getElementById('zone').getBoundingClientRect();
            const node = new AnimatedNode(10, 30, 5, rect, '#zone');

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
            const rect = document.getElementById('zone').getBoundingClientRect();
            const node = new AnimatedNode(10, 30, 5, rect, '#zone');

            node.setInitialSlope();

            expect(node.direction).toBe(DIRECTION.RIGHT);
            expect(node.a).toBe(0.125);
            expect(node.b).toBe(18.75);
        });

        it('sets new slope', () => {
            const rect = document.getElementById('zone').getBoundingClientRect();
            const node = new AnimatedNode(10, 30, 5, rect, '#zone');
            node.setInitialSlope();

            node.x = 50;
            node.y = 25;
            node.newSlopeAndDirection();

            expect(node.direction).toBe(DIRECTION.LEFT);
            expect(node.a).toBe(-0.125);
            expect(node.b).toBe(31.25);
        });

        it('clears on stop', () => {
            const rect = document.getElementById('zone').getBoundingClientRect();
            const node = new AnimatedNode(10, 30, 5, rect, '#zone');

            node.stop();

            expect(node.removed).toBe(true);
            expect(document.querySelector('#zone .drop')).toBeFalsy();
        });
    });
});

function setGlobals() {
    document.body.innerHTML = `
    <div id="zone" style="top: 0; left: 0; right: 0; bottom: 0"><div>
    <template id="drop"><span class="drop"></span></template>
`;
    const zone = document.getElementById('zone');
    jest.spyOn(zone, "getBoundingClientRect").mockImplementation(() => (
        { "bottom": 50, "height": 50, "left": 0, "right": 50, "top": 0, "width": 50, "x": 0, "y": 0 }
    ));

    global.innerWidth = 50;
    global.innerHeight = 50;
}