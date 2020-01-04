import React ,{useCallback,useEffect,useState, useRef}from 'react';
import { createAdd, createSet, createToggle, createRemove } from './action'
/**
 * action.js  action generator
 * export function createAdd(payload){
    return {
        type:'add',
        payload
    }
  }
 */
import './App.css';
function combineReducers(reducers){
  //reducers是一个对象
  //{todos(){},incrementCount(){}}
  return function reducer(state,action){
      const changed = {};
      for(let key in reducers){
        changed[key] = reducers[key](state[key],action)
      }
      return {
        ...state,
        ...changed
      }
  }

}

function bindActionCreators(actionCreators,dispatch){
  //actionCreators={ addTodos: createAdd }
  const ret = {};//存放 处理结果
  for(let key in actionCreators){
    ret[key] = function(...args){
      //返回的就是dispatch(actionGenerator())
      const actionCreator = actionCreators[key];
      const action = actionCreator(...args);//给action生成器传入数据
      dispatch(action)
    }
  }
  return ret
}
//用法
/**
 * <Control
 * {
 *  ...bindActionCreators({addTodo:createAdd},dispatch)
 * }
 * />
 * //向子组件中传递的便是addTodo()函数，
 * //dispatch（actionGenerator（））后的结果
 */

let idSeq = Date.now();

function Control(props){
  const { dispatch } = props;
  const inputRef = useRef();

  const onSubmit = (e) => {
    e.preventDefault();
    const newText = inputRef.current.value.trim();
    if(newText.length === 0){
      return;
    }
    // dispatch({
    //   type:'add',
    //   payload:{
    //       id:++idSeq,
    //       text:newText,
    //       complete:false
    //   }
    // })

    dispatch(createAdd({
      id:++idSeq,
      text:newText,
      complete:false
    }))
    inputRef.current.value = '';
  }
  return (<div className="control">
    <h1>
      todos
    </h1>
    <form onSubmit={onSubmit}>
      <input 
        type="text"
        ref={inputRef}
        className="new-todo" 
        placeholder="What needs to be done"
      />

    </form>
  </div>)
}


  

function TodoItem(props){
  const {
    todo:{
      id,text,complete
    },
    // removeTodos,
    // toggleTodos
    dispatch} = props;
  const onChange = () => {
    // dispatch({type:'toggle',payload:id})
    dispatch(createToggle(id))
  }
  const onRemove = () => {
    // removeTodos(id)
    // dispatch({type:'remove',payload:id})
    dispatch(createRemove(id))
  }
  return(
    <li>
      <input
         type="checkbox" 
         onChange={onChange}
         checked={complete}/>
        <span>{text}</span>
        <button onClick={onRemove}>&#xd7;</button>
    </li>
  )
}



function Todos(props){
  const{todos,dispatch} = props
  // const{todos,removeTodos,toggleTodos} = props
  return (
    <ul>
      {todos.map(todo=>{
        return<TodoItem
              key={todo.id}
              todo={todo}
              dispatch={dispatch}
              // removeTodos={removeTodos}
          />
      })}
    </ul>
  )
}



function TodoList() {
  //数据
  const [todos,setTodos] = useState([])
  const [incrementCount,setIncrementCount] = useState(0)
  
      //若  多个数据时  分为多个reducer进行处理
      //******************** */
      const reducers = {
        todos(state,action){
          const {type,payload} = action;
          switch(type){
            case "set":
              return payload;
            case "add":
              return [...state,payload];
                
            case "remove":
              return state.filter(item=>item.id!==payload);

            case "toggle":
              return state.map(item=>{
                return item.id===payload ?{
                  ...item,
                  complete:!item.complete
                } :
                item
              })
          }
          return state;
        },
        incrementCount(state,action){
          const {type} = action;
          switch(type){
            case "set":
              
            case "add":
              return state+1;      
        }
        return state
      }
      }
      const reducer = combineReducers(reducers)
      


      const dispatch = useCallback((action) => {
        const state = {
          todos,
          incrementCount
        };
        const setters = {
          todos:setTodos,
          incrementCount:setIncrementCount
        }
        if ("function"=== typeof action){
          //异步action逻辑
          action(dispatch,state );
          return;
        }

        const newState = reducer(state,action);

        for (let key in newState){ 
          //将 新的数据重新进行 存储
          setters[key](newState[key])
        }
      },[todos,incrementCount])

      useEffect(()=>{
        const todos = JSON.parse(localStorage.getItem("LS_KEY") || '[]')
        // setTodos(todos);
        //修改成：
        // dispatch({
        //   type:'set',
        //   payload:todos
        // })
        dispatch(createSet(todos))
      },[])
      useEffect(()=>{
        localStorage.setItem("LS_KEY",JSON.stringify(todos)) 
      },[todos])



  return (
    <div className="todo-list">
      <Control dispatch={dispatch}  />
      {/* <Control addTodo={addTodo}  /> */}
      <Todos todos={todos} dispatch={dispatch} />
      {/* <Todos todos={todos} removeTodos={removeTodos} toggleTodos={toggleTodos}/> */}
    </div>
  );
}

export default TodoList;
 



