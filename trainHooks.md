# React新特性Hooks重构去哪儿网火车票PWA

该项目利用 [React](https://reactjs.org)、[Redux](https://redux.js.org/)等技术重构去哪儿网火车票，重度使用 [Hooks](https://reactjs.org/docs/hooks-intro.html) 重写视图组件。

## 用法

```sh
npm start
```

### 脚手架创建项目
> create-react-app train-ticket

### 启动项目
> npm start
> chrome 调试插件：
    react-developer-tools

> npm run eject  
>    释放出webpack配置文件
>    根组件下，多出config文件夹和scripts文件夹
>    且，该操作不可后退

### context
        context不能乱用，会影响组件之间的独立性；
        因此在一个组件中，最多只使用一个context就好，减少嵌套。
    
        const OnlineContext = createContext();
        const BatteryContext = createContext();
        > createContext()需要在provider及consumer组件中都调用执行一下
    
        定义时可进行嵌套，
        App组件的render中 进行嵌套
        <BatteryContext.Provider value={this.state.battery}>
            <OnlineContext.Provider value={this.state.online}>
                <Middle />
        接收：
        <BatteryContext.Consumer>
            {
                battery => (
                    <OnlineContext.Consumer>
                    {
                        online => (<h1>{battery},{online}</h1>)
                    }
                )
            }
    
        如果consumer组件向上找不到对应的provider，不会报错，会去读取createContext时设置的默认值，
        如果当时没有默认值，就不显示。
    
        这样consumer接收变量值的缺点：
        在return jsx中才能获得值 ，我们想要在jsx之前就先获得变量值，contextType。

### contextType
** 在只有一个context（即不嵌套）的组件 ** 中，使用contextType比使用consumer 简单的多。

        const BatteryContext = createContext()
        在该 组件中，定义一个静态变量：
>        static contextType = BatteryContext;
        render中只需const battery = this.context;即可获得context中变量值

        provider 还是必要的。

### lazy()
        import { lazy } from 'react' 
        lazy()的返回就是一个 react 组件。
    
        const About = lazy(() => import(/* webpackChunkName: "about" */ './Abount.jsx'));
        此时直接 在render()中使用About组件会报错。
        使用 lazy（）会存在一个渲染空档，需要Suspense组件配合。

### Suspense 组件
        return(
            <div>
                <Suspense fallback = {<Loading />}> 
                    <About></About>
                </Suspense>
            </div>
        )
### pureComponent
    所有父组件向子组件中传递的值都需要满足！！！！！

    继承 pureComponent 实现 子组件 ，会进行 父组件向 子组件 传入数据的 浅比较；
    相当于子组件中  进行了shouldComponentUpdate（）；
    也就是传递进来的值变了，子组件就会进行刷新，重新渲染。
    
    如果父组件向子组件 传入一个复杂数据类型数据，
    *其中属性变了，*
    
    就不会比较，不会重新渲染。
    person{age：1}；
    person.age++
    将person传递给子组件，
    父组件事件触发person.age变化，并不会触发子组件重新渲染
    子组件显示的age认为初始传过来的person中的值。
    
    另外注意：
        在调用子组件时传递 复杂数据值为 内联形式，会不断的触发 重新渲染。
>        <Foo cb={()={}}>
            每次刷新都是创建新的不同的复杂数据类型
        提前定义好callback方法，
            callback(){xxxx}
>            <Foo cb={this.callback}>
                这种方法仍然存在问题，callback的this指向问题，虽 无刷新渲染问题。
>            <Foo cb={this.callback.bind(this)}>
                如此绑定this，父组件每次刷新渲染就会 callback重新绑定this，
                实际上就是父组件每次渲染都会 重新  生成新的 函数对象。
                因此子组件每次都会渲染刷新。

### memo
>    import {memo} from 'react'
    对于无状态子组件，采用function的形式。便可以使用memo方法。进行子组件更新渲染的判断。
    原理就是上述purecomponent效果一致；
>        const Foo = memo( function Foo(props){
>            return <div>{props.person.age}</div>//也不会更新
>        })

## react Hook
所有hook 都以 use 开头

### useState（）
> import {useState} from 'react'

function App(){
>    const [count,setCount] = useState(0);
>    【1】//useState()返回一个数组，两项分别解构为count和setCount

    【2】//问题：useState怎么知道返回的是当前组件的count而不是其他组件的count
    //因为 js是单线程的，因此当useState被调用时只可能在唯一一个组件的上下文中；

   【3】 //问题：如果一个组件中有多个state，useState怎么知道那次调用返回哪个state呢
    const [name,setName] = useState('Mike');

    //useState按照其 第一次运行的次序返回  对应的state的
    // 注意，样例表明state 和 setState 都混乱
    比如：在第一次渲染之后，重新渲染时调换两个useState的顺序，便会产生混乱。
    
    //！！！！！组件重新渲染后，状态接收新值newState
        return (
        <button
            type="button"
            onClick = {()=>{setCount(count+1)}}
        >
        Click{count}
        </button>
    );
}

        let id = 0;
        function App (){
            let name,setName;
            let count ,setCount;
            id += 1;
            if(id & 1){
                //正序
                [count,setCount] = useState(0);//位置1
                [name,setName] = useState('Mike');//位置2
            }else{
                //反序
                [name,setName] = useState('Mike');
                [count,setCount] = useState(0);
            }
            return(
                <button
                    type="button"
                    onClick={() => {setCount(count + 1)    
                    // 对当前解构出count的useState对应的state值进行加1           
                    }}
                >
                Click:{count}----name:{name}
                </button>
            );
        }
        几个状态值： id             count      name
                    1               0          Mike
                    2//换顺序       Mike        1
                    3//再换         1           Mike1
                                    Mike1       2
            初始 按正序 从useState（0）中提取出 count 为 0 ，
            useState('Mike')中 name 为mike；
            点击第一次， 按反序解构，useState（）是按照第一次执行的顺序来的；
            ！！！！注意：要记住，每个state状态 对应在  第一次执行时所在位置的useState中，
            无论变量名变成什么。
            对应的state值一直保存在其中。
            所以此时进行结构，赋值号 右边 相当于 没有调换，只是左边进行了用新变量解构。
            ！！！！组件重新渲染后，状态接收新值newState。
            ！！！！setState 操作是在dom操作前（渲染前）完成的
    
            setCount与count同时解构出来，故，只对应count进行操作，具体操作为其传入的参数
            加码分析：
                let id = 0;
                function App (){
                    let name,setName;
                    let count ,setCount;
                    id += 1;
                    if(id & 1){
                        [count,setCount] = useState(0);
                        [name,setName] = useState('Mike');

>                                //state状态只与useState执行的顺序有关。
>                                //因此，此处的setCount对第一个state操作
>                                //setname 对第二个State进行操作
>                                //待渲染完毕后，会重新进行解构
                    }else{
                        [name,setName] = useState('Mike');
                        [count,setCount] = useState(0);

>                                //此处的setCount对第二个state操作
>                                //setname 对第一个State进行操作
                    }
                    return(
                        <button
                            type="button"
                            onClick={() => {setCount(count + 1)
                                            setName(name+2)}}
                        >
                        Click:{count}----name:{name}
                        </button>
                    );
                }
                //当时，setCount以及setName从哪个useState产生的state中解构出来，
                就是对那个state进行操作。
                该 加码样例 分析：
                首先，初始的count为0，name为mike，state01的值为0，state02的值为mike；
                1次点击，state01 的值进行 setCount操作+1，待渲染完毕后重新赋值给 name ：1；
                        state02的值进行setName 操作+2，待渲染完毕后，重新赋值给count ：Mike2；
                2次点击，此时重新解构过， state01 解构为[name,setName],因此会按照setName进行操作+2，
                                        state02 解构为[count,setCount],因此会按照setCount进行操作+1
    
        【4】useState调用的次数不能多也不能少，必须在组件的顶层调用，不能在条件语句里面,固定数量
        【6】useState默认值 只有第一次传入的有效。
            function App(){
                const defaultCount = props.defaultCount || 0;《1》
                const [count,setCount] = useState(defaultCount);《2》
                由《2》知，《1》处defaultCount 值只有在第一次渲染中才会用到，useState传入默认值只有第一次有效。每次App渲染都会重新执行《1》处逻辑，因此冗余。
            改进优化：
                    const [count,setCount] = useState(()=>{                     return  props.defaultCount || 0;});
            }
【5】
> npm i eslint-plugin-react-hooks -D

            安装完成后package.json中配置 eslintConfig;
                新增:  
                    plugins:["react-hooks"]
                    rules:{
                        "react-hooks/rules-of-hooks":"error"
                    }
【7】setCount不改变count值（基础数据类型）时组件不会重新渲染。
复杂数据类型的某个数形变化或者 重新赋值一个相同结构的对象 ，都会重新渲染


let id = 0; //根据渲染次数进行对应操作
function App (){
    let count ,setCount;
    id+=1;//每次重新渲染 id会加1
        [count,setCount] = useState(0);
    return(
        <button
            type="button"
            onClick={() => {setCount(count=1)
                }}
        >
        Click:{count}---id:{id}
        </button>
    );
}
第一次点击之前count为默认值0，
第一次点击，setcount将 count值变为1，此时组件重新渲染，id+1=》2
第二次点击，此时count已经为1，setCount也再将其赋值为1，不在重新渲染。id依旧为2.

### useEffect（）
优化了关注点分离。
> 标准上是在每次渲染之后调用
        因此第一次渲染那之后的调用相当于componentDidMount
        后面渲染之后的调用都相当于 componentDidUpdate
    
    useEffect(()=>{
        document.title = count;//count为 useState中结构出来的状态值；
    })
    useEffect(()=>{
    
        //绑定函数只会发生在第一次渲染后，并且在销毁组件前解绑
        window.addEventListener('resize',onResize,false)
>        return ()=>{
                window.removeEventListener('resize',onResize,false)
        }
    },[]);
useEffect 第二个参数非常重要！！！！！！依赖
        为一个可选的数组，根据数组中参数  控制useEffect的执行
>        只有数组的每一项都不变的情况下，useEffect才不会重新执行
        两个特例：1）不传数组，即每次渲染后都要执行
                2）传入空数组，因此useEffect只会在第一次渲染执行一次（比如绑定事件的逻辑只执行一次就可以）
    
        数组中每项 不变指的是？？？？？
            值（基本数据类型）不变,与之前useState触发组件重新渲染类似，
            count为1，重新赋值count为1，则不会导致重新渲染

##### cleanCallback 清除上一次副作用遗留下来的状态
        即 上述代码useEffect中， return 返回回调函数

### useContext（）
取代consumer
类似contextType的用法
    function Counter(){
>       const count = useContext((CountContext));
>       //static ContextType = CountContext;
>       //const count = this.context

        return (
            <div>
                {count}
            </div>
        )
    }
### useState所返回的setCount不必写入依赖
### useMemo（）
进行性能优化
类似 vue 计算属性
    memo 定义判断 一个 组件 是否重复渲染
    useMemo 定义判断一段 函数逻辑是否重复执行
    不能保证依赖不变化，就一定不会重新执行，因为要考虑到内存优化等
    
        const double =  useMemo(()=>{
            return count * 2
        },[count])
        ！！！！！注意：另一种书写形式
        const double = useMemo(count=>{ return count * 2 },[])
        //如此便可不将count置于后面依赖数组中。
    
        //第二个参数为所依赖的数组，不传则每次都执行，传入空数组则只执行一次
        //调用时机与useEffect 有巨大差异
        //useMemo的返回值 可直接 参与渲染，
        因此 是在渲染期间完成的
    
        避免循环依赖：
            即避免上述double作为另一个useMemo的判断参数
    
        const onClick = useMemo(()=>{
            return () => {
                console.log('Click')
            }
        },[])//只会执行一次，返回一个函数
        将此onClick 传给 Memo()包裹过的子组件，不会触发重新渲染，
        只执行一次，只创建一次 该函数
        若该onClick 去掉useMemo（）则会触发每次渲染,
        因为其 每次都会创建新的函数


### useCallback（）    
向子组件传递的函数方法需要useCallback 包裹一下；

如果useMemo返回的是一个函数，可以直接用useCallback替代，并省去其中顶层的函数
    useMemo(()=>fn)
    useCallback(fn)
    等价于:
        const onClick = useCallback(()=>{
            {console.log('Click')}
        },[])
        useCallback并不能阻止 创建新的函数，但是该函数不一定被返回，因此性能有所提升。
        不能保证依赖不变化，就一定不会重新执行，因为要考虑到内存优化等


### useRef()
作用：
    【1】获取自组件或者Dom节点的句柄；
    【2】《3》不同渲染周期之间共享数据的存储；（state赋值会触发重新渲染，ref不会）
【1】
        function App(props){
>           const counterRef = useRef();
            ...
            const onClick = useCallback(()=>{
                    {console.log('Click')}
>                    {counterRef.current}
             },[counterRef])
            return <div>
>                <Counter ref = {counterRef}  onClick={onClick}/>
                //若Counter 组件是函数组件会报错。
                函数组件没有实例，并不可以直接给它refs属性
                上述代码 若Counter是类声明有实例，点击时可
                打印Counter组件对象（counterRef.current）。
                可  获取到组件实例对象
                证明：函数形式组件暂时不能完全替代类组件
    
                如果counter组件定义时有一些函数成员，之后要调用
                则可以通过 couterRef.current.[函数成员]
    
            </div>
        }

【2】普通变量
#####        《1》类组件实例中挂载属性变量在hooks中对应写法
                    但是，ref不支持函数参数
           《2》 Hooks获取历史props和state也是通过useRef完成
    
        function App (){
            let it;
            useEffect(()=>{
                it = setInterval(()=>{
                    setCount(count=>{return count + 1})
                },1000)
            },[]);
            useEffect(()=>{
                if(count>10){
                    clearInterval(it)
                }
            })
        }
        该例子，计时到10并不会停止计时器；
        原因：
            App组件每次重新渲染（刷新）都会重新执行let it;
            而 启动定时器并进行赋值给it的useEffect只执行一次；
            故，但第二个useEffect 进行clearInterval 时，
            it已经不为定时器id了
        修改：利用useRef第二个特点，实现不同生命周期间共享数据
            function App (){
>                let it = useRef();

                useEffect(()=>{
>                    it.current = setInterval(()=>{
                        setCount(count=>{return count + 1})
                    },1000)
                },[]);
                useEffect(()=>{
                    if(count>10){
>                        clearInterval(it.current)
                    }
                })
            }
        如果要使用上一次渲染时的一些数据（包括state），只要置于ref中即可，在下次渲染时就可以获得。


### 自定义Hooks  (必须use开头)
解决类组件问题：方便复用状态逻辑
    与函数组件  只有输入输出的区别。根据其他区分不出二者。
    hook可以返回jsx参与渲染。
    
    抽离出逻辑，公用；
    
    function  useSize (){
        const [size,setSize] = useState({
            width:document.documentElement.clientWidth,
            height:document.documentElement.clientHeight
        })
        const onResize = useCallback(()=>{
            setSize({
                width:document.documentElement.clientWidth,
                height:document.documentElement.clientHeight
            })
        },[])
        useEffect(()=>{
            window.addEventListener('resize',onResize,false);
            return ()=>{
                window.removeEventListener('resize',onResize,false);
            }
        },[])
        return size; //返回的值
    }

之后就可以在各组件中直接 const size = useSize();

另一个样例：
            import { useCallback } from 'react';
            import { h0 } from './fp';

            export default function useNav(departDate, dispatch, prevDate, nextDate) {
                const isPrevDisabled = h0(departDate) <= h0();  //当前进行 选择车票的 天 ，最起码为今天
                const isNextDisabled = h0(departDate) - h0() > 20 * 86400 * 1000;  //买 未来20天的车票

                const prev = useCallback(() => {
                    if (isPrevDisabled) {
                        return;
                    }
                    dispatch(prevDate());
                }, [isPrevDisabled]);

                const next = useCallback(() => {
                    if (isNextDisabled) {
                        return;
                    }
                    dispatch(nextDate());
                }, [isNextDisabled]);

                return {
                    isPrevDisabled,
                    isNextDisabled,
                    prev,
                    next,
                };
            }
之后在所有组件中便可以
    const { isPrevDisabled, isNextDisabled, prev, next } = useNav(
        departDate,
        dispatch,
        prevDate,
        nextDate
    );
    来复用该块逻辑。


### Hooks 使用注意
    1. 仅仅在最顶层调用 hooks组件；（循环语句、条件语句等）
    比如useState，如果不在顶层，就可能调用混乱
    2.仅能在  react function component 和 custom hooks 中调用hooks



getSnapShotBeforeUpdate
componentDidCatch
getDerivedStateFromErrors 
这些生命周期函数暂时没有实现 hooks

### 函数组件没有forceUpdate 如何强制刷新渲染组件？
在 对应的组件中，
    const [updater,setUpdater] = useState(0);
    function forceUpdate(){
        setUpdater(updater=> updater+1)
    }
    执行 forceUpdate 间接强制刷新渲染了该组件

### Redux
    数据规范，使得任何更新都可被追踪
    状态容器 和 数据流管理

action 用于区分行为；


## PWA progressive web application
### Service worker（pwa的大脑）
        常驻内存运行；
        代理网络请求；
        依赖https；
> navigator.serviceWorker.register(外链脚本地址,选项对象).then()

serviceWorker脚本中不能访问dom以及window，localstorage等对象
            self 代表serviceworker的全局作用域对象
            其中能监听三种事件：
                self.addEventListener('install',e=>{
                    //install事件中，拉取并缓存必要的资源
                    e.waitUntil(new Promise(resolve=>{xxxx})) 
                    //延迟activate的执行
                    e.waitUntil(self.skipWaiting()) //搭配使用，self.skipWaiting()，停止旧的sw，开始新的sw
                    //相当于挤掉了旧版本的sw
                })  
                //一个新的serviceWorker脚本被安装后触发（内容有一点点不同，浏览器都会认定为两个不同的serviceworker）

                self.addEventListener('activate',e=>{
                    //activate事件，清除上一个sw版本留下的无用缓存
                    e.waitUntil(self.clients.claim)) 
                })
                self.addEventListener('fetch',e=>{
                    //fetch事件中捕获到请求后，去查询并返回缓存中的资源
                })  //捕获请求
            serviveWorker编程就是与serviceWorker的生命周期打交道；

