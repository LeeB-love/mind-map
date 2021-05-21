import React, {useState, useEffect} from 'react';
import { RecoilRoot, atom, selector, useRecoilState, useRecoilValue, } from 'recoil';
import roundedRectangle from 'canvas-rounded-rectangle';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';


let nodeNum = 0;

const rectStyle = (x, y, width, height, strokeColor, fillColor, radius)=> {
  if(typeof radius === 'undefined'){
    radius = 10
  }
  
  return({
    top: x,
    left: y,
    width: width,
    height: height,
    stroke: strokeColor,
    fill: fillColor,
    borderRadius: radius,
    strokeWidth: 10,
    hover: {
        stroke: '#ff3333'
    }
  })
}

const Canvas = ()=>{

  let canvasRef = React.createRef();
  let canvas;
  let ctx;

  const [mPoint, setMPoint] = useRecoilState(mousePointState);
  const [node, setNode] = useRecoilState(nodeState);
  const [text, setText] = useRecoilState(textState);
  const [actNode, setActNode] = useRecoilState(activeNode);


  //텍스트 작성
  const drawText = (ctx, msg, x, y, font, color)=>{
    ctx.shadowColor = "transparent"
    ctx.font = '30px serif'
    ctx.fillText(msg, x+20, y+47);
  }
 

  // rounded rect 그리기
  const drawRoundRect = (ctx, x, y, width, height, color)=>{
    var rectX = x;
    var rectY = y;
    var rectWidth = width;
    var rectHeight = height;
    var cornerRadius = height-1;

    ctx.lineJoin = "round";
    ctx.lineWidth =cornerRadius;

    ctx.beginPath();
    // 색 설정
    ctx.strokeStyle = color;
    // ctx.fillStyle = color; 

    
    let roundRect = new Path2D();
    roundRect.rect(rectX+(cornerRadius/2), rectY+(cornerRadius/2), rectWidth-cornerRadius, rectHeight-cornerRadius);

    return roundRect;
  }

  //새로 생성된 노드의 관련 부모노드의 bbox end point를 업데이트 해줌
  const updateBbox = (m, x, y, arr)=>{
    if(m === 0){
      console.log(arr);
      return arr;
    }
    
    //node ID n의 부모노드 인덱스
    const index = arr.findIndex(obj => obj.num === m);
    //node[index]의 bbox 수정
    // 1) x, y 둘 다 부모노드 bbox 보다 크거나 같을 때
    if(x>=arr[index].bbox.x2 && y>=arr[index].bbox.y2){
      arr[index].bbox = {...arr[index].bbox, x2: x, y2: y}
    }

    // 2) x만 부모노드 bbox보다 클 때
    else if(x>=arr[index].bbox.x2 && y<arr[index].bbox.y2){
      arr[index].bbox = {...arr[index].bbox, x2: x}
    }

    // 3) y만 부모노드 bbox 보다 클 때
    else if(x<arr[index].bbox.x2 && y>=arr[index].bbox.y2){
      arr[index].bbox = {...arr[index].bbox, y2: y}
    }

    const m2 = arr[index].E[0];
    updateBbox(m2, x, y, arr);
  }


  // const updateBbox2 = (arr, m, x, y)=>{
  //   if(m === 0){
  //     console.log(arr);
  //     return arr;
  //   }
  //   const index = arr.findIndex(obj => obj.num === m);
  //   let tmp = arr.map(el => (el.num === m ? {...el, bbox: {...el.bbox, x2: x, y2: y}} : el));
  //   const m2 = arr[index].E[0];
  //   updateBbox2(tmp, m2, x, y);
  // }

  //노드 그리기
  const createNode = (ctx, x, y, pN)=>{
    // node ID
    nodeNum += 1;
    
    if(typeof pN === 'undefined'){
      pN = 0;
    }

    //도형 생성
    let firstNode = drawRoundRect(ctx, x, y, 200, 70, '#B6E3E9');
    // let rect = rectStyle(x, y, 200, 70, '#B6E3E9', '#B6E3E9', 40);
    // let firstNode = roundedRectangle(rect);
    // ctx.fillColor = rect.fill;

    let createdNode = {
      num: nodeNum, 
      path: firstNode,
      location: { x: x, y: y, width: 200, height: 70 }, 
      bbox: { x1: x, y1: y, x2: x+200, y2: y+70 }, 
      E: [pN, nodeNum]
    };

    // let tmp = updateBbox(pN, x, y, [...node]);
    // console.log(tmp)

    setNode(old =>{
      let tmp = old.map(el => (el.num === pN ? {...el, bbox: {...el.bbox, x2: x+200, y2: y+70 }} : el));
      return ([...tmp, createdNode])
    });

    ctx.globalCompositeOperation = 'destination-over'
    
    ctx.font = '30px serif'
    ctx.fillText('new', x+20, y+47);
    
    ctx.stroke(firstNode);

    return createdNode;
  }



  //그림자 생성
  const drawShadow = (ctx, x, y, color, blur)=>{
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor= color;
    ctx.shadowOffsetX = x;
    ctx.shadowOffsetY = y;
    ctx.shadowBlur = blur;
  }


  //최상위 노드 생성
  const handleCanvasDblclick = (e)=>{
    if(node[0]){
      return;
    }
    createNode(ctx, e.offsetX, e.offsetY);
  }


  //마우스 올린 노드 위치 찾기
  const searchNodeLoca = (x, y)=>{
    if(node.length===0){
      return;
    }
    for(let i=0; i<node.length; i++){
      let loca = node[i].location;
      if((x>loca.x && x<loca.x+loca.width)&&(y>loca.y && y<loca.y+loca.height)){
        return node[i];
      }
    }
  }

  //노드 활성화
  const changeNodeToAct = (ctx, node)=>{
    console.log("changeNodeToAct")
    setActNode(node.num);
    ctx.clearRect(node.location.x, node.location.y, node.location.width, node.location.height);
    let path = node.path;
    ctx.globalCompositeOperation = 'source-over';
    // 그림자 추가
    // drawShadow(ctx, 5, 5, "#BDBDBD", 10);
    ctx.lineWidth = node.location.height-1;
    //노드색상 변경
    ctx.strokeStyle = "#FADEE1"
    //그리기
    ctx.stroke(path);
  }

  const changeNodeToInact = (ctx, node)=>{
    console.log("changeNodeToInact");
    ctx.clearRect(node.location.x, node.location.y, node.location.width, node.location.height);
    let path = node.path;
    ctx.lineWidth = node.location.height-1;
    ctx.strokeStyle = '#B6E3E9';
    ctx.stroke(path);
    drawText(ctx, text.msg, node.location.x, node.location.y);
    setActNode(0);
  }



  //대충 캔버스 상에서 마우스 움직일 때 벌어지는 일들...
  const handleMouseMove = (e)=>{
    let x = e.offsetX;
    let y = e.offsetY;
    
    //커서가 올려진 노드
    let node = searchNodeLoca(x, y);
    setMPoint({x: x, y: y, node: node});
  }


  const handleOnClick = ()=>{
    console.log("handleOnClick")
  
    if(mPoint.node !== undefined){
      if(actNode !== 0){
        return;
      }
      changeNodeToAct(ctx, mPoint.node);
    }
    else{
      if(actNode == 0){
        return;
      }
      console.log("undefined");
      const index = node.findIndex(obj => obj.num === actNode);
      changeNodeToInact(ctx, node[index]);
    }
  }


  const handleKeyPress = (e)=>{
    console.log("handleKeyPress")
    
    if(actNode !== 0){
      const index = node.findIndex(obj => obj.num === actNode);

      if(text.width >= 135){
        // 텍스트 길이가 140이 넘으면 기존 도형을 지우고
        ctx.clearRect(node[index].location.x, node[index].location.y, node[index].location.width, node[index].location.height);    

        // 새 도형을 그리기
          let loca = node[index].location;

          let newNode = drawRoundRect(ctx, loca.x, loca.y, loca.width+(ctx.measureText(text.msg+e.key).width-text.width), 70, '#FADEE1')
          // drawShadow(ctx, 5, 5, "#BDBDBD", 10);
          ctx.stroke(newNode);
          

        // 기존 도형이 저장되어있던 node에서 기존 도형을 삭제하고 새 도형을 넣어서 업데이트.
        
        const node1 = node.slice();
        // node1[index].location.width = 100;

        if(node1.length == 1){
          node1.pop();
          node1.push({...node[index], path: newNode, location: {...node[index].location, width:node[index].location.width+(ctx.measureText(text.msg+e.key).width-text.width)}})
        }
        else{
          node1.splice(index,1);
          node1.push({...node[index], path: newNode, location: {...node[index].location, width:node[index].location.width+(ctx.measureText(text.msg+e.key).width-text.width)}})

          // let a;
          // let as = [1,2,3];
          // as = [...as,4]; => [1,2,3,4]
          // [a,...as] = as;
        }
        
        
        setNode(node1);
        setMPoint(mPoint=>({...mPoint, node: node[index]}))  
        console.log("node : ", node);      
        console.log("node[index]",node[index]) 
      }

      
      drawText(ctx, text.msg+e.key, node[index].location.x, node[index].location.y)
      setText(text=>({msg: text.msg+e.key, width: ctx.measureText(text.msg+e.key).width}));
      console.log(text);
    }
  }

  //기준이 되는 도형(위치 px, py, pw, ph)과 w, h 만큼 떨어져있음
  const drawEdge = (ctx, px, py, pw, ph, w, h)=>{
    ctx.beginPath();
    ctx.strokeStyle = '#ABABAB';
    ctx.lineWidth = 2;

    //시작점 : 부모노드 꼬리
    ctx.moveTo(px+pw, py+ph/2);
    //호 그리기 변곡점x, 변곡점 y, 끝점x, 끝점 y
    ctx.quadraticCurveTo(px+pw, (py+h)+ph/2, px+pw+w, (py+h)+ph/2)
    ctx.lineTo(px+pw+w, (py+h)+ph/2)
    ctx.stroke();
  }

  const createChildNode = (ctx, w, h)=>{
    console.log("createChildNode")
    if(actNode === 0){
      return;
    }
  
    //부모노드 index 검색
    const index = node.findIndex(obj => obj.num === actNode);
    let px = node[index].location.x;
    let py = node[index].location.y;
    let pw = node[index].location.width;
    let ph = node[index].location.height;


    //도형 만들고
    let node1 = createNode(ctx, px+pw+w, py+h, node[index].num);
    //부모노드 비활성화
    changeNodeToInact(ctx, node[index]);
    //활성화된 노드 바꾸기
    changeNodeToAct(ctx, node1);
    //링크 그리기
    drawEdge(ctx, px, py, pw, ph, w, h);
  }


  const createSiblingNode = (ctx, w, h)=>{
    console.log("createSiblingNode");
    if(actNode === 0){
      return;
    }

    //actNode의 형제니까.... 일단 활성화 되어있는 놈 부모를 찾아
    //actNode의 index
    const index = node.findIndex(obj => obj.num === actNode);
    //actNode의 부모 node index
    const pIndex = node.findIndex(obj => obj.num === node[index].E[0]);
    //자식노드 몇 개 딸려있는지 확인
    const arr = node.filter(tmp => tmp.E[0] === node[pIndex].num);

    //그리고 부모의 위치를 알아내
    let px = node[pIndex].location.x;
    let sy = node[index].location.y;
    let py = node[pIndex].location.y;
    let pw = node[pIndex].location.width;
    let ph = node[pIndex].location.height;

    //그 다음 새로운 노드를 만들기
    //도형 만들고
    let node1 = createNode(ctx, px+pw+w, sy+h, node[pIndex].num);
    //형제노드 비활성화
    changeNodeToInact(ctx, node[index]);
    //활성화된 노드 바꾸기
    changeNodeToAct(ctx, node1);
    //부모랑 새로운 노드를 이어주기
    drawEdge(ctx, px, py, pw, ph, w, h*arr.length);
  }

  useEffect(() => {
    console.log(node)
    console.log(actNode);
  }, [node, actNode])


  const handleKeyDown = (e)=>{
    console.log("handleKeyDown", e)
    e.preventDefault();
    if(e.code == 'Tab'){
      //자식 노드 만드는거(context, 부모노드로부터 x축으로 200만큼 떨어져있음, 부모노드로부터 y축으로 -20만큼 떨어져있음)
      createChildNode(ctx, 100, 0);
    }
    else if(e.code == 'Enter'){
      //형제 노드 만들기
      createSiblingNode(ctx, 100, 100);
    }
  }

  useEffect(() => {
    canvas = canvasRef.current;
    ctx = canvas.getContext("2d");

    canvas.addEventListener('dblclick',handleCanvasDblclick);
    canvas.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleOnClick);    
    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      canvas.removeEventListener('dblclick',handleCanvasDblclick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('click', handleOnClick);    
      document.removeEventListener('keypress', handleKeyPress);
    }
  }, [actNode, node, mPoint, text]);



  return(
    <canvas ref={canvasRef} className="canvas-board" width='1600' height='1000px'></canvas>
  )
}


