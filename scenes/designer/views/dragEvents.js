const dragKeys = ['isTrusted', 'screenX', 'screenY', 'clientX', 'clientY', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'button', 'buttons', 'pageX', 'pageY', 'x', 'y', 'offsetX', 'offsetY', 'movementX', 'movementY', 'layerX', 'layerY', 'detail', 'which', 'type', 'eventPhase', 'bubbles', 'cancelable', 'defaultPrevented', 'composed', 'timeStamp', 'returnValue', 'cancelBubble'];
function createEvent(type, pe) {
    const dragEvent = new DragEvent(type);
    dragKeys.forEach((key) => dragEvent[key] = pe[key]);
    // 懒得伪造了
    const dataTransfer = dragEvent.dataTransfer = pe.dataTransfer;
    dataTransfer.getData = function (type) {
        const item = this.items.find((item) => item.type === type);
        return item ? item.content : null;
    };

    return dragEvent;
}

let lastTargets = [];
window.addEventListener('message', (e) => {
    if (!(e.data && (e.data.type === 'dragenter' || e.data.type === 'dragover' || e.data.type === 'dragleave' || e.data.type === 'drop')))
        return;

    const plainEvent = e.data;

    // 在 drag 时，不会响应鼠标事件，因此只能根据 drag 相关事件处理
    const targets = document.elementsFromPoint(plainEvent.clientX, plainEvent.clientY);
    if (e.data.type === 'dragover') {
        lastTargets.forEach((target) => {
            if (!targets.includes(target))
                target.dispatchEvent(createEvent('dragleave', plainEvent));
        });
        targets.forEach((target) => {
            if (lastTargets.includes(target))
                target.dispatchEvent(createEvent('dragover', plainEvent));
            else
                target.dispatchEvent(createEvent('dragenter', plainEvent));
        });

        lastTargets = targets;
    } else if (e.data.type === 'dragleave') {
        lastTargets.forEach((target) => {
            target.dispatchEvent(createEvent('dragleave', plainEvent));
        });
        lastTargets = [];
    } else if (e.data.type === 'drop') {
        targets.forEach((target) => {
            target.dispatchEvent(createEvent('drop', plainEvent));
        });
        lastTargets = [];

        console.log(JSON.stringify(plainEvent));
    }
});
