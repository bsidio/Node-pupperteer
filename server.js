const puppeteer = require('puppeteer');
var fs = require('fs');
let converter = require('json-2-csv');

let jsonData=[];
const col=['name' ,`ENGG MATHS - I`,
    'ENGG MATHS Total',
    'APPLIED SCIENCE',
    'APPLIED SCIENCE Total ',
    'BASIC ELE',
    'BASIC ELE Total ',
    'APPLIED SCIENCE LAB',
    'BASIC ELE Lab',
    'COMPUTER CONCEPTS LAB',
    'total',
    'pc']

   
function exportToCsvFile(headersArray, dataJsonArray, filename) {

    converter.json2csvAsync(dataJsonArray, {prependHeader: false}).then(function (csv) {

    fs.exists(filename + '.csv', async function (exists) {

        if (!exists) {
            var newLine = "\r\n";
            var headers = ((headersArray ? headersArray : []) + newLine);

            exists= await createFileAsync(filename+ '.csv', headers);
        }

        if (exists) {
            fs.appendFile(filename + '.csv', csv, 'utf8', function (err) {
                if (err) {
                    console.log('error csv file either not saved or corrupted file saved.');
                } else {
                    console.log(filename + '.csv file appended successfully!');
                }
            });
        }
    });
}).catch(function (err) {
    console.log("error while converting from json to csv: " + err);
    return false;
});
}


function createFileAsync(filename, content) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(filename, content, 'utf8', function (err) {
            if (err) {
                console.log('error '+filename +' file either not saved or corrupted file saved.');
                resolve(0);
            } else {
                console.log(filename + ' file created successfully!');
                resolve(1);
            }
        });
    });
}


const zeroPad = (num, places) => String(num).padStart(places, '0')

async function getdata(){
   
    let data=[]
    const browser = await puppeteer.launch({headless:false});

    for (let i = 1; i < 60; i++) {
        let num= await zeroPad(i, 3)
        const reg = await '457cs19'+num;
        console.log(reg)
       
        const page = await browser.newPage();

    try{
        response =await page.goto('http://www.bteresults.net/MyResults.aspx', {waitUntil: 'load'});
       // const firstResponse = await page.waitForResponse('http://www.bteresults.net/MyResults.aspx');
        //const finalResponse = await page.waitForResponse(response => response.url() === 'http://www.bteresults.net/MyResults.aspx' && response.status() === 200);
        console.log(response.status())
        while(response.status()===503)
        {
            response=await page.reload()
        }
    }
    catch (e) {
        console.log('Err', e);

    }

    
    console.log(page.url());

    // Type our query into the search bar
    await page.focus('#ctl00_PageContents_txtRegNo');
    await page.keyboard.type(reg);

    // Submit form
    await page.click('#ctl00_PageContents_igbGetResult');

    // Wait for search results page to load
    const promise=page.waitForSelector('#ctl00_PageContents_gvwResult', {visible: true})
    await promise;

    //let table = document.querySelector("#ctl00_PageContents_gvwResult");
    
    //console.log(marks)
   // let table2=[]
   //const featureArticle = (await page.$('table tr td #ctl00_PageContents_lblResult')[1]);
//console.log(featureArticle)
//let data=[];

  const marks= await page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll('#ctl00_PageContents_gvwResult tr td'))
        
        return tds.map(td => td.innerHTML)

        

        
        });
     
     
     

      console.log('FOUND!', page.url());

const element = await page.$("#ctl00_PageContents_lblResult");
const text = await page.evaluate(element => element.innerText, element);
var obj={
    'name':text,
    'ENGG MATHS - I' : marks[2],
    'ENGG MATHS Total ': marks[4],
   'APPLIED SCIENCE' : marks[9],
   'APPLIED SCIENCE Total' : marks[11],

    'BASIC ELE' : marks[16],
    'BASIC ELE Total ': marks[18],

    'APPLIED SCIENCE LAB': marks[25],

   'BASIC ELE Lab':marks[32],

    'COMPUTER CONCEPTS LAB': marks[39],

   "total": Number(marks[4]) + Number(marks[11]) +Number(marks[18]) + Number(marks[25]) +Number(marks[32])+ Number(marks[39]),
   "pc":  (( (Number(marks[4]) + Number(marks[11]) +Number(marks[18]) + Number(marks[25]) +Number(marks[32])+ Number(marks[39])) / 600) * 100).toFixed(3),

  }
const newdata=await data
jsonData.push(obj)
newdata['name'] = await text
await page.close();
console.log(jsonData)

}

    await browser.close()


    exportToCsvFile(col, jsonData, 'data')


};


getdata().then()