### promise,fetch,Cache Api,Notification Api

cache api 是pwa的顶梁柱，web应用的离线运行；

        const CACHE_NAME = 'cache-v1'
        self.addEventListener('install',e=>{
            e.waitUntil(caches.open(CACHE_NAME).then(cache=>{
                cache.addAll([
                    '/',
                    './index.css'
                ])
            }))
        })
        caches可以直接获得
        caches.open()返回的是一个promise对象；打开缓存空间
        cache.addAll()参数为一个数据，为各个缓存项资源路径；
        资源列表不应该人工维护，容易出错。

        请求时查询
        self.addEventListener('fetch',e=>{
            e.responseWith(caches.open(CACHE_NAME).then(cache=>{
                return cache.match(e.request).then(response=>{
                    if(response){return response}
                    return fetch(e.request).then(response=>{
                        catch.put(e.request,response.clone());
                        return response;
                    })
                })
            }))
        })
        //cache.match()
        //cache.put()

        此时第一次访问会进行正常请求
        刷新页面重新请求，对应的项会直接从sw 加载
        NetWork 中会标注 index.css from servieceWorker
        此时关闭服务器，只要有缓存资源，依然可以打开页面

        self.addEventListener('activate',e=>{
        清理缓存的最佳位置
        //activate事件，清除上一个sw留下的无用缓存
                e.waitUntil(caches.keys().then(cacheNames=>{
                    return Promise.all(cacheNames.map(chacheName=>{
                        if(cacheName !== CACHE_NANE){
                            return caches.delete(cacheName)
                        }
                    }))
                })) 
        })

        //caches.keys()
        //caches.delete()

