const axios = require('axios');
const { google } = require('googleapis');
require("dotenv").config();

const input = ['Shopify', 'WooCommerce',  'BigCommerce', 'Magento']
let output = [ ['Website Category'] ];

const API_KEY = process.env.API_KEY;
const Sheets_ID = process.env.Sheets_ID;

const grabTechnology = async (url) => {
    try {
        const response = await axios.get(`https://api.wappalyzer.com/v2/lookup?urls=${url}`, {
            headers: {
                "x-api-key": API_KEY
            }
        })
        return { status: response.status, siteTechnologies: response.data[0].technologies };
    } catch (error) {
        return { status: 400, siteTechnologies: "" };
    }
}

const assignCategory = async (url) => {

    const { status, siteTechnologies } = await grabTechnology(url);

    if (status === 200) {
        const numOfTechnologies = siteTechnologies.length
        for (let technology of siteTechnologies) {
        	if (input.includes(technology.name)) {
        		return technology.name.toUpperCase();
        	}
        }
        return 'OTHERS';
    } else {
        return 'NOT_WORKING';
    }
}

// main program runner
const main = async () => {

	// authenticate the sheets API with credentials.json in the same directory
	const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    })
    const sheets = google.sheets({ version: "v4", auth: auth.getClient() });

    // grab the list of sites from the google sheet
    const sites = await sheets.spreadsheets.values.get({
        auth,
        spreadsheetId: Sheets_ID,
        range: []
    })

    // add each site's category to the output array
    for (let site of sites) {
    	let category = await assignCategory(site)
    	output.push([category])
    }

    // add the output array to the google sheet
    sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: Sheets_ID,
        range: [],
        valueInputOption: "USER_ENTERED",
        resource: {
            values: output
        }
    })
}

main();
