const compileUtil = {
    getVal(expr,vm){
        return expr.split('.').reduce((data,currentVal)=>{
            return data[currentVal]
        },vm.$data)

    },
    getContentVal(expr,vm){
      return expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
          return this.getVal(args[1],vm);
      })
    },
    text(node, expr, vm) {
        console.log(expr)
        let value;
        if(expr.indexOf('{{')!==-1){ //{{person.name}} -- {{person.age}}
            value=expr.replace(/\{\{(.+?)\}\}/g,(...args)=>{
                new Watcher(vm,args[1],()=>{
                    console.log(args[1],expr)
                    this.updater.textUpdater(node,this.getContentVal(expr,vm))
                    // this.updater.textUpdater(node,this.getVal(args[1],vm))
                });
                return this.getVal(args[1],vm);
            })
            console.log('value',value)
        } else {
            value=this.getVal(expr,vm);
        }

        this.updater.textUpdater(node,value);
    },
    html(node, expr, vm) {
        const value=this.getVal(expr,vm);
        new Watcher(vm,expr,(newVal)=>{
            this.updater.htmlUpdater(node,newVal)
        });
        this.updater.htmlUpdater(node,value);
    },
    model(node, expr, vm) {
        const value=this.getVal(expr,vm);
        new Watcher(vm,expr,(newVal)=>{
            this.updater.modelUpdater(node,newVal)
        });
        this.updater.modelUpdater(node,value);
    },
    on(node, expr, vm, eventName) {
        let fn=vm.$options.methods && vm.$options.methods[expr];
        node.addEventListener(eventName,fn.bind(vm),false);
    },
    bind(node,expr,vm,attrName){

    },
    //更新的函数
    updater:{
        modelUpdater(node,value){
            node.value=value;
        },
        textUpdater(node,value){
            node.textContent = value;
        },
        htmlUpdater(node,value){
            node.innerHTML=value;
        }
    }
}

class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        //1.获取文档碎片对象，放入内存中会减少页面的回流和重绘
        const fragment = this.node2Fragment(this.el);
        //2.编译模板
        this.compile(fragment)
        //3.追加子元素到根元素
        this.el.appendChild(fragment);
    }

    compile(fragment) {
        // 1.获取子节点
        const childNodes = fragment.childNodes;
        [...childNodes].forEach(child => {
            if (this.isElementNode(child)) {
                //编译元素节点
                this.compileElement(child);
            } else {
                //编译文本节点
                this.compileText(child);
            }
            if (child.childNodes && child.childNodes.length) {
                this.compile(child)
            }
        })
    }

    compileElement(node) {
        const attributes = node.attributes;
        [...attributes].forEach(attr => {
            const {name, value} = attr;
            if (this.isDirective(name)) { //是一个指令 v-text v-html v-model v-on:click
                const [, dirctive] = name.split('-'); //text html model on:click
                const [dirName, eventName] = dirctive.split(':');
                compileUtil[dirName](node, value,this.vm,eventName);
                //删除有指令的标签上的属性
                node.removeAttribute('v-'+dirctive);
            }else if(this.isEventName(name)){
                let [,eventName]=name.split('@');
                compileUtil['on'](node, value,this.vm,eventName);
            }
        })
    }

    compileText(node) {
        const content=node.textContent;
        if(/\{\{(.+?)\}\}/.test(content)){
            compileUtil['text'](node,content,this.vm);
        }
    }
    isEventName(attrName){
        return attrName.startsWith('@');
    }
    isDirective(attrName) {
        return attrName.startsWith('v-');
    }

    node2Fragment(el) {
        //创建文档碎片
        const f = document.createDocumentFragment();
        let firstChild;
        while (firstChild = el.firstChild) {
            f.appendChild(firstChild);
        }
        return f;
    }

    isElementNode(node) {
        return node.nodeType === 1;
    }
}

class MVue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;
        this.$options = options;
        if (this.$el) {
            //1.实现一个数据观察者
            new Observer(this.$data);
            //2.实现一个指令解析器
            new Compile(this.$el, this)
        }
    }
}