Notification Api
    页面上下文：
        浏览器控制台可直接找到Notification对象：
            Notification.permission:（获取当前权限设置）
                "default"
                "granted"
                "denied"
            //弹框设置通知权限
            Notification.requestPermission().then(permission=>console.log(permission))
            //创建通知
            new Notification(通知title字符串，{body：'this is from console'})
控制台 console 切换 上下文。。。
    serviceWorker上下文：
        查看当前权限设置：
            Notification.permission
        不能在sw上下文中设置通知权限。
        如果相应的页面不打开的话，该授权请求都没办法弹。
        因此只能在页面上下文中配置通知权限。
        先在页面上下文中配置好通知权限，
        再回到sw上下文中创建通知。
        self.registration.showNotification(通知title字符串，{body：'this is from console'})
            self.registration 就是sw在页面上下文中注册成    功后返回的navigator.serviceWorker.register  (xxxx).then(registration=>{  ... })

### workbox
create-react-app提供 workbox-webpack-plugin

## 去哪儿网 火车票查询项目
服务端用mock实现
####    全局依赖pm2，
        进程管理工具,可以用它来管理你的node进程，并查看node进程的状态，当然也支持性能监控，进程守护，负载均衡等功能
>   npm i -g pm2  //pm2需要全局安装
    进入项目根目录
        启动进程/应用  pm2 start bin/www 或 pm2 start app.js
        重命名进程/应用  pm2 start app.js --name wb123
        添加进程/应用 watch  pm2 start bin/www --watch
        结束进程/应用  pm2 stop www
        结束所有进程/应用  pm2 stop all
        删除进程/应用  pm2 delete www
        删除所有进程/应用  pm2 delete all
        列出所有进程/应用  pm2 list
        查看某个进程/应用具体情况  pm2 describe www
        查看进程/应用的资源消耗情况  pm2 monit
        查看pm2的日志  pm2 logs
        若要查看某个进程/应用的日志,使用  pm2 logs www
        重新启动进程/应用  pm2 restart www
        重新启动所有进程/应用  pm2 restart all

        依赖：
            "dayjs": "^1.8.13",
            "express": "^4.16.4",
            "mocker-api": "^1.7.4"
