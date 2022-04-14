import { JSDOM } from 'jsdom';

import * as Axios from 'axios';

const axios = Axios.default;

interface HeaderData {year: string, span: number};

async function getDomOfUrl(url: string){

  try {
    const rsp = await axios.get(url)
    if ( rsp.status === 200 ) {
      if (rsp.data) {
        return (new JSDOM(rsp.data)).window.document;
      } else {
        throw new Error( ` Empty payload`);
      }
    }  
    throw new Error( `status: expected 200, received ${rsp.status}`);
  } catch (err ) {
    console.log(`Error!: ${err}`);
  }
}

const url = 'https://www.oit.va.gov/Services/TRM/ToolPage.aspx?tid=11601';

getDomOfUrl(url)
.then ( document => {


  const removeJunk = (text: string) => text.replace(/(<([^>]+)>)/gi, "").trim();


  if (document) {
    const forecastTable = Array.from(
        document
        // There are multiple tables of the Forecast class, but the one we want has exactly two header rows
        .getElementsByClassName("Forecast"))
        .filter((ele) => ele.querySelector("thead")?.children.length === 2)
        .shift();   

    // Parse header, has exactly two rows, first one is for the years, the second is for quarters.  Each year column spans the quarter columns for that year
    const [yearRow, quarterRow] = forecastTable
        .querySelector("thead")
        ?.querySelectorAll(":scope > tr");
    const years = yearRow.querySelectorAll(":scope > th");
    const quarters = Array.from(quarterRow.querySelectorAll(":scope > th"))
    .slice(1)
    .map( q => removeJunk(q.innerHTML));       
    //
    
    /** parse body */
    const tableBody = forecastTable.querySelector("tbody");
    const tableRows = Array.from(tableBody.querySelectorAll(":scope > tr")).filter ( row => row.children.length === quarters.length + 1);

    const yearObj: HeaderData[]  = Array.from(years)
    .map((year) => {
        const rawSpan = year.getAttribute("colspan");
        const intSpan = rawSpan ? parseInt(rawSpan) : null;
        return { year: year.textContent.trim(), span: intSpan };
    });
    
    // Reduce 
    const temp: HeaderData[] = [];
    const dumbYears = yearObj.reduce((prev, curr) => {
        return [...prev, ...Array(curr.span).fill(curr.year)];
    }, temp);

    tableRows.forEach( row => {
        const cells = Array.from(row.querySelectorAll(":scope > td")) ?? [];
        const version = cells?.shift().innerHTML;
        const bigObj = cells.map((cell, cellIndex) => {
          const year = dumbYears[cellIndex];
          const currCell = {
            year,
            quarter: quarters[cellIndex],
            value: cell.innerHTML.replace(/(<([^>]+)>)/gi, "").trim()
          };
          return currCell;
        });
        const biggerObj = { version, quarters: bigObj };
        console.log(biggerObj);
      });
  }
})
.catch (err => {
  console.log(`API Failed: ${err}`);
})

console.log('hello!');