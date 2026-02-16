export const html = (
  taskData,
  xmlString,
  highestIndexOfXML = false,
  playgroundData = [
    ["1", "1"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4"],
    ["5", "5"]
  ]
) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Blockly Puzzle Editor</title>
  <script src="https://unpkg.com/blockly/blockly.min.js"></script>
  <style>
  body {
  margin:0;
  padding:0;
  }
   
    .container {
      display: flex;
      height: 100vh;
      box-sizing: border-box;
    }
    .blockly-container {
      flex: 1;
      background: white;
      overflow: hidden;
    }
    #blocklyDiv {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
 

  <div class="container">
    <div class="blockly-container">
      <div id="blocklyDiv"></div>
    </div>
  </div>

  <script>
    // TASK BLOCKS
    
    // Sample task data - Replace this with your actual questions from database

    const TASKS_DATA = ${JSON.stringify(taskData)};

    console.log({TASKS_DATA})

    // Create individual block for each task
    TASKS_DATA.forEach((task, index) => {
      Blockly.Blocks['task_' + index] = {
        init: function() {
          this.appendDummyInput()
            .appendField("📝 " + task.name);
          this.appendDummyInput()
            // .appendField("Points: " + task.points)
            // .appendField("Type: " + task.answerType);
          this.setOutput(true, null);
          this.setColour(task?.radiusColor || 120);
          this.setTooltip("Task ID: " + task.id);
          this.taskData = task;
        }
      };
    });
    
    Blockly.Blocks['all_tasks'] = {
      init: function() {
        this.appendDummyInput().appendField("all tasks");
        this.setOutput(true, null);
        this.setColour(200);
      }
    };

    Blockly.Blocks['tasks_range'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("tasks")
          .appendField(new Blockly.FieldNumber(1, 1, Infinity, 1), "FROM")
          .appendField("to")
          .appendField(new Blockly.FieldNumber(1, 1, Infinity, 1), "TO");
        this.setOutput(true, null);
        this.setColour(200);
      }
    };

    Blockly.Blocks['tasks_with_tag'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("tasks with tag")
          .appendField(new Blockly.FieldTextInput(""), "TAG");
        this.setOutput(true, null);
        this.setColour(200);
      }
    };

    // LOGIC BLOCKS
    Blockly.Blocks['when_then_block'] = {
      init: function() {
        this.appendDummyInput().appendField("🔀 When-Then");
        this.appendValueInput("CONDITION").setCheck("Boolean").appendField("Condition");
        this.appendStatementInput("DO").appendField("Then");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setColour(120);
      }
    };

    Blockly.Blocks['finished_block'] = {
      init: function() {
        this.appendValueInput("INPUT").setCheck(null);
        this.appendDummyInput().appendField("finished");
        this.setOutput(true, "Boolean");
        this.setColour(160);
      }
    };

    Blockly.Blocks['scan_qr'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("scan QR")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "QR_CHECK");
        this.setOutput(true, "Boolean");
        this.setColour(200);
      }
    };

    Blockly.Blocks['timer_conditions'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("Timer")
          .appendField(new Blockly.FieldDropdown([[">", ">"], ["<", "<"], ["=", "="], [">=", ">="], ["<=", "<="]], "OPERATOR"))
          .appendField(new Blockly.FieldNumber(0, 0, 23, 1), "HOURS").appendField("h")
          .appendField(new Blockly.FieldNumber(0, 0, 59, 1), "MINUTES").appendField("min")
          .appendField(new Blockly.FieldNumber(0, 0, 59, 1), "SECONDS").appendField("s");
        this.setOutput(true, "Boolean");
        this.setColour(230);
      }
    };

     Blockly.Blocks['answer_is'] = {
      init: function() {
        this.appendValueInput("TASK")
          .setCheck(null)
          .appendField("answer is")
          .appendField(new Blockly.FieldDropdown([["correct", "CORRECT"], ["incorrect", "INCORRECT"]]), "ANSWER")
          .appendField("for");
        this.setOutput(true, "Boolean");
        this.setColour(160);
        this.setInputsInline(true);
      }
    };

    Blockly.Blocks['score_check'] = {
      init: function() {
        this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["score", "SCORE"], ["odometer", "ODOMETER"]], this.validate), "METRIC")
          .appendField(new Blockly.FieldDropdown([
            [">", "GT"], 
            ["<", "LT"], 
            ["=", "EQ"], 
            ["≥", "GTE"], 
            ["≤", "LTE"]
          ], this.validate), "OPERATOR")
          .appendField(new Blockly.FieldNumber(0, 0, Infinity, 1), "VALUE");
        this.setOutput(true, "Boolean");
        this.setColour(260);
      }
    };

    Blockly.Blocks['logic_and_or'] = {
      init: function() {
        this.appendValueInput("A").setCheck("Boolean");
        this.appendValueInput("B").setCheck("Boolean")
          .appendField(new Blockly.FieldDropdown([["and", "AND"], ["or", "OR"]]), "OPERATOR");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setColour(210);
      }
    };

    Blockly.Blocks['logic_not'] = {
      init: function() {
        this.appendValueInput("BOOL").setCheck("Boolean").appendField("not");
        this.setOutput(true, "Boolean");
        this.setColour(210);
      }
    };

    Blockly.Blocks['answer_by_team'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("answer is")
          .appendField(new Blockly.FieldDropdown([["correct", "CORRECT"], ["incorrect", "INCORRECT"]]), "ANSWER")
          .appendField("by any team");
        this.setOutput(true, "Boolean");
        this.setColour(160);
      }
    };

    Blockly.Blocks['last_answer_is'] = {
      init: function() {
        this.appendValueInput("INPUT").setCheck(null);
        this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["last", "LAST"], ["first", "FIRST"]]), "WHICH")
          .appendField("answer is")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "CHECK");
        this.setOutput(true, "Boolean");
        this.setColour(160);
      }
    };

    Blockly.Blocks['odometer_after_finished'] = {
      init: function() {
        this.appendValueInput("EVENT")
          .setCheck(null)
          .appendField("odometer")
          .appendField(new Blockly.FieldDropdown([[">", ">"], ["<", "<"], ["=", "="], [">=", ">="], ["<=", "<="]], "OPERATOR"))
          .appendField(new Blockly.FieldNumber(0, 0, Infinity, 1), "VALUE")
          .appendField("(m) after");
        this.appendDummyInput().appendField("finished");
        this.setOutput(true, "Boolean");
        this.setColour(210);
      }
    };

    Blockly.Blocks['date_check'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("date")
          .appendField(new Blockly.FieldDropdown([[">", ">"], ["<", "<"], ["=", "="], [">=", ">="], ["<=", "<="]], "OPERATOR"));
        this.appendDummyInput().appendField(new Blockly.FieldTextInput("2025-01-01"), "DATE");
        this.appendDummyInput().appendField(new Blockly.FieldTextInput("10:00:00"), "TIME");
        this.appendDummyInput()
          .appendField("TZ:")
          .appendField(new Blockly.FieldNumber(0, -12, 14, 0.5), "TZ");
        this.setInputsInline(false);
        this.setOutput(true, "Boolean");
        this.setColour(300);
      }
    };

    Blockly.Blocks['on_track'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("on track")
          .appendField(new Blockly.FieldNumber(1, 1, Infinity, 1), "TRACK");
        this.setOutput(true, "Boolean");
        this.setColour(180);
      }
    };

    Blockly.Blocks['scan_barcode'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("scan barcode")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "BARCODE_CHECK");
        this.setOutput(true, "Boolean");
        this.setColour(200);
      }
    };

    Blockly.Blocks['timer_after_finished'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("timer")
          .appendField(new Blockly.FieldDropdown([
            [">", "GT"],
            ["<", "LT"],
            ["=", "EQ"],
            ["≥", "GTE"],
            ["≤", "LTE"]
          ]), "OPERATOR")
          .appendField(new Blockly.FieldNumber(0, 0, Infinity, 1), "SECONDS")
          .appendField("(s) after");
        this.appendValueInput("EVENT").setCheck(null);
        this.appendDummyInput().appendField("finished");
        this.setOutput(true, "Boolean");
        this.setColour(210);
        this.setInputsInline(true);
      }
    };

    Blockly.Blocks['timer_conditions'] = {
      init: function() {
        this.appendDummyInput()
          .appendField("Timer")
          .appendField(new Blockly.FieldDropdown([
            [">", "GT"], 
            ["<", "LT"], 
            ["=", "EQ"], 
            ["≥", "GTE"], 
            ["≤", "LTE"]
          ], this.validate), "OPERATOR")
          .appendField(new Blockly.FieldNumber(0, 0, 23, 1), "HOURS").appendField("h")
          .appendField(new Blockly.FieldNumber(0, 0, 59, 1), "MINUTES").appendField("min")
          .appendField(new Blockly.FieldNumber(0, 0, 60, 1), "SECONDS").appendField("s");
        this.setOutput(true, "Boolean");
        this.setColour(100);
      }
    };

    // ACTION BLOCKS
    Blockly.Blocks['show_on_map'] = {
      init: function() {
        this.appendDummyInput().appendField("show ");
        this.appendValueInput("INPUT").setCheck(null);
        this.appendDummyInput().appendField("on map");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      }
    };

    Blockly.Blocks['show_tasks_on_playground'] = {
      init: function() {
        this.appendDummyInput().appendField("show ");
        this.appendValueInput("INPUT").setCheck(null);
        this.appendDummyInput()
          .appendField("on playground")
          .appendField(new Blockly.FieldDropdown(${JSON.stringify(playgroundData)}), "PLAYGROUND");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
        this.setInputsInline(true);
      }
    };

    Blockly.Blocks['show_in_list'] = {
      init: function() {
        this.appendDummyInput().appendField("show ");
        this.appendValueInput("INPUT").setCheck(null);
        this.appendDummyInput().appendField("in list");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      }
    };

    Blockly.Blocks['open_for_answering'] = {
      init: function() {
        this.appendDummyInput().appendField("open");
        this.appendValueInput("INPUT").setCheck(null);
        this.appendDummyInput().appendField("for answering");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      }
    };

    Blockly.Blocks['finish_action'] = {
      init: function() {
        this.appendDummyInput().appendField("🏁 finish");
        this.setPreviousStatement(true, null);
        this.setColour(160);
      }
    };

    Blockly.Blocks['deactivate_action'] = {
      init: function() {
        this.appendDummyInput().appendField("Deactivate");
        this.appendValueInput("INPUT").setCheck(null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(160);
      }
    };

    // TOOLBOX
    const toolbox = {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: '📋 Tasks',
          colour: '210',
          contents: [
            { kind: 'block', type: 'all_tasks' },
            { kind: 'block', type: 'tasks_range' },
            { kind: 'block', type: 'tasks_with_tag' },
            ...TASKS_DATA.map((task, index) => ({
              kind: 'block',
              type: 'task_' + index
            }))
          ]
        },
        {
          kind: 'category',
          name: '🔀 Logic',
          colour: '120',
          contents: [
            { kind: 'block', type: 'when_then_block' },
            { kind: 'block', type: 'finished_block' },
            // { kind: 'block', type: 'scan_qr' },
            { kind: 'block', type: 'timer_conditions' },
            { kind: 'block', type: 'answer_is' },
            // { kind: 'block', type: 'answer_by_team' },
            // { kind: 'block', type: 'last_answer_is' },
            { kind: 'block', type: 'timer_after_finished' },
            { kind: 'block', type: 'score_check' },
            // { kind: 'block', type: 'date_check' },
            { kind: 'block', type: 'logic_and_or' },
            { kind: 'block', type: 'logic_not' },
          ]
        },
        {
          kind: 'category',
          name: '⚡ Actions',
          colour: '290',
          contents: [
            { kind: 'block', type: 'show_on_map' },
            { kind: 'block', type: 'show_in_list' },
            { kind: 'block', type: 'show_tasks_on_playground' },
            { kind: 'block', type: 'open_for_answering' },
            { kind: 'block', type: 'finish_action' },
            { kind: 'block', type: 'deactivate_action' }
          ]
        }
      ]
    };

    // INITIALIZE WORKSPACE
    const workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolbox,
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
      trashcan: true,
      scrollbars: true
    });

    // CONVERT BLOCK TO GAME ENGINE FORMAT (non-recursive for when_then)
    function blockToGameEngine(block, skipNext = false) {
      if (!block) return null;

      const type = block.type;

      // Task reference blocks
      if (type.startsWith('task_') && !isNaN(type.split('_')[1])) {
        const taskIndex = parseInt(type.split('_')[1]);
        const task = TASKS_DATA[taskIndex];
        if (task) {
          return {
            type: 'task',
            id: task.id,
            name: task.name,
            points: task.points,
            answerType: task.answerType
          };
        }
      }

      if (type === 'tasks_range') {
        return {
          type: 'tasks_range',
          start: block.getFieldValue('FROM'),
          end: block.getFieldValue('TO')
        };
      }

      if (type === 'all_tasks') {
        return { type: 'all_tasks' };
      }

      if (type === 'tasks_with_tag') {
        return {
          type: 'tasks_with_tag',
          tag: block.getFieldValue('TAG')
        };
      }

      // Condition blocks
      if (type === 'scan_qr') {
        return {
          type: 'qr',
          value: 'qrcode1'
        };
      }

      if (type === 'finished_block') {
        const inputBlock = block.getInputTargetBlock('INPUT');
        return {
          type: 'task_finished',
          task: blockToGameEngine(inputBlock)
        };
      }

      if (type === 'answer_is') {
        const taskBlock = block.getInputTargetBlock('TASK');
        const how = block.getFieldValue('ANSWER');
        return {
          type: 'answer_is',
          task: blockToGameEngine(taskBlock),
          isCorrect: how === 'CORRECT' ? true : false
        };
      }

      if (type === 'score_check') {
        const operatorMap = {
          'GT': '>',
          'LT': '<',
          'EQ': '===',
          'GTE': '>=',
          'LTE': '<='
        };
        const operator = block.getFieldValue('OPERATOR');
        return {
          type: 'compare_variable',
          variable: block.getFieldValue('METRIC'),
          op: operatorMap[operator] || operator,
          value: block.getFieldValue('VALUE')
        };
      }

      if (type === 'timer_conditions') {
       const operatorMap = {
    'GT': '>',
    'LT': '<',
    'EQ': '===',
    'GTE': '>=',
    'LTE': '<='
  };
        const hours = block.getFieldValue('HOURS');
        const minutes = block.getFieldValue('MINUTES');
        const seconds = block.getFieldValue('SECONDS');
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        return {
          type: 'timer',
          op: operatorMap[block.getFieldValue('OPERATOR')] || block.getFieldValue('OPERATOR'),
          seconds: totalSeconds
        };
      }

      if (type === 'logic_and_or') {
        const blockA = block.getInputTargetBlock('A');
        const blockB = block.getInputTargetBlock('B');
        const operator = block.getFieldValue('OPERATOR');
        return {
          type: operator.toLowerCase(),
          conditions: [
            blockToGameEngine(blockA),
            blockToGameEngine(blockB)
          ]
        };
      }

      if (type === 'logic_not') {
        const boolBlock = block.getInputTargetBlock('BOOL');
        return {
          type: 'not',
          condition: blockToGameEngine(boolBlock)
        };
      }

      if (type === 'timer_after_finished') {
  const operatorMap = {
    'GT': '>',
    'LT': '<',
    'EQ': '===',
    'GTE': '>=',
    'LTE': '<='
  };
  const taskBlock = block.getInputTargetBlock('EVENT');
  const operator = block.getFieldValue('OPERATOR');
  return {
    type: 'timer_after_finished',
    op: operatorMap[operator] || operator,
    seconds: block.getFieldValue('SECONDS'),
    task: blockToGameEngine(taskBlock)
  };
}

      // Action blocks
      if (type === 'show_on_map') {
        const inputBlock = block.getInputTargetBlock('INPUT');
        return {
          type: 'show_on_playground',
          index: 1,
          task: blockToGameEngine(inputBlock)
        };
      }

      if (type === 'show_tasks_on_playground') {
        const inputBlock = block.getInputTargetBlock('INPUT');
  //       const playgroundValue = block.getFieldValue('PLAYGROUND');
  // console.log('Playground field value:', playgroundValue);
  // console.log('Block type:', block.type);
  // console.log('All fields:', block.inputList);
        return {
          type: 'show_tasks_on_playground',
          playground: parseInt(block.getFieldValue('PLAYGROUND')),
          task: blockToGameEngine(inputBlock)
        };
      }

      if (type === 'show_in_list') {
        const inputBlock = block.getInputTargetBlock('INPUT');
        return {
          type: 'show_in_list',
          task: blockToGameEngine(inputBlock)
        };
      }

      if (type === 'open_for_answering') {
        const inputBlock = block.getInputTargetBlock('INPUT');
        return {
          type: 'activate',
          task: blockToGameEngine(inputBlock)
        };
      }

      if (type === 'finish_action') {
        return { type: 'finish' };
      }

      if (type === 'deactivate_action') {
        const inputBlock = block.getInputTargetBlock('INPUT');
        return {
          type: 'deactivate',
          task: blockToGameEngine(inputBlock)
        };
      }

      // When-then block - NO NEXT PROPERTY
      if (type === 'when_then_block') {
        const conditionBlock = block.getInputTargetBlock('CONDITION');
        const doBlock = block.getInputTargetBlock('DO');
        
        const result = {
          type: 'when_then',
          condition: blockToGameEngine(conditionBlock),
          do: []
        };

        // Collect all actions in the DO block
        let currentDoBlock = doBlock;
        while (currentDoBlock) {
          const action = blockToGameEngine(currentDoBlock);
          if (action) result.do.push(action);
          currentDoBlock = currentDoBlock.getNextBlock();
        }

        return result;
      }

      return null;
    }

     // UPDATE OUTPUT - Generate both JSON and XML
    function updateCode() {
      const topBlocks = workspace.getTopBlocks(false);
      const flow = [];
      
      // Iterate through all top-level block chains
      topBlocks.forEach(block => {
        let current = block;
        // Walk through the chain of connected blocks
        while (current) {
          const flowItem = blockToGameEngine(current);
          if (flowItem) {
            flow.push(flowItem);
          }
          // Move to the next block in the chain
          current = current.getNextBlock();
        }
      });
      
      const gameJSON = { flow: flow };

      // Generate XML
      const xml = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToPrettyText(xml);

      // Send both JSON and XML to parent React component
      window.parent.postMessage({
        type: "BLOCKS_CHANGED",
        json: gameJSON,
        xml: xmlText
      }, "*");
    }

    workspace.addChangeListener(updateCode);

   
   function loadXMLToWorkspace(xmlInput) {
  try {
    // If nothing is passed, just return
    if (!xmlInput || xmlInput === "") return;

    let xmlDoc;

    // If it's a string → parse it
    if (typeof xmlInput === "string") {
      const parser = new DOMParser();
      xmlDoc = parser.parseFromString(xmlInput, "text/xml");

      const parserError = xmlDoc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
        console.error("XML Parse Error:", xmlDoc.documentElement.textContent);
        alert("❌ Error: Invalid XML string");
        return;
      }
    }
    // If it's already an XML document or element → use it directly
    else if (xmlInput instanceof Document || xmlInput instanceof Element) {
      xmlDoc = xmlInput;
    } else {
      console.warn("⚠️ Invalid XML input type — skipping load");
      return;
    }

    // Clear workspace and load XML
    workspace.clear();
    Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
    alert("✅ BLOCKY Diagram loaded Successfully.!");
  } catch (error) {
    console.error("Load error:", error);
    alert("❌ Error loading XML: " + error.message);
  }
}

// LOAD XML FROM FILE
    function handleXMLLoad(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const xmlText = e.target.result;
          const parser = new DOMParser();
          const xml = parser.parseFromString(xmlText, 'text/xml');
          
          const parserError = xml.getElementsByTagName('parsererror');
          if (parserError.length > 0) {
            alert('❌ Error: Invalid XML file');
            console.error('XML Parse Error:', xml.documentElement.textContent);
            return;
          }
          
          workspace.clear();
          Blockly.Xml.domToWorkspace(xml.documentElement, workspace);
          alert('✅ BLOCKY Diagram loaded Successfully.!');
        } catch (error) {
          console.error('Load error:', error);
          alert('❌ Error loading XML: ' + error.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    }

window.addEventListener("message", (event) => {
    if (event.data.type === "LOAD_XML" && ${!highestIndexOfXML}) {
    setTimeout(()=>{
      loadXMLToWorkspace(event.data.xml);
      },1000)
    }
  });

  </script>
</body>
</html>`;