>       const apiMocker = require('mocker-api');
>       const app = express();
>       apiMocker(app, path.resolve('./mocker/mocker.js'))
//mocker.js
        module.exports = {
            'POST /rest/search'(req, res) {
                return res.json({
                    code: 0
                })
            },
            'GET /rest/cities': require('./rest/cities.json'),
            'GET /rest/search'(req, res) {
                const { key } = req.query;
                return res.json({
                    result: [{
                        key: '芜湖',
                        display: '芜湖'
                    }, {
                        key: '井冈山',
                        display: '井冈山',
                    }, {
                        key: '铁岭',
                        display: '铁岭',
                    }],
                    searchKey: key,
                });
            }
        }

## 前端开发：
    npm run eject 后改造 webpack配置，
        本项目为 多页面应用MPA，默认为SPA
    1.移出脚手架初始化的无用代码；
    2.创建4个页面
    3.改造webpack可以编译这4个页面

    依赖：
        normalize.css
        react-redux
        redux-thunk
        redux
        prop-types
        classnames
        dayjs
        urijs


>   npm i nomalize.css --save 
        import 'normalize.css/normalize.css' 
        
####    配置目录：
        public：
                index.html
                ticket.html
                order.html
                query.html
        src:
            index:
                    index.js
                    index.css
                    App.jsx
                    App.css
                    store.js
                    action.js
                    reducer.js
            order: //结构同index文件夹
            ticket: //结构同index文件夹
            query: //结构同index文件夹
