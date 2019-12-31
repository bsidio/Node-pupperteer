const puppeteer = require('puppeteer');
var fs = require('fs');
let converter = require('json-2-csv');

//Create Empty Json
let jsonData=[];

//Define Headers Here
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

//Function to Convert Json to CSV and save files
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

//The register num in the form required Padding Remove if not necessary
const zeroPad = (num, places) => String(num).padStart(places, '0')

//Function for scraping
async function getdata(){
   
    let data=[]
    const browser = await puppeteer.launch({headless:false});

    // LOOP 
    for (let i = 1; i < 60; i++) {
        let num= await zeroPad(i, 3)
        //Create Dynamic variable to insert into form
        const reg = await '457cs19'+num;
        console.log(reg)
       
        const page = await browser.newPage();

    try{

        response =await page.goto('http://www.bteresults.net/MyResults.aspx', {waitUntil: 'load'});
      console.log(response.status())
      //The Site gives 503 error due to load. I implemented a reload function until 200 status is returned
        while(response.status()===503)
        {
            response=await page.reload()
        }
    }
    catch (e) {
        console.log('Err', e);

    }

    
    console.log(page.url());

    // Find the Form
    await page.focus('#ctl00_PageContents_txtRegNo');
    //Type the data into the form
    await page.keyboard.type(reg);

    // Submit form
    await page.click('#ctl00_PageContents_igbGetResult');

    // Wait for  results page to load
    const promise=page.waitForSelector('#ctl00_PageContents_gvwResult', {visible: true})
    await promise;

   
  const marks= await page.evaluate(() => {
      //Find the Table
        const tds = Array.from(document.querySelectorAll('#ctl00_PageContents_gvwResult tr td'))
        
        return tds.map(td => td.innerHTML)

        

        
        });
     
     
     

      console.log('FOUND!', page.url());

      //Other data that i wanted to save
const element = await page.$("#ctl00_PageContents_lblResult");
const text = await page.evaluate(element => element.innerText, element);

//Create a Json object
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

//Push the json object
jsonData.push(obj)
newdata['name'] = await text
await page.close();
console.log(jsonData)

}

    await browser.close()

    //Save the Json Array as CSV
    exportToCsvFile(col, jsonData, 'data')


};


getdata()