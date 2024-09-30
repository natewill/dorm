//The infamous mysterious matcher algorithm
const { MongoClient, ServerApiVersion } = require('mongodb');
const { spawn } = require('child_process');
const { Writable } = require('stream');

var databaseName = "Dormie"
var collectionName = "user_data4"
var pathToTopKRanker = 'top_k.py'
var apiKey = "mongodb+srv://natewilliams:admin@dormie.0whqn7z.mongodb.net/?retryWrites=true&w=majority&appName=Dormie"


//[{search_term: sports, querys: []}, {search_term: dorms, querys: []}]
async function MMA(username, search_array=[]) {

    const client = new MongoClient(apiKey, {
        serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        }
    });

    
    await client.connect();
    var database = await client.db(databaseName)
    var userdata = await database.collection(collectionName)
    const userDataFromMongo = await userdata.findOne({username: username}) //get the userdata of this user//get the vector embedding of this user

    
    //we need a way for you to filter the 
    const dataAsArray = JSON.stringify({...userDataFromMongo, search_array});//turn that vector embedding into json so we can port it to our python script
    const pythonProcess = await spawn('python3', [pathToTopKRanker]);//port it to our python script


    //search_dict is gonna be
    //[{search_term: sports, querys: []}, {search_term: dorms, querys: []}]
    pythonProcess.stdin.write(dataAsArray);//write out json to the std input in python
    pythonProcess.stdin.end() //close the std in

    var usersFromPython = await new Promise((resolve, reject) => {
        let result = '';
        let errorOutput = '';
        // Capture stdout data
        pythonProcess.stdout.on('data', async (data) => {
            result += await data.toString();  // Collect the data from the Python process
        });

        // Handle process exit and resolve the promise with the data
        pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            console.log("Python script finished successfully.");
            resolve(result)
        } else {
            console.error(`Python process exited with code ${code}`);
            console.error("Error Output:", errorOutput);  // Print any errors encountered in Python
            reject(errorOutput)
        }
    })
    });

    usersFromPython = usersFromPython.replace(/'/g, '"').replace()
    usersFromPython = JSON.parse(usersFromPython)
    const filteredArray = usersFromPython.map(({vector, ...rest }) => rest)

    return filteredArray
}

module.exports = MMA