####    配置webpack：
            webpack.config.js
               【1】 entry: (根据entry配置项 path.appIndexJs，
                找到path.js,添加其他页面对应的项，
                    appIndexJs: resolveModule(resolveApp, 'src/index/index'),
                    appQueryJs: resolveModule(resolveApp, 'src/query/index'),
                    appOrderJs: resolveModule(resolveApp, 'src/order/index'),
                    appticketJs: resolveModule(resolveApp, 'src/ticket/index')
                )
#####                由于此时是多页面应用，故entry不再是数组形式
                按照原来数组的格式配置每个入口项，对应到entry对象中的某个key值。
                entry: {
                    index:[paths.appIndexJs,isEnvDevelopment &&   require.resolve            ('react-dev-utils/  webpackHotDevClient').filter(Boolean)],
                    query:[paths.appQueryJs,isEnvDevelopment &&   require.resolve            ('react-dev-utils/  webpackHotDevClient').filter(Boolean)],
                    order:[paths.appOrderJs,isEnvDevelopment &&   require.resolve            ('react-dev-utils/  webpackHotDevClient').filter(Boolean)],
                    ticket:[paths.appTicketJs,isEnvDevelopment && require.resolve          ('react-dev-utils/  webpackHotDevClient').filter(Boolean)]
                },
                【2】多页面 对 htmlwebpackPlugin指定模板的修改
                  path.js中 增加配置其它页面
                        appHtml: resolveApp('public/index.html'),
                        appQuery: resolveApp('public/query.html'),
                        appOrder: resolveApp('public/order.html'),
                        appticket: resolveApp('public/ticket.html'),
                  webpack.config.js中找到plugins：
                    复制三个new HtmlWepackPlugin实例，并修改其中的
                    第二个参数的 ， template 项，并在其中增加filename项和chunks:['index'] 项。
    配置完毕尝试 build 编译。

####    拆分页面组件，任务拆解：
        1.react 视觉组件拆分，建立目录结构  (写好初始化代码)  ：
                common/Header.jsx & Header.css，
                index/Journey.jsx & Journey.css,
                     /DepartDate.jsx & DepartDate.css,
                     /HighSpeed.jsx & HighSpeed.css
                     /Submit.jsx & Submit.css
        2.redux store 状态设计
                store.js文加下：
                    createStore的第二个参数为 store 的具体结构；
                            createStore(
                                combineReducers(reducers),
                                {
                                    from:"北京",
                                    to:"上海",
                                    
                                    currentSelectingLeftCity: false,//城市选择浮层上选择的数据回填到from还是to
                                    isCitySelectorVisible:false,//城市选择浮层

                                    cityData:null, //城市选择浮层上所有的城市数据
                                    isLoadingCityData:false,//当前是否正在加载城市数据，节流
                                    
                                    isDateSelectorVisible:false,//时间选择浮层
                                    highSpeed:false,//是否选择了高铁动车
                                },
                                applyMiddleware(thunk)
                            );
        3.redux action/rerducer设计，包括type设计
            【1】action.js
                【1.1】type：
                *复杂项目通常使用常量来维护action type 更理想*
                    *export const ACTION_SET_TO = 'SET_TO'*
                    *export const ACTION_SET_IS_CITY_SELECTOR_VISIBLE = 'SET_IS_CITY_SELECTOR_VISIBLE' ;*  //注意 下划线 断词

                直接复制过来全部的state变量key值，对应每个key值设定actionCreator 和 type 
                            代码优雅，故区分 set 和 toggle 以及 change
                【1.2】actionCreator
                        //直接返回 对象类型的 action
                        export function setTo ( to ) {
                            return {
                                type:ACTION_SET_TO,
                                payload:to
                            }
                        }
                        //返回函数类型的action
                        export function exchangeFromTo () {
                            return (dispatch,getState) => {
                                const { from, to } = getState();
                                dispatch(setFrom(to));
                                dispatch(setTo( from ))
                            }
                        }
                        export function showCitySelector ( currentSelectingLeftCity ) {
                            return dispatch => {
                                //这种 actionCreator 需要出发多个action的 异步 操作  
                                //返回一个函数
                                //dispatch 调用 该 actionCreator 返回结果时会进行 typeof判断
                                //如果是 function 
                                //就会进行const action = actionCreator(payload)
                                //然后 action(dispatch,state)
                                dispatch({
                                    type:ACTION_SET_IS_CITY_SELECTOR_VISIBLE,
                                    payload:true
                                })
                                dispatch({
                                    type: ACTION_SET_CURRENT_SELECTING_LEFT_CITY,
                                    payload: currentSelectingLeftCity
                                })
                            }
                        }
                    【1.3】巧用缓存，localStorage 存储数据的时候，加一个过期 时间戳。
                            优化 取cityData 
                            export function fetchCityData(){
                                return (dispatch ,getState) => {
                                    const { isLoadingCityData } = getState();
                                    if( isLoadingCityData ) {
                                        return;
                                    }
                                    const cache = JSON.parse(
                                        localStorage.getItem('city_data_cache')|| '{}'
                                    );
                                    if(Date.now() < cache.expires){
                                        dispatch(setCityData( cache.data ))
                                        return;
                                    }
                                    //如果缓存中没有 相应的 数据，设定 isLoadingCityData 为 true
                                    //避免每次点浏览器刷新都重新请求数据
                                    dispatch( setIsLoadingCityData(true) );
                                    fetch('/rest/cities?_'+Date.now)
                                            .then(res=>res.json())
                                            .then(cityData =>{
                                                localStorage.setItem(
                                                    'city_data_cache',
                                                    JSON.stringify({
                                                        expires: Date.now() + 60 * 1000, //加1min
                                                        data: cityData,
                                                    })
                                                );
                                                dispatch(setIsLoadingCityData(false))
                                            })
                                            .catch(()=>{
                                                dispatch(setIsLoadingCityData(false))
                                            })
                                }
                            }
                【2】reducers.js
                        reducers 对应   每个type 进行 state数据处理；
                        此项目中，将每个部分操作的数据分成单独的子state，
                        因此，每部分需要对应自己单独的操作。
                                export default {
                                     from (state='北京',action){
                                         const { type,payload} = action;
                                         switch( type ){
                                             case ACTION_SET_FROM :
                                                 return payload;
                                             default:
                                         }
                                         return state
                                     },
                                     to (state='上海',action){
                                         const { type,payload} = action;
                                         switch( type ){
                                             case ACTION_SET_TO :
                                                 return payload;
                                             default:
                                         }
                                         return state
                                     }
                                }
