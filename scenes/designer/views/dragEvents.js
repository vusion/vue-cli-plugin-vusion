const dragKeys = ['isTrusted', 'screenX', 'screenY', 'clientX', 'clientY', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'button', 'buttons', 'pageX', 'pageY', 'x', 'y', 'offsetX', 'offsetY', 'movementX', 'movementY', 'layerX', 'layerY', 'detail', 'which', 'type', 'eventPhase', 'bubbles', 'cancelable', 'defaultPrevented', 'composed', 'timeStamp', 'returnValue', 'cancelBubble'];
function createEvent(type, pe) {
    // 懒得伪造了
    const dataTransfer = new DataTransfer();
    dataTransfer.dropEffect = pe.dataTransfer.dropEffect;
    dataTransfer.effectAllowed = pe.dataTransfer.effectAllowed;
    pe.dataTransfer.items.forEach((item) => dataTransfer.setData(item.type, item.content));

    const eventInit = {
        dataTransfer,
        bubbles: true,
    };
    dragKeys.forEach((key) => eventInit[key] = pe[key]);

    const dragEvent = new DragEvent(type, eventInit);
    // dragKeys.forEach((key) => dragEvent[key] = pe[key]);

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
        // lastTargets.forEach((target) => {
        //     if (!targets.includes(target))
        //         target.dispatchEvent(createEvent('dragleave', plainEvent));
        // });
        // targets.forEach((target) => {
        //     if (lastTargets.includes(target))
        //         target.dispatchEvent(createEvent('dragover', plainEvent));
        //     else
        //         target.dispatchEvent(createEvent('dragenter', plainEvent));
        // });
        if (lastTargets[0] && !targets.includes(lastTargets[0]))
            lastTargets[0].dispatchEvent(createEvent('dragleave', plainEvent));
        if (targets[0] && lastTargets.includes(targets[0]))
            targets[0].dispatchEvent(createEvent('dragover', plainEvent));
        else if (targets[0])
            targets[0].dispatchEvent(createEvent('dragenter', plainEvent));

        lastTargets = targets;
    } else if (e.data.type === 'dragleave') {
        // lastTargets.forEach((target) => {
        //     target.dispatchEvent(createEvent('dragleave', plainEvent));
        // });
        lastTargets[0] && lastTargets[0].dispatchEvent(createEvent('dragleave', plainEvent));
        lastTargets = [];
    } else if (e.data.type === 'drop') {
        // targets.forEach((target) => {
        //     const ev = createEvent('drop', plainEvent);

        //     console.log(JSON.stringify(plainEvent));
        //     target.dispatchEvent(ev);
        // });
        const ev = createEvent('drop', plainEvent);
        targets[0] && targets[0].dispatchEvent(ev);
        lastTargets = [];
    }
});
