export function walkInstance(rootVM, func) {
    let queue = [];
    queue = queue.concat(rootVM.$children);
    let nodeVM;
    while ((nodeVM = queue.shift())) {
        queue = queue.concat(nodeVM.$children);
        const result = func(nodeVM);
        if (result !== undefined)
            return result;
    }
}

export function findScrollParent(el) {
    let parent = el.parentElement;
    while (parent) {
        if (parent.scrollHeight > parent.clientHeight)
            return parent;
        parent = parent.parentElement;
    }
}

export function getVisibleRect(el) {
    const rect = JSON.parse(JSON.stringify(el.getBoundingClientRect()));
    // const parentEl = findScrollParent(el);
    // if (parentEl) {
    //     const parentRect = parentEl.getBoundingClientRect();
    //     rect.y = rect.top = Math.max(rect.top, parentRect.top);
    //     rect.x = rect.left = Math.max(rect.left, parentRect.left);
    //     rect.bottom = Math.min(rect.bottom, parentRect.bottom);
    //     rect.right = Math.min(rect.right, parentRect.right);
    //     rect.width = rect.right - rect.left;
    //     rect.height = rect.bottom - rect.top;
    // }
    return rect;
}