#### prop-types
> npm i prop-types --save
> import PropsTypes from 'prop-types'

        export default function Header(props){
            //公共样式的具体使用时的布局不能写死，应在调用时加一层div等进行控制
            const { onBack, title } = props;
            return (<div></div>);
        }
**//函数式组件如何控制propTypes**
        **Header.propTypes** = {  //注意此处的propType第一个字母小写
            onBack: PropTypes.func.isRequired,
            title: PropTypes.string.isRequired
        }

                
#### state 和 action 都是在 顶层组件中 从redux(props) 中解构出来，稍作处理（useCallback）传递给各个目标子组件;

#### import { bindActionCreators } from 'redux';
                
#### svg 图片的引用：
       导入svg图片： import switchImg from './imgs/switch.svg';
       引用svg图片：<img src={switchImg} />

#### div等元素上动态 样式：
    【1】<div className={['city-selector',(!show)&&"hidden"].filter(Boolean).join(' ')}></div>
        .filter(Boolean) 去掉空值
    【2】 classnames 第三方插件
        npm i classnames --save
        import classnames from 'classnames';
            classnames 是一个函数；
                接收任意数量的参数，返回元素需要的 以空格作为分隔 的字符串；
                <div className={classnames('city-selector', **{ hidden: !show }**)}>
                注意，动态样式为 对象格式；
                也可以给classnames（）传入 数组 格式的type
    
#### 通常都在顶层  统一定义处理函数等；传递给子组件中调用

#### 根据右侧边栏的字母选择  以某个字母开头的地点section
    对左边 中相应的 字母li元素绑定自定义attribute
        <li className="city-li" key="title" data-cate={title}>
            {/* data-cate={title} 用于 右侧 字母点击跳转 */}
        
        当点击右侧的字母时，触发事件处理：
            const toAlpha = useCallback(alpha => {  
                // 右侧栏点击 字母进行跳转的处理函数
                //**属性选择器`[data-cate='${alpha}']`**
                //.scrollIntoView();
                //**Element.scrollIntoView()** 方法让当前的元素滚动到浏览器窗口的可视区域内
                document.querySelector(`[data-cate='${alpha}']`).scrollIntoView();
            }, []); 

#### dayjs 
>             npm i dayjs --save
            具体使用类似 moment 插件
>           dayjs(h0OfDepart).format('YYYY-MM-DD');
            格式化星期：
>                需要先 引入 import 'dayjs/locale/zh-cn';
                const d = dayjs(date);
                d.format('M月D日 ') + d.locale('zh-cn').format('ddd');

    
    使用 dayjs(date).valueOf() 将 字符串格式 的 时间戳 转换
    

#### 获取当前的 星期数
 const departDate = new Date(h0OfDepart);
 const weekString =
        '周' +
        ['日', '一', '二', '三', '四', '五', '六'][departDate.getDay()] +
        (isToday ? '(今天)' : '');
    getDay() 返回的是0123456
    getMonth() 返回的月份需要+1才为真正的月份。
#### 月历
    首先，now为当前月的 第一天的 零时刻；
            用当前月的第一天零食可来表示当前月
        const now = new Date();
        now.setHours(0); //清除小时
        now.setMinutes(0); //清除分钟
        now.setSeconds(0);  //清除秒
        now.setMilliseconds(0);
        now.setDate(1); //日期重置为当前的1号
    //下个月
        now.setMonth(now.getMonth() + 1);
        monthSequence.push(now.getTime());
    //下下个月
        now.setMonth(now.getMonth() + 1);
        monthSequence.push(now.getTime());    
    //统计出 当前月的每一天：
        const startDay = new Date(now);
        const currentDay = new Date(now);

        let days = [];
>        while (currentDay.getMonth() === startDay.getMonth()) { //保证当前月
            days.push(currentDay.getTime());
>            currentDay.setDate(currentDay.getDate() + 1);
        }

        //月历前面补齐空白，因为不是所有都从周一开始
        days = new Array(startDay.getDay() ? startDay.getDay() -1 : 6)  
            //根据是否为星期日进行判断，星期日0
                .fill(null)
                .concat(days);
    
        //月历后面补齐空白
        const lastDay = new Date(days[days.length-1]); //获取这个月的最后一天
        days = days.concat(
            //根据这最后一天是否为周日进行补齐
            new Array(lastDay.getDay() ? 7 - lastDay.getDay() : 0).fill(null)
        )
    //分成 周
        const weeks = [];

        for (let row = 0; row < days.length / 7; ++row) {
            //所有日期  以周为 单位分组
            //[[],[]
            const week = days.slice(row * 7, (row + 1) * 7);
            weeks.push(week);
        }


#### form 中 ，隐藏表单的使用
            <input type="hidden" name="date" value={departDateString} /> 
            {/* 方便  form 提交 
                <input type="hidden" /> 定义隐藏字段。
                隐藏字段对于用户是不可见的。隐藏字段通常会存储一个默认值，
                它们的值也可以由 JavaScript 进行修改。
            */}

