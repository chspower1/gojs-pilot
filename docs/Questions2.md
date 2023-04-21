현재 저는 저희 서비스에 넣을 다이어그램을 구현하고자 합니다.
저희가 구현하고자 하는 서비스를 설명드리면 2개의 폴더트리에서 서로 다른 폴더트리에 파일들을 맵핑 시키는 것입니다.(our_pruduct.jpg)
"https://gojs.net/latest/samples/treeMapper.html"와 굉장히 유사한 형태입니다.
하지만 저희는 많은 양의 데이터를 처리하는 경우도 있어 각 그룹마다 스크롤 기능이 추가되야 합니다.(https://gojs.net/extras/groupClippingScrollbarAlways.html)

샘플로 주신 저 두개를 참고해 react로 개발하려고 하고 있습니다.
구현 가능성을 확인하기위해 현재 테스트 버전을 만들고 있는데 여러 어려움이 있어 다시 질문드립니다.

문제에 대한 좀 더 정확한 배경을 설명하고자 제가 개발중인 코드 git 주소와 영상,사진 자료를 같이 첨부드립니다.
git repository : https://github.com/chspower1/gojs-pilot.git

모든 질문한 모든 현상은 src/components/DoubleTreeMapperJS.jsx에 담겨있습니다.
각 질문에 대해 확인할 수 있는 브렌치도 남겼습니다.

직전에 주셨던 당신의 친절한 대답이 저에게 큰 도움이 됐습니다.

1. 유효범위 이슈 (commit : a91fd5aba371fa084be49ce6370691c34aebb19f)
   두 개의 그룹이 있고 각 그룹마다 사이즈가 지정되어있습니다.
   그룹들 안에는 TreeView가 있고 그 TreeView는 그룹 사이즈보다 실제로 클 수도 있습니다.
   원래는 그룹내에서만 통제가 되어야 하는데 유효범위 밖에 벗어난 노드들이 전체 다이어그램의 크기에 영향을 주는 것 같습니다.
   이 문제를 해결하려고

   ```js
    const diagram = $(go.Diagram, {
    .
    .
    .
    allowVerticalScroll: false,
    allowHorizontalScroll: false,
   });
   ```

   옵션을 주어 다이어그램 자체에 스크롤이 생기지 못하게 하였습니다.
   이렇게 하니 또 다른 문제가 생겼는데 그룹내에서 스크롤 기능을 사용 못하게 되었습니다.
   제가 원하는 기능은 그룹은 개별적으로 스크롤이 가능하게 하고 다이어그램은 사이드 이슈가 생기지 않는것입니다.
   어떤 방법으로 또는 어떤 옵션을 주어야 가능할까요?

2. 선택 이슈 ( commit: 172bc8bf9dfeec0363380aad3ee21b89d8d9e4f0 )
   맨 처음 랜더 된 상태에서 그룹에 보이지 않는 하위 노드들은 폴더가 접히면 선택이 되지 않습니다.
   (전에 여쭤봤던 Resizing 시에는 잘 됩니다. 단! 폴더가 접히고 펼쳐지면서 발생한 범위만 안됩니다.)
   그런데 이상하게 데이터를 바꿔서(Change to New Data를 클릭해서)하면 또 잘 선택이 됩니다.
   무엇때문에 되는지 않되는지를 파악하지 못하겠으며,
   이 방법을 해결하기 위해 다이어그램 옵션에

   ```js
   PartResized: (e) => updateGroupInteraction(e.subject.part),
   TreeCollapsed: (e) => {
     console.log(e);
     handleTreeCollapseExpand(e);
     updateGroupInteraction(e.subject.part);
   },
   TreeExpanded: (e) => {
     handleTreeCollapseExpand(e);
     updateGroupInteraction(e.subject.part);
   },
   ```

   TreeCollapsed,TreeExpanded에 updateGroupInteraction함수를 추가해줬는데,
   PartResized에서 전달되는 event객체와 TreeCollapsed,TreeExpanded에서 전달되는 event 객체가 다른것 같습니다.
   그래서 이 방법을 해결하지 못하였고 어떻게 하면 해결할 수 있을지 알려주시겠습니까?

3. 스크롤 이슈 ( commit: 172bc8bf9dfeec0363380aad3ee21b89d8d9e4f0 )
   1번 문제를 해결하지 못해서 발생한 이슈지만 추가적으로 궁금한 점이 있어 여쭤봅니다.
   3번 영상과 같이 스크롤바의 한 부분을 클릭했을 때 그 범위 갈 수 있게끔 할 수는 없나요?
   Table Scroll에 관련된 스크롤 옵션이 너무 어렵습니다. 도와주세요 😢

4. 그룹 내 노드들 위치 이슈 ( commit: 172bc8bf9dfeec0363380aad3ee21b89d8d9e4f0 )
   스크롤을 어느정도 내린 상태에서 폴더를 열고 닫으면 맨 처음 위치로 돌아갑니다.
   저는 이것을 원치 않습니다.
   폴더를 접고 열어도 내가 지정한 위치에 그대로 머물고 싶습니다.
   어떻게 해야 할까요?

5. 기능 외적인 질문(typescript)
   저는 원래 typescript로 구현하려다가 막혀서 javascript로 다시 구현 중입니다.
   typescript로 gojs의 sample예제를 따라했는데 type 에러가 많이 나와 당황스러웠습니다.
   이것은 제가 실력이 부족해서 그런것인가요? 아님 typescript로 하는걸 추천하지 않으신가요?
   저는 웬만하면 오래걸리더라도 typescript로 구현하고 싶습니다.
   이것에 대한 당신의 판단과 가이드를 듣고 싶습니다.
