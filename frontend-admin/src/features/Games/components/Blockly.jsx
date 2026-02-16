import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setBlocklyData } from "../../../slices/gameSlice";
import { html } from "../helper/blockly";


function rgbaToHex(rgba) {
  if (!rgba || typeof rgba !== 'string') return '#4A90E2'; // default blue

  // Match rgba(r, g, b, a) or rgb(r, g, b)
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return '#4A90E2';

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  // Convert to hex
  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return '#' + toHex(r) + toHex(g) + toHex(b);
}

const BlocklyEditor = () => {
  const iframeRef = useRef(null);
  const dispatch = useDispatch();
  const { selectedQuestions, blocklyData, getGameInfobyIdApi } = useSelector(
    (state) => state.games
  );

  const playgroundName = getGameInfobyIdApi?.data?.response?.playgroundName || 'Untitled Playground';
  const playgroundNamedArray = [[playgroundName, playgroundName]]
  const taskData = selectedQuestions.map((ele) => ({
    id: ele.id,
    name: ele.name,
    radiusColor: rgbaToHex(ele.radiusColor),
  }));

  // console.log({ blocklyData });

  const xmlString = blocklyData.blocksXml || "";

  var isHighestIndexGreater = false;
  const highestIndex = Math.max(
    ...(xmlString.match(/task_(\d+)/g) || []).map((s) =>
      parseInt(s.split("_")[1])
    )
  );
  if (taskData.length <= highestIndex) {
    isHighestIndexGreater = true;
    // console.error("XML refers to undefined task index:", highestIndex);
  }

  // console.log({ taskData, selectedQuestions, isHighestIndexGreater });

  // Add this inside your useEffect for message handling

  const sendXMLToIframe = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "LOAD_XML",
          xml: xmlString, // can be empty or valid XML
        },
        "*"
      );
    }
  };
  useEffect(() => {
    let timeoutId;

    const handleMessage = (event) => {
      if (event.data.type === "BLOCKS_CHANGED") {
        // Debounce the console.log to avoid spamming
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          dispatch(
            setBlocklyData({
              blocksJson: event.data.json,
              blocksXml: event.data.xml,
            })
          );
        }, 300); // Wait 300ms after last change
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeoutId);
    };
  }, []);

  // console.log("Blocks changed:", blocklyData);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(html(taskData, xmlString, isHighestIndexGreater, playgroundNamedArray));
      doc.close();
    }
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full"
      title="Blockly Editor"
      onLoad={sendXMLToIframe}
    />
  );
};

export default BlocklyEditor;