#### 第三方插件 urijs
        npm i urijs --save
        import URI from 'urijs';
>     react 组件中解析url 参数  是**副作用**

##### 解析获取url中的参数
        const queries = URI.parseQuery(window.location.search);
        const { from, to, date, highSpeed } = queries;

##### 使用该插件配置 url项，用于请求
const url = new URI('/rest/query')
            .setSearch('from', from)
            .toString()

#### 每个选项选择后并不直接更新到redux中，而是要等点击确定后，统一提交
//创建 中间缓冲区
    //子组件操作都是缓存到该处state
    //  当 点击 确定时，再把各数据全部提交到 redux 中

    
    // const [
    //     localCheckedTicketTypes, //本地的版本传给子组件渲染和选择选项
    //     SetLocalCheckedTicketTypes,
    // ] = useState( () => return { 
    //      优化性能，使用函数形式参数， 组件只有在第一次渲染的时候才会被调用
    //         ...checkedTicketTypes,  
    // });

**将redux中的数据更新到 一个state中，作为中间缓存区**
 因此向子组件中传递的 就是对应state 的set操作

#### Slider 组件 
//sider 组件内部需要一个二级缓冲区，
//拖动滑块更新的是这个变量，
// 拖动完毕后是提交到上一级缓冲区
//避免了拖动滑块会 重新渲染 整个slider 组件的问题

    //二级缓冲区
    const [start, setStart] = useState(() => (currentStartHours / 24) * 100); 
    //初始化时  为百分比 0-100
    //百分比的 好处 即使屏幕大小发生变化也不会  出现问题
    const [end, setEnd] = useState(() => (currentEndHours / 24) * 100);
**另外，为了方便表示，将 时间问题转换为百分比问题**
useState也存在一些问题：
    整个 模态框点击 重置时 ，该部分不会被重置，因为useState的回调函数只能在初始化时调用

    解决：
        将每次传进来的值 都存储到一个 不受 生命周期控制的 变量中
        在组件中 进行判断，
        if (prevCurrentStartHours.current !== currentStartHours) {
            //处理上次传过来的 currentStartHours 与这次传过来的不一致的情况
            setStart((currentStartHours / 24) * 100);
            prevCurrentStartHours.current = currentStartHours;
        }
        if (prevCurrentEndHours.current !== currentEndHours) {
            setEnd((currentEndHours / 24) * 100);
            prevCurrentEndHours.current = currentEndHours;
        }

#### touch 事件：
    touchstart:
        event.targetTouches[0].pageX
    touchmove:
        event.targetTouches[0].pageX
#### window.getComputedStyle()
        //测量range 元素的 宽度
        rangeWidth.current = parseFloat(
            window.getComputedStyle(range.current).width
        );
        //Window.getComputedStyle()方法返回一个对象，
        //该对象在应用活动样式表并解析这些值可能包含的任何基本计算后报告元素的所有CSS属性的值
        //let style = window.getComputedStyle(element, [pseudoElt]);

### useReducer()

        function checkedReducer(state, action) {
            const { type, payload } = action;
            let newState;

            switch (type) {
                case 'toggle':
                    newState = { ...state };
                    if (payload in newState) {
                        delete newState[payload];
                    } else {
                        newState[payload] = true;
                    }
                    return newState;
                case 'reset':
                    return {};
                default:
            }
            return state;
        }
        const [
            localCheckedDepartStations,
            localCheckedDepartStationsDispatch,
        ] = useReducer(
            checkedReducer,
            checkedDepartStations,
            checkedDepartStations => {
                return {
                    ...checkedDepartStations,
                };
            }
        );
        {
            title: '出发车站',
            options: departStations,
            checkedMap: localCheckedDepartStations,
            //uptate:SetLocalCheckedDepartStations,
            dispatch: localCheckedDepartStationsDispatch,
        },
        调用：dispatch({payload:value,type:'toggle'})
        localCheckedDepartStationsDispatch({payload:value,type:'toggle'})

#### 数据联动，对多个reducer 配置 同一个 action type响应。
##### 两个reducer 互相配置对方的 项
checkedTrainTypes(state = {}, action) {
        const { type, payload } = action;
        let highSpeed;
        let newCheckedTrainTypes;

        switch (type) {
            case ACTION_SET_CHECKED_TRAIN_TYPES:
                return payload;
                case ACTION_SET_HIGH_SPEED: //数据联动
                //数据联动
                //一个 type 触发 多个reducer 中 项
                
                //当点击 只看高铁动车按钮 ，将使得 综合筛选中的 高铁动车项被选中
                //还要在 setHighSpeed中 做 反向关联
    
                    highSpeed = payload;
                    newCheckedTrainTypes = { ...state };
    
                    if (highSpeed) {
                        newCheckedTrainTypes[1] = true;
                        newCheckedTrainTypes[5] = true;
                    } else {
                        delete newCheckedTrainTypes[1];
                        delete newCheckedTrainTypes[5];
                    }   
                    return newCheckedTrainTypes;
            default:
        }
        return state;
},

highSpeed(state = false, action) {
        const { type, payload } = action;
        let checkedTrainTypes;

        switch (type) {
            case ACTION_SET_HIGH_SPEED:
                return payload;
            case ACTION_SET_CHECKED_TRAIN_TYPES:
                //数据联动
            //  当 综合筛选 中的 高铁动车项被选中，只看高铁动车按钮同样被选中触发
                checkedTrainTypes = payload;
                return Boolean(checkedTrainTypes[1] && checkedTrainTypes[5]);
            default:
        }
        return state;
    },

### props.children 类似vue 插槽
组件调用时，
                <Detail>
                    <span className="left"></span>
                    <span
                        className="schedule"
                        onClick={() => detailCbs.toggleIsScheduleVisible()}
                    >
                        时刻表
                    </span>
                    <span className="right"></span>
                </Detail>
