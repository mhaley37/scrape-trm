import { JSDOM } from 'jsdom';

import * as Axios from 'axios';

const axios = Axios.default;

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


export async function getReleaseDataFromTrm(tid: string | number, year?: number) {

    const url = `https://www.oit.va.gov/Services/TRM/ToolPage.aspx?tid=${tid + (year ? '&minYear='+year : '')}`;
    console.log(url);
    try {
        const document = await getDomOfUrl(url);
        const removeJunk = (text: string) => text.replace(/(<([^>]+)>)/gi, "").trim();
        const forecastTable = Array.from(
            document
            // There are multiple tables of the Forecast class, but the one we want has exactly two header rows
            .getElementsByClassName("Forecast"))
            .filter((ele) => ele.querySelector("thead")?.children.length === 2)
            .shift();   

        /**  Parse header, has exactly two rows, first one is for the years, the second is for quarters.  Each year column spans the quarter columns for that year */

        const [yearRow, quarterRow] = forecastTable
            .querySelector("thead")
            ?.querySelectorAll(":scope > tr");

        const yearSpanArr = Array.from(yearRow.querySelectorAll(":scope > th"))
            ?.map((year) => {
                const rawSpan = year.getAttribute("colspan");
                const intSpan = rawSpan ? parseInt(rawSpan) : 1;
                return { year: year.textContent.trim(), span: intSpan };
            })
            .reduce<string[]>((prev, curr) => {
                return [...prev, ...Array(curr.span).fill(curr.year.slice(2))];
            }, []);

        const quarters = Array.from(quarterRow.querySelectorAll(":scope > th"))
        // The first colum isn't a quarter, but a header for the release column, so remove
        .slice(1)
        .map( q => removeJunk(q.innerHTML));       

        //** Parse Body of table */
        const releaseBody = forecastTable.querySelector("tbody");
        /**
         * The table constists of rows that represents two different things:
         * 1. Quarerly decision data for a specific release (one column for each quarter)
         * 2. Additional decisions constraint information ( columns have no relation to the quarter and span many columns)
         * 
         * We only care about the actual release data now, so we can check that the number of columns match the quarters to see if we should include it ( have to decrement by 1 to account for the column header)
         */
        const releaseRows = releaseBody  ? Array.from(releaseBody.querySelectorAll(":scope > tr")).filter ( row => row.children.length-1 === quarters.length) : [];

        // Iterate through each release row, 
        const myObj = releaseRows.map( row => {
            const cells = Array.from(row.querySelectorAll(":scope > td"));
            const version = cells?.shift().innerHTML;
            const qDecisions = cells?.map((cell, cellIndex) => {
                return {
                    year: yearSpanArr[cellIndex],
                    quarter: quarters[cellIndex].slice(1),
                    decison: removeJunk(cell.innerHTML)
                };
            });
            return { version, quarters: qDecisions };
        });
        return myObj;
    } catch (err ) {
        console.error(`API Failed: ${err}`);
    };
}