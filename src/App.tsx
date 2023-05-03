import DoubleTreeMapperJS from "./components/DoubleTreeMapperJS";
import "./App.css";
import MyBlocklyComponent from "./components/MyBlocklyComponent";
import DragOutFields from "./components/DragOutFields";
import DragOutFieldsWithBlockly from "./components/DragOutFieldsWithBlockly";
import Final from "./components/Final";

export default function App() {
  return (
    <>
      {/* <DoubleTreeMapperJS /> */}
      <DragOutFields />
      <Final />
    </>
  );
}
