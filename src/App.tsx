import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { log } from 'console';

//custom types
export interface Header {
  name: string;
  type: string;
}
export interface DynamoRoot {
  Put: Put
}

export interface Put {
  Item: Item,
  TableName: string
}

export interface Item {
  [key: string]: object
}

//helperfunction
export function convertCsvToDynamoObjects(
  lines: string[],
  tableName: string,
  headers: Header[]) : string {

  let dynamoObj: DynamoRoot[] = [];
  let dynamoS3Format : object[] = [];

  const data = lines.slice(1);
  

  console.log("---------begin copy-------------");
  
  //loop through each row
  data.forEach((d, i) => {
    // Regex: Split all commas, ignoring the ones inside strings
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
    const lineData = d.split(regex);
    
    let put: Put = { Item: {}, TableName: tableName}
    //loop through each column in the row
    lineData.forEach((l, index) => {
      
      const value = l.trim() 
      if (value.length === 0) return;
      
      const header = headers[index]
      put.Item[header.name] = {[header.type]: value}
    });

    dynamoS3Format.push(  {Item: put.Item } );
    console.log({Item: put.Item});
    
    
    if(Object.keys(put.Item).length > 0) dynamoObj[i] = { Put: put }

  });
  console.log("---------end copy-------------");

  
  
  // return [JSON.stringify(dynamoObj, null, '\t'), dynamoS3Format]
  return JSON.stringify(dynamoS3Format ,null ,'\t')
  return JSON.stringify(dynamoObj ,null ,'\t')
}

export function extractHeaderData(
  headersData: string) : Header[] {
  
  const regex = /([a-zA-Z_]*)\s\((\w)\)/g;

  let headers: Header[] = []
  let regexMatch;
  while ((regexMatch = regex.exec(headersData)) !== null) {
    
    // This is necessary to avoid infinite loops with zero-width matches
    if (regexMatch.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    let header: Header = { name: regexMatch[1], type: regexMatch[2]}
    headers.push(header);
  }
  return headers;
}

export function convertAndDownloadFile(
  fileName: string, 
  content: string) : void {

    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `${fileName}.json`);
    element.style.display = 'none';
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function App() {

  const [tableName, setTableName] = useState("testTableName");
  const [csvText, setCsvText] = useState("");
  const [jsonConverted, setJsonConverted] = useState("");
  const [s3ImportjsonConverted, sets3ImportJsonConverted] = useState("");

  

  function convertText() {
    const lines = csvText.split("\n");
    if (lines.length === 0 || tableName.trim().length === 0) return;

    
    
    // First line must be Headers data, Ie: "Pk (S)", "Sk (S)", "Name (S)", "Amount (N)"
    let headersArray = extractHeaderData(lines[0])
    let convertedText = convertCsvToDynamoObjects(lines, tableName, headersArray)
    
    setJsonConverted(convertedText)
  }

  function downloadJsonFile() {
    if (jsonConverted.trim().length === 0) return;

    convertAndDownloadFile(tableName, jsonConverted)
  }
  
  return (
    <div className="App">
      <header>Convert CSV to DynamoDB JSON</header>
      
      <div className="editor-boxes">
        <div className="left-editor">
          <div className="configs">
            <input type="text" placeholder="Table Name" 
              value={tableName} 
              onChange={(e) => setTableName(e.target.value)}
            />
            <button onClick={convertText}>Convert CSV</button>
          </div>
          <textarea
          cols={100}
          rows={10}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
        </div>
        <div className="right-editor">
          <div className="configs">
            <button onClick={downloadJsonFile}>Download JSON</button>
          </div>
          <textarea
            readOnly={true}
            value={jsonConverted}
            cols={100}
            rows={10}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
