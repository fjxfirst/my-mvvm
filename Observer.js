class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        //先把旧值保存起来
        this.oldVal = this.getOldVal();
    }

    getOldVal() {
        Dep.target = this;
        const oldVal = compileUtil.getVal(this.expr, this.vm);
        Dep.target = null;
        return oldVal;
    }

    update() {
        const newVal = compileUtil.getVal(this.expr, this.vm);
        if (newVal !== this.oldVal) {
            this.cb(newVal);
        }
    }
}

class Dep {
    constructor() {
        this.subs = [];

    }

    //收集观察者
    addSub(watcher) {
        this.subs.push(watcher);
    }

    //通知观察者去更新
    notify() {
        this.subs.forEach(w => {
            w.update()
        })
    }

}

class Observer {
    constructor(data) {
        this.observe(data)
    }

    observe(data) {
        /**
         * {
            person: {
                name: '小马哥',
                age: 18,
                fav: '姑娘'
            },
            msg: '学习MVVM实现原理',
            htmlStr: `<h1>好好学习</h1>`
           }
         */
        if (data && typeof data === 'object') {
            Object.keys(data).forEach(key => {
                this.defineReactive(data, key, data[key]);
            })
        }
    }

    defineReactive(obj, key, value) {
        //递归遍历
        this.observe(value);
        const dep = new Dep();
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: false,
            get() {
                //订阅数据,往Dep中添加观察者



                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set: (newVal) => {
                this.observe(newVal);
                if (newVal !== value) {
                    value = newVal
                }
                //告诉Dep通知变化
                dep.notify();
            }
        })
    }
}