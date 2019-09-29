const fs = require('fs');
const domLists = ["html","base","head","link","meta","meta ","script","style","title","body","address","article","aside","footer","header","h1","h2","h3","h4","h5","h6","hgroup","main","nav","section","blockquote","cite","dd","dl","dt","dir","div","figcaption","figure","hr","li","ol","ul","menu","p","pre","a","abbr","b","bdi","bdo","br","code","data","time","dfn","em","i","kbd","mark","q","rb","ruby","rp","rt","rtc","s","del","ins","samp","small","span","strong","sub","sup","tt","u","var","wbr","area","audio","src","source","img","map","track","video","applet","embed","iframe","noembed","object","param","picture","canvas","noscript","caption","table","col","colgroup","tbody","td","tfoot","th","scope","headers","thead","tr","button","datalist","fieldset","form","input","label","legend","meter","optgroup","select","option","output","progress","textarea","details","dialog","menuitem","summary","content","slot","element","template","acronym","basefont","font","bgsound","big","blink","center","command","frame","frameset","image","isindex","keygen","listing","marquee","multicol","nextid","nobr","noframes","plaintext", "shadow", "spacer","strike","xmp"]
module.exports = function (path) {
    return new Promise((res, rej) => {
        if (/\.vue$/g.test(path)) {
            const isExist = fs.existsSync(path) && fs.statSync(path).isFile();
            if(!isExist) {
                if (fs.existsSync(path+'/index.html'))
                    path = path+'/index.html';
                else
                    res([]);
            }
            fs.readFile(path, (err, data) => {
                if (err) return rej(err);
                if (!data) return res([]);
                const classList = [];
                const fileContent = data.toString('utf-8');
                function pushClassies(styleStr) {
                    if(/^\$style./g.test(styleStr)) {
                        const classNameVarName = styleStr.split('.')[1];
                        if(classNameVarName)
                            classList.push(classNameVarName);
                    }
                };
                fileContent.replace(/<([^>\s]*)?\s.*:class="([^"]*)"/g, (content, n1, n2) => {
                    if (!domLists.includes(n1) && n1!=='!--') {
                        const className = n2;
                        if (/^\[.*\]$/g.test(className)) {
                            const result = /^\[(.*)\]$/g.exec(className);
                            const contents = result[1].split(',').filter((item) => {
                                return item;
                            }).map((item) => {
                                return item.trim();
                            });
                            for (const item of contents) {
                                pushClassies(item);
                            }
                        } else
                            pushClassies(className);
                    }
                    return content;
                })
                res(Array.from(new Set(classList)));
            })
        } else {
            res([]);
        }
    });
    // console.log(fileContent);
}