在子组件中定义中 通过 props.children 替代；
        return (
        <div className="detail">
            <div className="content">
                <div className="left">
                </div>
                <div className="middle">
                    {/* props.children */}
                </div>
                <div className="right">
                </div>
            </div>
        </div>
    );

#### 知识点，设计 状态来控制 进程，避免提前渲染 导致的错误
每个变量 在redux 中都有初始值
比如下面 由父组件 传递给Detail 子组件 的duration变量；
初始值为null
真正的值要等待 fetch请求回来之后才会得到，
因此如果在propTypes 声明其 PropTypes.string.isRequired
传递进来null 空值 就会报错
解决：1. 去掉isRequired，如下
        Detail.propTypes = {
            durationStr: PropTypes.string, //不去掉isRequired'的话会报错，提示null

            //根本解决的办法是设定一个 isLoadingFetch状态来限制Detail组件的渲染
            //类似 parsedUrl
        };
      2.设定一个isLoadingFetch状态 来控制组件渲染
      isLoadingFetch 为false，就不进行渲染

#### 多个菜单同一时刻只有一个能展开  ----- 用一个变量来控制

    const [expandedIndex, setExpandedIndex] = useState(-1);
    //用于标记哪个状态的 seat 的 channel 是打开状态
    //并且 可以 控制多个seat每次 都只有一个seat 展开 chanel
    //控制在一个变量中
    const onToggle = useCallback(
        idx => {
            setExpandedIndex(idx === expandedIndex ? -1 : idx);
        },
        [expandedIndex]
    );
     return (
                <Seat
                    idx={idx}//index
                    onToggle={onToggle}
                    expanded={expandedIndex === idx}
                    {...ticket}
                    key={ticket.type}
                />
            );

####    PropTypes.oneOfType([PropTypes.string, PropTypes.number])

### 代码规范格式化
### 【1】eslint
package.json 下
#### 1 全局格式化
            "script" 下
                添加  "format":"eslint src/**/*.{jsx,js} --fix" 命令。 

            "eslintConfig" 下:

                "extends": "react-app", 改为：
                    "extends": ["eslint:recommended","react-app"]  //检查推荐的eslint 规则

                        //常见比如： 不允许在switch内部定义变量
                "rules" 复写规则：
                    "rules":{
                        "react/jsx-indent":["error",4] //jsx代码的 缩进，强制要求四个空白
                    }

#### 2 git commit 提交时 格式化
可以git hook 进行自动格式化，但比较麻烦，借用husky 和 lint-staged 两个依赖模块
###    npm i husky lint-staged -D
        需要package.json中做配置（一级项）
        "husky":{  //定义 git hooks
            "hooks":{
                "pre-commit":"lint-staged"   //提交的时候执行 "lint-staged"命令
            }
        },
        "lint-staged":{
            "*.{js,jsx}":[
                "eslint --fix",
                "git add"
            ]
        }
### .eslintugnore 文件
            罗列要 忽略执行 eslint的文件
            eg： src/serviceWorker.js

### 【2】prettier 比较武断
>   npm i prettier -D

修改方法【1】中全局格式化 的 script 下的 “format”命令
        改为：
            "format":"prettier src/**/*.{js,jsx,css,md} --write && 原来的指令"
        在 上述的 lint-staged 项下 添加 对css 及 md 格式文件的处理
            改为：
                "lint-staged":{
                    "*.{js,jsx}":[
                        "prettier --write",
                        "eslint --fix",
                        "git add"
                    ],
                    "*.{css,md}":[
                        "prettier --write",
                        "git add"
                    ]
                }

        创建 prettire.config.js //prettier 的配置文件
        module.exports = {
            tabWidth:4, //缩进
            singleQuote:true, //单引号双引号，默认双引号，此时单引号
            trailingComma:'es5',//末尾的逗号
        }
               
               
### 性能与部署

#### webpack-bundle-analyzer   
>   npm i  webpack-bundle-analyzer
在 webpack.config.js 文件下：
        引入插件，const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin ;  
        在 webpack 的 plugins 下 添加 配置：
        plugins：[
            new BundleAnalyzerPlugin(),
        ] 
执行：
>          npm start
                //开发环境下的分析各个依赖的体积等（自动打开8888端口号的页面）
>          npm build 
                //生产环境下的分析各个依赖的体积等（自动打开8888端口号的页面）
        对webpack-bundle-analyzer 进行配置，**构造函数传参**

        process.env.GENERATE_BUNDLE_ANALYZER === 'true' &&  //添加 环境变量项配置来避免 生成到线上环境中被用户访问到
        new BundleAnalyzerPlugin({
            openAnalyzer:false, //不打开 8888 页面
            analyzerMode:"static",//只生成静态的html文件
        }),

        在 build/report.html

#### 指定 静态文件 publicPath 
PUBLIC_URL = https://www.cdn.com/ npm run build
            //根据webpack.config.js 中 output 找 publicPath 找 paths.servedPath 即 paths.js文件中找servedPath
            // 找 getServedPath（） 中找 envPublicUrl 环境变量，最后const envPublicUrl = process.env.PUBLIC_URL;
            因此 ，才执行 上述命令
这样  build目录下 ，生成的 index.html等代码中，静态资源引入都会加入该指定的   publicPath

#### 或者直接修改output 下 publicPath的 值：
改为：
        publicPath:'production' !== process.env.NODE_ENV || 'true' === process.env.USE_LOCAL_FILES
                    ? '/'
                    : 'https://www.cdn.com/'
        ,

#### 使用pwa
        在 src 目录下 有serviceWorker.js文件
        对index，order，query等各个页面的 index.js中 导入该文件
        并添加代码
        if('production' === process.env.NODE_ENV){
            serviceWorker.register()
        }else{
            serviceWorker.unregister();
        }

#####  .eslintugnore 文件
            罗列要 忽略执行 eslint的文件
            eg： src/serviceWorker.js