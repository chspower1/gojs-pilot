## 파일럿 코드 진행과정

- 싱글 트리 형태 구축 ( 더블트리는 미완료 )
- source와 target 맵핑 및 선긋기 완료
- 맵핑 결과 콘솔에 출력하기

## 해결해야 할 문제

- 더블 트리 형태 구축
  - GraphLinkModel을 가져가면서 Group Layout을 트리형태로...?
- 맵핑 관계 validation 추가
  - source는 1:n
  - target 1:1
- 맵핑 데이터를 바탕으로 react-blockly 블록 생성

## 수정 방향성

- 백엔드에서 GoJS에 맞는 nodeData로 변환하여 프론트에 전달 (필요한 필드가 확인되면 조민수 선임과 의논후 데이터 스키마 공유 예정)
  - 예시
  ```js
  [
    { key: "uuid", name: "Employee", parent: "parent uuid", group: -1 },
    { key: "uuid", name: "Enum", parent: "parent uuid", group: -1 },
    { key: "uuid", name: "hobbies", parent: "parent uuid", group: -1 },
  ];
  ```

