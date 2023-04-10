# GoJS

## 0강

- go.GraphObject.make를 통해 컨트롤? 함수를 선언
- nodeDataArray : 노드들의 정보
- linkDataArray : 맵핑관계의 정보
- nodeTemplate : 노드들의 속성
- linkTemplate : 맵핑 화살표의 속성

## 3강

diagram.add 로 추가 할수 있지만 이렇게 되면 구조적으로 복잡해지고 알아보기가 어려움
그래서, 다이어그램 모델을 사용하는 것이 좋음

- 다이어그램 모델이란?
  Part Data를 관리하고 Diagram Template는 Part 모양과 동작을 관리함.

diagram Model은 nodeDataArray,linkDataArray를 받음,
Model에 저장된 데이터는 gojs Node 및 Link가 아닌 Javascript 객체임(데이터임).

- 모델의 종류

  - Default Model
  - GraphLinksModel
  - 별도의 링크 데이터 개체를 사용하여 링크 관계를 지원함.
  - 링크 데이터는 "category" 이외에 "from"과 "to" 속성을 지원함
  - TreeModel
  - 별도의 linkDataArray가 지정되 않음
  - 대신 "parent"라는 노드 데이터 개체에 대해 지원되는 새로운 속성이 있음
  - Tree처럼 보이기 위해 Diagram.layout을 TreeLayout으로 지정할 수 있음

- 모델 수정

  - Add node data : `Model.addNodeData(<node data object>)`
  - Remove node data : `Model.removeNodeData(<node data objecct>)`
  - Find a node data object : `Model.findNodeDataForKey(<key>)`
  - Set data property : `Model.set(<data onject>,<target property>,<property value>)`

- 저장 / 불러오기
  - Get nidek JSON : `Model.toJson()`
  - Load Model from JSON : `Model.fromJson(<valid JSON Model string>)`

## 4강 (Building Parts : Templates)


## 6강

- gojs 대신 gojs-debug 라이브러리를 사용하면 디버깅

## 맵핑 시키는 기능

https://gojs.net/latest/learn/interactivity.html
