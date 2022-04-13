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

const url = 'https://www.oit.va.gov/Services/TRM/ToolPage.aspx?tid=11601';

getDomOfUrl(url)
.then ( document => {
  if (document) {
    const tableElements = document.
    getElementById('content2')
    ?.getElementsByClassName('Forecast');
    if (tableElements) {
      const myTableArr = Array.from(tableElements);
      const table = myTableArr[myTableArr.length-1];
      console.log(table.children.item(0)?.innerHTML);
    }
  }
})
.catch (err => {
  console.log(`API Failed: ${err}`);
})

console.log('hello!');