/**
1.初始时，在顶层组件中直接创建 操作方法，传递给子组件，方法中有操作数据的setTodos。
      const addTodo = useCallback((todo) => {
        // setTodos(todos=>[...todos,todo])
      },[])
      const removeTodos = useCallback((id) => {
        // setTodos(todos=>{
        //   return todos.filter(item=>item.id!==id) //一定要注意return
        // })
      },[])
    调用：
        <Control addTodo={addTodo}  /> 

2.接下来对1进行改进，在顶层组件中， 对所有的操作方法进行抽象，提取出dispatch方法，将所有操作放在dispatch中。
    const dispatch = useCallback((action) => {
        const{type,payload} = action;
            //对应每个action中的payload是不同的
        switch(type){
          case "add":
            setTodos(todos=>[...todos,payload])
            setIncrementCount(c => c+1)
            break;
          case "remove":
            setTodos(todos=>{
              return todos.filter(item=>item.id!==payload) //一定要注意return
            })
            break;
          default:
            break;
      })

      调用： <Control dispatch={dispatch}  />
        在子组件中，解构出传递进来的dispatch方法，输入对应的action={type,payload}进行调用；

3. 对2进行改进，此时的2中每个dispatch调用时，需要手动输入对象结构的action，，
    改进：抽离出单独的action.js文件，其中导出各个actionGenerator 函数。
    与2的区别在于：子组件Control 中 对dispatch的调用。

    import { createAdd, createRemove } from './action'
    dispatch(createAdd({
      id:++idSeq,
      text:newText,
      complete:false
    }))
  

4.此时 dispatch 逻辑 中 既有 对数据进行处理部分，又有setTodos等重新传回数据部分；
对之前的dispatch 逻辑进行抽离：
      分成  reducer 和 dispatch 两部分；
          【1】reducer 对 数据进行处理，纯函数；接收一个state和action 对state进行处理。

          【2】dispatch进行同步等其他处理；其中会调用reducer

            【1】  function reducer(state,action){
                //接收一个state数据和action，返回更新后的state
                
                const {todos,incrementCount} = state;  
                const {type,payload} = action;
                switch(type){
                  case "add":
                    return{
                      ...state,
                      todos:[...todos,payload],
                      incrementCount:incrementCount+1
                    }
                  case "remove":
                    return{
                      ...state,
                      todos:todos.filter(item=>item.id!==payload)
                    }
                  default:
                    break;
                }
              }

           【2】 const dispatch = useCallback((action) => {
                const state = {   //整理好调用reducer时要传的参数，方便进行数据处理
                  todos,  //useState产生
                  incrementCount  //useState产生
                };
                const setters = {
                  todos:setTodos,  //useState产生
                  incrementCount:setIncrementCount  //useState产生
                }
                if ("function"=== typeof action){
                  //异步action逻辑 ，处理action是一个函数类型的情况
                  action(dispatch,state );
                  return;
                }
                const newState = reducer(state,action);  //调用reducer 产生新的 state

                //dispatch 还需将数据进行  重新“存储” ，setTodos等操作
                for (let key in newState){ 
                  //将 新的数据重新进行 存储
                  setters[key](newState[key])
                }
            },[todos,incrementCount])

5. 上述有 多个数据 todos 和 incrementCount，分为多个reducer 进行处理
  拆分多个reducer ，也就是拆分 多个state，每个reducer只对应各自的state处理。
拆分reducer：
const reducers = {  

  //reducers是一个对象，里面对应多个子reducer，都是函数形式的

        todos(state,action){  // 处理的是 todos 这个数据，此处state是todos
          const {type,payload} = action;
          switch(type){
            case "add":
              return [...state,payload];
            case "remove":
              return state.filter(item=>item.id!==payload);
          }
          return state; 
           // 匹配不到 对应的操作就返回 原来的state
        },
        incrementCount(state,action){  //此处state是incrementCount
          const {type} = action;
          switch(type){
            case "set":
              
            case "add":
              return state+1;      
          }
          return state
        }

    }

    拆分完毕后，要合并到一起输出 reducer 方法 ，共dispatch内部调用 。
    combineReducer( reducers ) 方法。
    const reducer = combineReducers(reducers)
    combineReducer返回的 方法接受的是总的state，而不是部分（类似todos）。

    具体combineReducers逻辑实现：

    function combineReducers(reducers){
      //reducers是一个对象
      //{ todos(){}, incrementCount(){} }

      return function reducer(state,action){
          const changed = {};
          for(let key in reducers){
            changed[key] = reducers[key]( state[key] ,action)  //输入各自的state
          }
          return {  //输出 改变后的 总的 新 state
            ...state,
            ...changed
          }
      }
    }

  
6.此时，箱子组件传入的  仍为 dispatch，
    子组件中仍需 dispatch（ actionCreator（payload） ）进行调用；
      接下来处理这部分逻辑，将这部分逻辑进行绑定，在顶层组件中直接处理好，直接传给子组件。
      相当于用一层函数将这个操作包装一下，当接下来调用包装函数，该逻辑就会执行

        function bindActionCreators(actionCreators,dispatch){
          //actionCreators={ addTodos: createAdd }

          const ret = {};//存放 处理结果
          for(let key in actionCreators){

            ret[key] = function(...args){
              //函数内部执行dispatch(actionGenerator())

              const actionCreator = actionCreators[key];
              const action = actionCreator(...args);//给action生成器传入数据
              dispatch(action)
            }
          }
          return ret
          //ret 结构为{ 
                        addTodos(payload){xxxxxxxxx}，
                        removeTodos(payload){xxxxxx}
                      }
        }
        //用法
        
         * <Control
         * {
         *  ...bindActionCreators({addTodo:createAdd},dispatch)
         * }
         * />
         * //向子组件中传递的便是addTodo()函数，
         * 子组件内部调用addTodo()函数 
         * 就是 执行
         * dispatch（actionGenerator（））后的结果

 */