const Main = ()=>{
  return(
    <div className='container'>
    <div className='menubar'> 
      <h1>마인드맵</h1>
      <div className='btn_group'>
        <button className='btn-newfile'>새 파일</button>
        <button className='btn-save'>저장하기</button>
        <button className='btn-open'>불러오기</button>
      </div>
    </div>
    <div>
      <input type="text" hidden/>
      <Canvas/>
    </div>
    </div>
  )
}

const App = ()=>{
  return(
    <RecoilRoot>
      <Main/>
    </RecoilRoot>
  )
}

let mousePointState = atom({
  key: 'mousePoint',
  default: { x: 0, y: 0, node: undefined }
})

let textState = atom({
  key: 'textState',
  default: {msg: '', width: 0}
})

let nodeState = atom({
  key: 'node',
  default: []
})

let activeNode = atom({
  key: 'activeNode',
  default: 0
})




ReactDOM.render(
    <App />,
  document.getElementById('root')
);

/*
  Atom : 고유한 키값과 기본값 가짐 - 키값을 사용해서 컴포넌트에서 Atom을 사용할 수 있음. 기본값 == 초기값
  const shippingState = atom({
    key: "shippingState",  ==> unique ID : 다른 atom이나 selector에서 사용되는 ID
    default: "seoul", ===> 기본값
  })
*/
/*
  useRecoilState() : 컴포넌트가 atom을 읽고 쓰게 하려면 useRecoilState(사용할 atom ID)를 사용하면 됨.
  const [shipping, setShipping] = useRecoilState(shippingState);

  배열의 첫번째 요소에 상태값이 들어가고 두번째 요소에 상태를 변경할 수 있는 함수가 들어간다는 것은 useState와 같지만, 
  차이점은 변경된 상태가 자동으로 전역으로 공유되는 것. useRecoilState를 사용한 Atom의 상태는 이 상태를 사용하고 있는
  다른 컴포넌트와 자동으로 공유 됨.
*/
/*
  useRecoilValue<T>(state: RecoilValue<T>) : 컴포넌트가 상태를 읽어오기만 한다. 상태를 변경하는 함수 없이 Atom 값만 받음
*/
/*
  Selector : Atom이나 다른 selector를 이용해서 새로운 데이터를 전달해줄 수 있음. 
  const totalState = selector({
    key: 'totalState',  ==> 고유 ID
    get: ({get}) => {     ==> 반환 값
      const shipping = get(shippingState);
      const cart = get(cartState);
      const subtotal = cart.reduce((acc, { name, price }) => acc + price, 0);
      const shippingTotal = destinations[shipping];
      return {
        subtotal,
        shipping: shippingTotalm,
        total: subtotal + shippingTotal,
      };
    },
  })
  사용할 컴포넌트에선 useRecoilValue를 이용해서 get에서 리턴되는 값을 받으면 됨. selector의 값은 읽기전용만 가능하다.
*/
